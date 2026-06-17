import { PRESENCE_ABSENT_FRAMES, PRESENCE_DETECT_FRAMES } from '../constants'
import { getSettings } from '../state/settings'
import { emit } from '../utils/eventBus'

let presentCount = 0
let absentCount = 0
let isPresent = false
let absenceStartedAt: number | null = null
let forcedAbsent = false

export function onFaceDetected(): void {
  if (forcedAbsent) return
  presentCount++
  absentCount = 0
  if (!isPresent && presentCount >= PRESENCE_DETECT_FRAMES) {
    isPresent = true
    presentCount = 0
    const durationMs = absenceStartedAt !== null ? Date.now() - absenceStartedAt : 0
    absenceStartedAt = null
    emit('FACE_PRESENT')
    if (durationMs > 0) {
      // Presence restored — callers handle the duration via FACE_ABSENT that already fired
    }
  }
}

export function onFaceAbsent(force = false): void {
  if (force) {
    forcedAbsent = true
  }
  presentCount = 0
  absentCount++
  if ((isPresent || force) && (force || absentCount >= PRESENCE_ABSENT_FRAMES)) {
    if (isPresent) {
      isPresent = false
      absentCount = 0
      absenceStartedAt = Date.now()
      emit('FACE_ABSENT', { durationMs: 0 })
    }
    if (!isPresent && absenceStartedAt !== null) {
      const absenceDurationMs = Date.now() - absenceStartedAt
      const settings = getSettings()
      if (absenceDurationMs >= settings.awayThresholdMs) {
        emit('AWAY_THRESHOLD_REACHED', { totalAwayMs: absenceDurationMs })
        absenceStartedAt = Date.now() // reset to avoid repeated fires
      }
    }
  }
}

export function onFaceRestored(): void {
  forcedAbsent = false
  presentCount = 0
  absentCount = 0
}

export function checkAwayThreshold(): void {
  if (!isPresent && absenceStartedAt !== null) {
    const absenceDurationMs = Date.now() - absenceStartedAt
    const settings = getSettings()
    if (absenceDurationMs >= settings.awayThresholdMs) {
      emit('AWAY_THRESHOLD_REACHED', { totalAwayMs: absenceDurationMs })
      absenceStartedAt = Date.now()
    }
  }
}

export function getAbsenceDurationMs(): number {
  if (absenceStartedAt === null) return 0
  return Date.now() - absenceStartedAt
}

export function isFacePresent(): boolean {
  return isPresent
}
