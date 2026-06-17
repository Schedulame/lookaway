import { getSettings } from '../../state/settings'
import type { AppState } from '../../types'
import { formatDuration, formatMinutes } from '../../utils/dateUtils'
import { renderPresenceIndicator } from '../presenceIndicator'

const EYE_C   = 753.98  // 2π * 120
const BREAK_C = 942.48  // 2π * 150

export function renderStatusPanel(state: AppState): void {
  renderPresenceIndicator(state)
  renderEyeTimer(state)
  renderBreakTimer(state)
  renderWelcomeBack(state)
}

function renderEyeTimer(state: AppState): void {
  const settings = getSettings()
  const { eyeTimer } = state

  const arcEl  = document.getElementById('eye-arc')
  const timeEl = document.getElementById('eye-time')
  const phaseEl = document.getElementById('eye-phase')
  if (!arcEl || !timeEl || !phaseEl) return

  arcEl.classList.remove('ring-arc--urgent')

  if (eyeTimer.phase === 'RUNNING') {
    const remaining = Math.max(0, settings.eyeIntervalMs - eyeTimer.elapsedMs)
    const progress  = eyeTimer.elapsedMs / settings.eyeIntervalMs
    arcEl.setAttribute('stroke-dashoffset', String(EYE_C * (1 - progress)))
    timeEl.textContent  = formatMinutes(remaining)
    phaseEl.textContent = 'eye break'
  } else if (eyeTimer.phase === 'NOTIFYING') {
    arcEl.setAttribute('stroke-dashoffset', '0')
    arcEl.classList.add('ring-arc--urgent')
    timeEl.textContent  = 'now!'
    phaseEl.textContent = 'look away'
  } else if (eyeTimer.phase === 'COUNTDOWN') {
    arcEl.setAttribute('stroke-dashoffset', '0')
    timeEl.textContent  = formatMinutes(eyeTimer.countdownRemainingMs)
    phaseEl.textContent = 'looking away'
  } else if (eyeTimer.phase === 'PAUSED') {
    const remaining = Math.max(0, settings.eyeIntervalMs - eyeTimer.elapsedMs)
    timeEl.textContent  = formatMinutes(remaining)
    phaseEl.textContent = 'away'
  } else {
    arcEl.setAttribute('stroke-dashoffset', String(EYE_C))
    timeEl.textContent  = '--:--'
    phaseEl.textContent = 'eye break'
  }
}

function renderBreakTimer(state: AppState): void {
  const settings = getSettings()
  const { breakTimer } = state

  const arcEl  = document.getElementById('break-arc')
  const timeEl = document.getElementById('break-time')
  const phaseEl = document.getElementById('break-phase')
  if (!arcEl || !timeEl || !phaseEl) return

  arcEl.classList.remove('ring-arc--urgent')

  if (breakTimer.phase === 'RUNNING') {
    const remaining = Math.max(0, settings.breakIntervalMs - breakTimer.elapsedMs)
    const progress  = breakTimer.elapsedMs / settings.breakIntervalMs
    arcEl.setAttribute('stroke-dashoffset', String(BREAK_C * (1 - progress)))
    timeEl.textContent  = formatDuration(remaining)
    phaseEl.textContent = 'long break'
  } else if (breakTimer.phase === 'NOTIFYING') {
    arcEl.setAttribute('stroke-dashoffset', '0')
    arcEl.classList.add('ring-arc--urgent')
    timeEl.textContent  = 'now!'
    phaseEl.textContent = 'take a break'
  } else if (breakTimer.phase === 'PAUSED') {
    const absenceMs  = state.absenceElapsedMs
    const progress   = Math.min(1, absenceMs / settings.minBreakDurationMs)
    const remaining  = Math.max(0, settings.minBreakDurationMs - absenceMs)
    arcEl.setAttribute('stroke-dashoffset', String(BREAK_C * (1 - progress)))
    timeEl.textContent  = remaining > 0 ? formatDuration(remaining) : 'done!'
    phaseEl.textContent = 'on break'
  } else {
    arcEl.setAttribute('stroke-dashoffset', String(BREAK_C))
    timeEl.textContent  = '--'
    phaseEl.textContent = 'long break'
  }
}

function renderWelcomeBack(state: AppState): void {
  const el = document.getElementById('welcome-back')
  if (!el) return
  if (state.showWelcomeBack && state.lastAbsenceDurationMs !== null) {
    el.textContent = `Welcome back! Away for ${formatDuration(state.lastAbsenceDurationMs)}.`
    el.classList.remove('hidden')
  } else {
    el.classList.add('hidden')
  }
}
