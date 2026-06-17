export type TimerPhase = 'IDLE' | 'RUNNING' | 'PAUSED' | 'NOTIFYING' | 'COUNTDOWN'

export interface TimerState {
  phase: TimerPhase
  elapsedMs: number
  countdownRemainingMs: number
  notificationSentAt: number | null
}

export interface Settings {
  eyeIntervalMs: number
  eyeCountdownMs: number
  breakIntervalMs: number
  minBreakDurationMs: number
}

export interface DayStats {
  dateKey: string
  eyeRemindersReceived: number
  eyeBreaksCompleted: number
  eyeBreaksSkipped: number
  breakRemindersReceived: number
  longBreaksCompleted: number
  longBreaksSkipped: number
  totalActiveMs: number
  totalAwayMs: number
}

export interface AppState {
  facePresent: boolean
  cameraStatus: 'pending' | 'active' | 'denied' | 'error'
  eyeTimer: TimerState
  breakTimer: TimerState
  absenceStartedAt: number | null
  absenceElapsedMs: number
  breakProgressMs: number
  isOnBreak: boolean
  lastAbsenceDurationMs: number | null
  showWelcomeBack: boolean
}

export type StatEvent =
  | { type: 'EYE_REMINDER_RECEIVED' }
  | { type: 'EYE_BREAK_COMPLETED' }
  | { type: 'EYE_BREAK_SKIPPED' }
  | { type: 'BREAK_REMINDER_RECEIVED' }
  | { type: 'LONG_BREAK_COMPLETED' }
  | { type: 'LONG_BREAK_SKIPPED' }
  | { type: 'ACTIVE_TIME_ELAPSED'; ms: number }
  | { type: 'AWAY_TIME_ELAPSED'; ms: number }

export type EventMap = {
  FACE_PRESENT: { durationMs: number }
  FACE_ABSENT: { durationMs: number }
  NOTIFICATION_DISMISSED: { tag: string }
  SETTINGS_CHANGED: Settings
  TIMER_TICK: { deltaMs: number }
  EYE_REMINDER_FIRED: void
  EYE_COUNTDOWN_STARTED: void
  EYE_COUNTDOWN_COMPLETE: void
  BREAK_REMINDER_FIRED: void
  BREAK_COMPLETED: void
  BREAK_SKIPPED: void
  RE_NOTIFY: { tag: string }
}
