import { RE_NOTIFY_DELAY_MS } from '../constants'
import { getSettings } from '../state/settings'
import type { TimerPhase, TimerState } from '../types'
import { emit } from '../utils/eventBus'

let state: TimerState = {
  phase: 'IDLE',
  elapsedMs: 0,
  countdownRemainingMs: 0,
  notificationSentAt: null,
}

// Preserves phase through pause/resume so NOTIFYING is not lost
let pausedFromPhase: TimerPhase = 'RUNNING'

export function getEyeTimerState(): TimerState {
  return { ...state }
}

export function startEyeTimer(): void {
  state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
}

export function pauseEyeTimer(): void {
  if (state.phase !== 'IDLE' && state.phase !== 'PAUSED') {
    pausedFromPhase = state.phase
    state = { ...state, phase: 'PAUSED' }
  }
}

export function resumeEyeTimer(): void {
  if (state.phase === 'PAUSED') {
    state = { ...state, phase: pausedFromPhase }
  }
}

export function resetEyeTimer(): void {
  state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
  pausedFromPhase = 'RUNNING'
}

export function onEyeNotificationDismissed(): void {
  if (state.phase !== 'NOTIFYING') return
  const settings = getSettings()
  state = {
    ...state,
    phase: 'COUNTDOWN',
    countdownRemainingMs: settings.eyeCountdownMs,
    notificationSentAt: null,
  }
  emit('EYE_COUNTDOWN_STARTED')
}

export function tickEyeTimer(deltaMs: number): TimerState {
  const settings = getSettings()

  if (state.phase === 'RUNNING') {
    state = { ...state, elapsedMs: state.elapsedMs + deltaMs }
    if (state.elapsedMs >= settings.eyeIntervalMs) {
      state = { ...state, phase: 'NOTIFYING', notificationSentAt: Date.now() }
      emit('EYE_REMINDER_FIRED')
    }
  } else if (state.phase === 'NOTIFYING') {
    if (
      state.notificationSentAt !== null &&
      Date.now() - state.notificationSentAt >= RE_NOTIFY_DELAY_MS
    ) {
      state = { ...state, notificationSentAt: Date.now() }
      emit('RE_NOTIFY', { tag: 'lookaway-eye' })
    }
  } else if (state.phase === 'COUNTDOWN') {
    state = { ...state, countdownRemainingMs: state.countdownRemainingMs - deltaMs }
    if (state.countdownRemainingMs <= 0) {
      state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
      emit('EYE_COUNTDOWN_COMPLETE')
    }
  }

  return { ...state }
}
