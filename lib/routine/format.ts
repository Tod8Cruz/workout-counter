import { EXERCISES } from '@/lib/detectors/registry';
import type { RoutineItem } from './custom';

export function targetLabel(item: RoutineItem): string {
  const meta = EXERCISES[item.exerciseId];
  const unit = meta.kind === 'rep' ? '회' : '초';
  return `${item.value}${unit} × ${item.sets}${meta.perSide ? ' (좌우)' : ''}`;
}
