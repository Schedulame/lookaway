import type { Settings } from './types'

export const LS_KEYS = {
  SETTINGS: 'lookaway:settings',
  STATS: 'lookaway:stats',
} as const

export const DEFAULTS: Settings = {
  eyeIntervalMs: 20 * 60 * 1000,
  eyeCountdownMs: 20 * 1000,
  breakIntervalMs: 90 * 60 * 1000,
  minBreakDurationMs: 10 * 60 * 1000,
  awayThresholdMs: 5 * 60 * 1000,
}

export const RE_NOTIFY_DELAY_MS = 5 * 60 * 1000
export const FACE_DETECTION_INTERVAL_MS = 500
export const WORKER_TICK_MS = 250
export const STATS_MAX_DAYS = 8
export const WELCOME_BACK_SHOW_MS = 4000

export const EYE_RESET_ABSENCE_MS = 20 * 1000

export const PRESENCE_DETECT_FRAMES = 3
export const PRESENCE_ABSENT_FRAMES = 2

export const NOTIFICATION_TAGS = {
  EYE: 'lookaway-eye',
  BREAK: 'lookaway-break',
} as const
