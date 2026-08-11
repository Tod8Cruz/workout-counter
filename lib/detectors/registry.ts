import { LM } from '@/lib/pose/landmarks';
import type { ExerciseDetector } from './types';
import { createSquatDetector } from './squat';
import { createPushupDetector } from './pushup';
import { createRowDetector } from './row';
import { createDeadhangDetector } from './deadhang';
import { createPlankDetector } from './plank';
import { createSidePlankDetector } from './sidePlank';
import { createSingleLegStandDetector } from './singleLegStand';

export type ExerciseId =
  | 'squat'
  | 'pushup'
  | 'row'
  | 'deadhang'
  | 'plank'
  | 'sideplank'
  | 'singleleg';

export interface ExerciseMeta {
  id: ExerciseId;
  nameKo: string;
  purposeKo: string;
  kind: 'rep' | 'hold';
  /** 폰 배치 안내 */
  cameraSetupKo: string;
  cameraIcon: string;
  /** 전신 체크용 랜드마크 체인 — 하나라도 전부 보이면 통과 (측면 뷰는 좌/우 분리) */
  requiredChains: number[][];
  /** 수동 +/- 보정 버튼 강조 표시 */
  manualAdjust?: boolean;
  create(): ExerciseDetector;
}

export const EXERCISES: Record<ExerciseId, ExerciseMeta> = {
  squat: {
    id: 'squat',
    nameKo: '스쿼트',
    purposeKo: '허벅지·엉덩이',
    kind: 'rep',
    cameraSetupKo: '폰을 세워 두고 2~3m 떨어져 정면으로 서세요. 전신이 화면에 들어와야 합니다.',
    cameraIcon: '🧍',
    requiredChains: [
      [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
    ],
    create: createSquatDetector,
  },
  pushup: {
    id: 'pushup',
    nameKo: '푸시업',
    purposeKo: '어깨·상체',
    kind: 'rep',
    cameraSetupKo: '폰을 바닥에 세워 두고, 옆모습이 보이도록 푸시업 자세를 잡으세요.',
    cameraIcon: '🙇',
    requiredChains: [
      [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_HIP, LM.LEFT_ANKLE],
      [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_HIP, LM.RIGHT_ANKLE],
    ],
    create: createPushupDetector,
  },
  row: {
    id: 'row',
    nameKo: '덤벨/밴드 로우',
    purposeKo: '등·광배',
    kind: 'rep',
    cameraSetupKo: '폰을 허리 높이에 두고 옆모습이 보이게 서세요. 인식이 어려우면 +/- 버튼으로 보정하세요.',
    cameraIcon: '🏋️',
    requiredChains: [
      [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_HIP],
      [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, LM.RIGHT_HIP],
    ],
    manualAdjust: true,
    create: createRowDetector,
  },
  deadhang: {
    id: 'deadhang',
    nameKo: '데드행',
    purposeKo: '그립·전완',
    kind: 'hold',
    cameraSetupKo: '철봉과 매달린 전신이 모두 보이도록 폰을 3m 이상 멀리 두세요.',
    cameraIcon: '🙆',
    requiredChains: [
      [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_HIP, LM.RIGHT_HIP],
    ],
    create: createDeadhangDetector,
  },
  plank: {
    id: 'plank',
    nameKo: '플랭크',
    purposeKo: '코어',
    kind: 'hold',
    cameraSetupKo: '폰을 바닥에 세워 두고, 옆모습 전신이 보이도록 플랭크 자세를 잡으세요.',
    cameraIcon: '🧘',
    requiredChains: [
      [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_ANKLE],
      [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_ANKLE],
    ],
    create: createPlankDetector,
  },
  sideplank: {
    id: 'sideplank',
    nameKo: '사이드 플랭크',
    purposeKo: '측면 코어',
    kind: 'hold',
    cameraSetupKo: '폰을 바닥에 세워 두고, 몸 앞쪽에서 전신이 보이게 하세요.',
    cameraIcon: '🤸',
    requiredChains: [
      [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_HIP, LM.LEFT_ANKLE],
      [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_HIP, LM.RIGHT_ANKLE],
    ],
    create: createSidePlankDetector,
  },
  singleleg: {
    id: 'singleleg',
    nameKo: '한발 서기',
    purposeKo: '균형',
    kind: 'hold',
    cameraSetupKo: '폰을 세워 두고 전신이 보이게 정면으로 서세요.',
    cameraIcon: '🦩',
    requiredChains: [
      [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
    ],
    create: createSingleLegStandDetector,
  },
};
