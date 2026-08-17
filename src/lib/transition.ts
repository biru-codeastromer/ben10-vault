/**
 * Era transition store — a tiny external store driving the full-screen Omnitrix flash that
 * plays between the homepage and an era wall.
 */
import { useSyncExternalStore } from 'react';
import type { SeriesId } from '../data/schema';

export interface TransitionState {
  phase: 'idle' | 'in' | 'out';
  era: SeriesId | null;
  origin: { x: number; y: number };
  key: number;
}

let state: TransitionState = { phase: 'idle', era: null, origin: { x: 0.5, y: 0.5 }, key: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<TransitionState>) => {
  state = { ...state, ...patch };
  emit();
};

export function useTransitionState(): TransitionState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

/**
 * Flash in from `origin` (viewport fractions), call `navigate` at the peak, then fade out.
 * Timing is tuned to the activation sound (~1.2s) without making the user wait for it.
 */
export function runEraTransition(era: SeriesId, origin: { x: number; y: number }, navigate: () => void) {
  if (state.phase !== 'idle') return;
  set({ phase: 'in', era, origin, key: state.key + 1 });
  window.setTimeout(() => {
    navigate();
    window.scrollTo({ top: 0, behavior: 'auto' });
    set({ phase: 'out' });
    window.setTimeout(() => set({ phase: 'idle', era: null }), 700);
  }, 520);
}
