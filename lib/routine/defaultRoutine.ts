import { DEFAULT_ITEMS, expandRoutine } from './custom';
import type { RoutineStep } from './types';

/** 로그인하지 않았거나 저장된 루틴이 없을 때 쓰는 기본 루틴 */
export const DEFAULT_ROUTINE: RoutineStep[] = expandRoutine(DEFAULT_ITEMS);
