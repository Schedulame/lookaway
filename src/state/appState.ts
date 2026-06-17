import type { AppState, TimerState } from '../types'

const idleTimer = (): TimerState => ({
  phase: 'IDLE',
  elapsedMs: 0,
  countdownRemainingMs: 0,
  notificationSentAt: null,
})

let state: AppState = {
  facePresent: false,
  cameraStatus: 'pending',
  eyeTimer: idleTimer(),
  breakTimer: idleTimer(),
  absenceStartedAt: null,
  absenceElapsedMs: 0,
  breakProgressMs: 0,
  isOnBreak: false,
  lastAbsenceDurationMs: null,
  showWelcomeBack: false,
}

type Listener = (state: AppState) => void
const listeners = new Set<Listener>()

export function getAppState(): AppState {
  return state
}

export function updateAppState(partial: Partial<AppState>): void {
  state = { ...state, ...partial }
  listeners.forEach((l) => l(state))
}

export function subscribeAppState(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
