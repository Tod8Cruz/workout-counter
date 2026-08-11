import type { RoutineEvent, RoutineState, RoutineStep } from './types';

export function createInitialState(): RoutineState {
  return {
    phase: 'idle',
    stepIdx: 0,
    setIdx: 0,
    afterRest: 'nextSet',
    paused: false,
    results: [],
  };
}

export function routineReducer(
  state: RoutineState,
  event: RoutineEvent,
  steps: RoutineStep[],
): RoutineState {
  const step = steps[state.stepIdx];

  switch (event.type) {
    case 'START':
      return state.phase === 'idle' ? { ...state, phase: 'setup' } : state;

    case 'BODY_READY':
      return state.phase === 'setup' ? { ...state, phase: 'countdown' } : state;

    case 'COUNTDOWN_DONE':
      return state.phase === 'countdown' ? { ...state, phase: 'active' } : state;

    case 'SET_COMPLETE': {
      if (state.phase !== 'active') return state;
      return {
        ...state,
        phase: 'setdone',
        results: [
          ...state.results,
          {
            stepIdx: state.stepIdx,
            setIdx: state.setIdx,
            exerciseId: step.exerciseId,
            side: step.side,
            value: event.value,
          },
        ],
      };
    }

    case 'SET_DONE_ACK': {
      if (state.phase !== 'setdone') return state;
      if (state.setIdx + 1 < step.sets) {
        return { ...state, phase: 'rest', afterRest: 'nextSet' };
      }
      if (state.stepIdx + 1 < steps.length) {
        return { ...state, phase: 'rest', afterRest: 'nextStep' };
      }
      return { ...state, phase: 'done' };
    }

    case 'REST_DONE': {
      if (state.phase !== 'rest') return state;
      if (state.afterRest === 'nextSet') {
        return { ...state, phase: 'countdown', setIdx: state.setIdx + 1 };
      }
      return { ...state, phase: 'setup', stepIdx: state.stepIdx + 1, setIdx: 0 };
    }

    case 'SKIP_EXERCISE': {
      if (!['setup', 'countdown', 'active', 'rest', 'setdone'].includes(state.phase)) return state;
      if (state.stepIdx + 1 < steps.length) {
        return { ...state, phase: 'setup', stepIdx: state.stepIdx + 1, setIdx: 0, paused: false };
      }
      return { ...state, phase: 'done' };
    }

    case 'PAUSE':
      return { ...state, paused: true };
    case 'RESUME':
      return { ...state, paused: false };

    default:
      return state;
  }
}
