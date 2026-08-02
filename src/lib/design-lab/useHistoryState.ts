import { useCallback, useReducer } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export type HistoryAction<T> = { type: 'SET'; value: T } | { type: 'UNDO' } | { type: 'REDO' } | { type: 'RESET'; value: T };

export function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case 'SET': {
      if (action.value === state.present) return state;
      return { past: [...state.past, state.present], present: action.value, future: [] };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest };
    }
    case 'RESET':
      return { past: [], present: action.value, future: [] };
    default:
      return state;
  }
}

export function useHistoryState<T>(initial: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, { past: [], present: initial, future: [] });

  const set = useCallback((value: T) => dispatch({ type: 'SET', value }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const reset = useCallback((value: T) => dispatch({ type: 'RESET', value }), []);

  return {
    present: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
