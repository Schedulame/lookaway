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

let pausedFromPhase: TimerPhase = 'RUNNING'

export function getBreakTimerState(): TimerState {
  return { ...state }
}

export function startBreakTimer(): void {
  state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
}

export function pauseBreakTimer(): void {
  if (state.phase !== 'IDLE' && state.phase !== 'PAUSED') {
    pausedFromPhase = state.phase
    state = { ...state, phase: 'PAUSED' }
  }
}

export function resumeBreakTimer(): void {
  if (state.phase === 'PAUSED') {
    state = { ...state, phase: pausedFromPhase }
  }
}

export function resetBreakTimer(): void {
  state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
  pausedFromPhase = 'RUNNING'
}

export function onBreakNotificationDismissed(): void {
  if (state.phase !== 'NOTIFYING') return
  state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
  emit('BREAK_SKIPPED')
}

export function onLongAbsenceDetected(): void {
  if (state.phase === 'NOTIFYING' || state.phase === 'RUNNING' || state.phase === 'PAUSED') {
    state = { phase: 'RUNNING', elapsedMs: 0, countdownRemainingMs: 0, notificationSentAt: null }
    emit('BREAK_COMPLETED')
  }
}

export function tickBreakTimer(deltaMs: number): TimerState {
  const settings = getSettings()

  if (state.phase === 'RUNNING') {
    state = { ...state, elapsedMs: state.elapsedMs + deltaMs }
    if (state.elapsedMs >= settings.breakIntervalMs) {
      state = { ...state, phase: 'NOTIFYING', notificationSentAt: Date.now() }
      emit('BREAK_REMINDER_FIRED')
    }
  } else if (state.phase === 'NOTIFYING') {
    if (
      state.notificationSentAt !== null &&
      Date.now() - state.notificationSentAt >= RE_NOTIFY_DELAY_MS
    ) {
      state = { ...state, notificationSentAt: Date.now() }
      emit('RE_NOTIFY', { tag: 'lookaway-break' })
    }
  }

  return { ...state }
}
