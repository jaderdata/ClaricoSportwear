import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { historyReducer } from './useHistoryState';
import { useHistoryState } from './useHistoryState';

describe('historyReducer', () => {
  it('pushes the previous present onto past and clears future on SET', () => {
    const state = { past: [], present: 1, future: [2] };
    const result = historyReducer(state, { type: 'SET', value: 5 });
    expect(result).toEqual({ past: [1], present: 5, future: [] });
  });

  it('is a no-op when SET receives the same value (referential equality)', () => {
    const value = { a: 1 };
    const state = { past: [], present: value, future: [] };
    const result = historyReducer(state, { type: 'SET', value });
    expect(result).toBe(state);
  });

  it('UNDO moves present back into future and pops from past', () => {
    const state = { past: [1, 2], present: 3, future: [] };
    const result = historyReducer(state, { type: 'UNDO' });
    expect(result).toEqual({ past: [1], present: 2, future: [3] });
  });

  it('UNDO is a no-op with empty past', () => {
    const state = { past: [], present: 1, future: [] };
    expect(historyReducer(state, { type: 'UNDO' })).toBe(state);
  });

  it('REDO moves the next future value back into present', () => {
    const state = { past: [1], present: 2, future: [3, 4] };
    const result = historyReducer(state, { type: 'REDO' });
    expect(result).toEqual({ past: [1, 2], present: 3, future: [4] });
  });

  it('REDO is a no-op with empty future', () => {
    const state = { past: [1], present: 2, future: [] };
    expect(historyReducer(state, { type: 'REDO' })).toBe(state);
  });

  it('RESET clears past/future and sets a new present', () => {
    const state = { past: [1], present: 2, future: [3] };
    const result = historyReducer(state, { type: 'RESET', value: 9 });
    expect(result).toEqual({ past: [], present: 9, future: [] });
  });
});

describe('useHistoryState', () => {
  it('exposes canUndo/canRedo and supports a full set -> undo -> redo cycle', () => {
    const { result } = renderHook(() => useHistoryState(0));

    expect(result.current.present).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.set(1));
    act(() => result.current.set(2));
    expect(result.current.present).toBe(2);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.present).toBe(1);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.present).toBe(2);
    expect(result.current.canRedo).toBe(false);
  });
});
