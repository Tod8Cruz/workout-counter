'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { createInitialState, routineReducer } from './machine';
import type { RoutineEvent, RoutineState, RoutineStep } from './types';

const COUNTDOWN_SEC = 3;
const SETDONE_MS = 2000;

export function useRoutine(steps: RoutineStep[]) {
  const [state, dispatch] = useReducer(
    (s: RoutineState, e: RoutineEvent) => routineReducer(s, e, steps),
    undefined,
    createInitialState,
  );
  const [countdownLeft, setCountdownLeft] = useState(COUNTDOWN_SEC);
  const [restLeft, setRestLeft] = useState(0);
  const pausedRef = useRef(state.paused);
  pausedRef.current = state.paused;

  // 시작 카운트다운 (3-2-1)
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    setCountdownLeft(COUNTDOWN_SEC);
    let left = COUNTDOWN_SEC;
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      left -= 1;
      setCountdownLeft(left);
      if (left <= 0) {
        clearInterval(iv);
        dispatch({ type: 'COUNTDOWN_DONE' });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [state.phase, state.stepIdx, state.setIdx]);

  // 세트 완료 표시 후 자동 진행
  useEffect(() => {
    if (state.phase !== 'setdone') return;
    const t = setTimeout(() => dispatch({ type: 'SET_DONE_ACK' }), SETDONE_MS);
    return () => clearTimeout(t);
  }, [state.phase, state.results.length]);

  // 휴식 타이머
  useEffect(() => {
    if (state.phase !== 'rest') return;
    const restSec = steps[state.stepIdx]?.restSec ?? 60;
    setRestLeft(restSec);
    let left = restSec;
    const iv = setInterval(() => {
      if (pausedRef.current) return;
      left -= 1;
      setRestLeft(left);
      if (left <= 0) {
        clearInterval(iv);
        dispatch({ type: 'REST_DONE' });
      }
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.results.length]);

  return { state, dispatch, countdownLeft, restLeft };
}
