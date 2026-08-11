'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EXERCISES } from '@/lib/detectors/registry';
import type { DetectorState, ExerciseDetector, PoseFrame } from '@/lib/detectors/types';
import { startCamera, stopCamera } from '@/lib/camera';
import { PoseEngine } from '@/lib/pose/engine';
import { drawPose, type PoseStatus } from '@/lib/pose/draw';
import { fullBodyCheck } from '@/lib/pose/fullBodyCheck';
import { DEFAULT_ROUTINE } from '@/lib/routine/defaultRoutine';
import { useRoutine } from '@/lib/routine/useRoutine';
import { ding, primeBeep } from '@/lib/speech/beep';
import { koCount, koSide } from '@/lib/speech/phrases.ko';
import { primeVoice, speak } from '@/lib/speech/voice';
import { saveSession } from '@/lib/storage/progress';
import { releaseWakeLock, requestWakeLock } from '@/lib/wakeLock';
import ControlBar from './ControlBar';
import DebugPanel from './DebugPanel';
import ExerciseHUD from './ExerciseHUD';
import RestScreen from './RestScreen';
import SetupGuide from './SetupGuide';
import SummaryScreen from './SummaryScreen';

const COUNTDOWN_KO = ['하나', '둘', '셋'];

export default function WorkoutScreen() {
  const steps = DEFAULT_ROUTINE;
  const { state, dispatch, countdownLeft, restLeft } = useRoutine(steps);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PoseEngine | null>(null);
  const detectorRef = useRef<ExerciseDetector | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const bodyOkRef = useRef(false);
  const bodySinceRef = useRef<number | null>(null);
  const holdAnnouncedRef = useRef(false);
  const lastHudRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [hud, setHud] = useState<DetectorState | null>(null);
  const [fps, setFps] = useState(0);
  const [bodyOk, setBodyOk] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has('debug'));
  }, []);

  const step = steps[state.stepIdx];
  const meta = step ? EXERCISES[step.exerciseId] : null;

  // 세트 시작(카운트다운 진입)마다 새 디텍터 생성
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    const m = EXERCISES[steps[state.stepIdx].exerciseId];
    detectorRef.current = m.create();
    holdAnnouncedRef.current = false;
    setHud(detectorRef.current.state());
  }, [state.phase, state.stepIdx, state.setIdx, steps]);

  // 프레임 처리: 오버레이 렌더 + 전신 체크 + 디텍터 업데이트
  const onFrame = useCallback(
    (frame: PoseFrame) => {
      const s = stateRef.current;
      const curStep = steps[s.stepIdx];
      const curMeta = curStep ? EXERCISES[curStep.exerciseId] : null;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (frame.t - lastHudRef.current > 150) {
        lastHudRef.current = frame.t;
        setFps(frame.fps);
        if (s.phase === 'active') setHud(detectorRef.current?.state() ?? null);
      }

      if (canvas && video) {
        let status: PoseStatus = 'idle';
        if (s.phase === 'active' && detectorRef.current) {
          const st = detectorRef.current.state();
          status = !st.confident ? 'warn' : st.kind === 'hold' && !st.holding ? 'idle' : 'good';
        } else if (s.phase === 'setup' && bodyOkRef.current) {
          status = 'good';
        }
        drawPose(canvas, video, frame, status);
      }
      if (!curStep || !curMeta) return;

      if (s.phase === 'setup') {
        const ok = fullBodyCheck(frame, curMeta.requiredChains);
        if (ok !== bodyOkRef.current) {
          bodyOkRef.current = ok;
          setBodyOk(ok);
        }
        if (ok) {
          bodySinceRef.current ??= frame.t;
          if (frame.t - bodySinceRef.current > 1000) {
            bodySinceRef.current = null;
            dispatch({ type: 'BODY_READY' });
          }
        } else {
          bodySinceRef.current = null;
        }
        return;
      }

      if (s.phase === 'active' && !s.paused) {
        const det = detectorRef.current;
        if (!det) return;
        const events = det.update(frame);
        for (const e of events) {
          if (e.type === 'rep') speak(koCount(e.count), 'count');
          else if (e.type === 'phase' && e.phase === 'bottom') ding(); // 깊이 달성 피드백
          else if (e.type === 'holdStarted') speak('측정 시작');
          else if (e.type === 'formHint') speak(e.messageKo);
        }
        const st = det.state();
        const target = curStep.target;
        if (
          target.type === 'hold' &&
          !holdAnnouncedRef.current &&
          st.holdMs >= target.minMs &&
          target.minMs < target.maxMs
        ) {
          holdAnnouncedRef.current = true;
          speak('목표 시간 도달');
        }
        const done =
          target.type === 'reps' ? st.reps >= target.max : st.holdMs >= target.maxMs;
        if (done) {
          dispatch({
            type: 'SET_COMPLETE',
            value: target.type === 'reps' ? st.reps : st.holdMs,
          });
        }
      }
    },
    [steps, dispatch],
  );
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  // 시작 버튼 — iOS 제스처 요구사항 때문에 카메라/음성 모두 여기서 시작
  const handleStart = async () => {
    setLoading(true);
    setCamError(null);
    primeVoice();
    primeBeep();
    try {
      await startCamera(videoRef.current!);
    } catch {
      setCamError('카메라를 사용할 수 없습니다. 브라우저 권한을 확인해 주세요.');
      setLoading(false);
      return;
    }
    try {
      const engine = new PoseEngine();
      await engine.init(videoRef.current!);
      engineRef.current = engine;
      engine.start((f) => onFrameRef.current(f));
    } catch (e) {
      console.error(e);
      setCamError('포즈 인식 모델을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
      setLoading(false);
      return;
    }
    requestWakeLock();
    setStarted(true);
    setLoading(false);
    dispatch({ type: 'START' });
  };

  // 페이즈 전환 음성 안내
  useEffect(() => {
    if (!started || !step || !meta) return;
    if (state.phase === 'setup') {
      bodyOkRef.current = false;
      bodySinceRef.current = null;
      setBodyOk(false);
      speak(`다음 운동, ${koSide(step.side)}${meta.nameKo}. ${meta.cameraSetupKo}`);
    } else if (state.phase === 'active') {
      speak('시작');
    } else if (state.phase === 'setdone') {
      speak(`${state.setIdx + 1}세트 완료`);
    } else if (state.phase === 'rest') {
      speak(`${step.restSec}초 휴식`);
    } else if (state.phase === 'done') {
      speak('오늘 운동 완료. 수고하셨습니다');
      saveSession(stateRef.current.results);
      releaseWakeLock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.stepIdx, state.setIdx, started]);

  // 카운트다운 음성 (셋, 둘, 하나)
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    if (countdownLeft >= 1 && countdownLeft <= 3) {
      speak(COUNTDOWN_KO[countdownLeft - 1], 'count');
    }
  }, [countdownLeft, state.phase]);

  // 휴식 카운트다운 음성
  useEffect(() => {
    if (state.phase !== 'rest') return;
    if (restLeft === 10) speak('10초 남았습니다');
    else if (restLeft >= 1 && restLeft <= 3) speak(String(restLeft), 'count');
  }, [restLeft, state.phase]);

  // 언마운트 정리
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      engineRef.current?.destroy();
      stopCamera(video);
      releaseWakeLock();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    };
  }, []);

  const nextStep =
    state.afterRest === 'nextStep' ? steps[state.stepIdx + 1] : steps[state.stepIdx];
  const nextLabel = nextStep
    ? `${koSide(nextStep.side)}${EXERCISES[nextStep.exerciseId].nameKo} ${
        state.afterRest === 'nextSet' ? `${state.setIdx + 2}세트` : ''
      }`.trim()
    : '';

  const completeSet = () => {
    const det = detectorRef.current;
    const st = det?.state();
    const t = step?.target;
    if (!t) return;
    dispatch({
      type: 'SET_COMPLETE',
      value: t.type === 'reps' ? (st?.reps ?? 0) : (st?.holdMs ?? 0),
    });
  };

  // 수동 보정도 목표 도달 시 자동 완료 (포즈 프레임 루프와 무관하게)
  const adjustReps = (d: number) => {
    const det = detectorRef.current;
    if (!det) return;
    det.adjust(d);
    const st = det.state();
    setHud(st);
    const t = step?.target;
    if (t?.type === 'reps' && st.reps >= t.max) {
      dispatch({ type: 'SET_COMPLETE', value: st.reps });
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-neutral-950 text-neutral-100">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />

      {debug && <DebugPanel fps={fps} phase={state.phase} hud={hud} />}

      {!started && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/90 p-6 text-center">
          <div className="mb-4 text-6xl">💪</div>
          <h1 className="mb-2 text-3xl font-black">오늘의 루틴</h1>
          <p className="mb-8 max-w-sm text-neutral-400">
            카메라가 자세를 인식해 자동으로 카운트합니다. 폰을 세워 두고 화면이 잘 보이는 곳에서
            시작하세요.
          </p>
          {camError && <p className="mb-4 font-semibold text-red-400">{camError}</p>}
          <button
            onClick={handleStart}
            disabled={loading}
            className="rounded-3xl bg-green-500 px-12 py-5 text-2xl font-black text-black active:bg-green-400 disabled:opacity-50"
          >
            {loading ? '모델 로딩 중…' : '운동 시작'}
          </button>
        </div>
      )}

      {started && state.phase === 'setup' && meta && (
        <SetupGuide
          meta={meta}
          side={step?.side}
          bodyOk={bodyOk}
          onManualStart={() => dispatch({ type: 'BODY_READY' })}
        />
      )}

      {state.phase === 'countdown' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-[12rem] font-black text-green-400 drop-shadow-lg">
            {Math.max(countdownLeft, 1)}
          </div>
        </div>
      )}

      {state.phase === 'active' && step && meta && (
        <ExerciseHUD
          step={step}
          meta={meta}
          setIdx={state.setIdx}
          hud={hud}
          onCompleteSet={completeSet}
          onAdjust={adjustReps}
        />
      )}

      {state.phase === 'setdone' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-3xl bg-green-500 px-10 py-6 text-4xl font-black text-black">
            {state.setIdx + 1}세트 완료! 🎉
          </div>
        </div>
      )}

      {state.phase === 'rest' && (
        <RestScreen
          restLeft={restLeft}
          nextLabel={nextLabel}
          onSkip={() => dispatch({ type: 'REST_DONE' })}
        />
      )}

      {state.phase === 'done' && <SummaryScreen results={state.results} />}

      {state.paused && state.phase !== 'done' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="text-4xl font-black">⏸ 일시정지</div>
        </div>
      )}

      {started && state.phase !== 'done' && (
        <ControlBar
          paused={state.paused}
          showSkipSet={state.phase === 'active'}
          onPauseToggle={() => dispatch({ type: state.paused ? 'RESUME' : 'PAUSE' })}
          onSkipSet={completeSet}
          onSkipExercise={() => dispatch({ type: 'SKIP_EXERCISE' })}
        />
      )}
    </div>
  );
}
