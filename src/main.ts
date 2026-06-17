import './style.css'
import { NOTIFICATION_TAGS, RE_NOTIFY_DELAY_MS, WELCOME_BACK_SHOW_MS } from './constants'
import { startCamera } from './camera/cameraManager'
import { getAbsenceDurationMs } from './camera/facePresence'
import {
  dismissNotification,
  requestPermission,
  showNotification,
} from './notifications/notificationManager'
import { getSettings } from './state/settings'
import { recordEvent } from './state/stats'
import { getAppState, subscribeAppState, updateAppState } from './state/appState'
import {
  getBreakTimerState,
  onLongAbsenceDetected,
  pauseBreakTimer,
  resumeBreakTimer,
  startBreakTimer,
  tickBreakTimer,
} from './timers/breakTimer'
import {
  getEyeTimerState,
  onEyeNotificationDismissed,
  pauseEyeTimer,
  resetEyeTimer,
  resumeEyeTimer,
  startEyeTimer,
  tickEyeTimer,
} from './timers/eyeTimer'
import TimerWorker from './timers/timer.worker.ts?worker'
import { clearBadge, incrementBadge } from './ui/tabBadge'
import { hide as hideOverlay, showOverlay } from './ui/overlay'
import { closePip, endPipEyeBreak, isPipOpen, openPip, startPipEyeBreak, updatePip } from './ui/pip'
import { createCharacter, type CharacterInstance } from './ui/character'
import { createPlasma } from './ui/plasma'
import { initSettingsPanel } from './ui/panels/settingsPanel'
import { renderStatusPanel } from './ui/panels/statusPanel'
import { initStatsPanel, renderStatsPanel } from './ui/panels/statsPanel'
import { on } from './utils/eventBus'

// ── Secure context warning ─────────────────────────────────────────────────────
if (!window.isSecureContext) {
  const el = document.getElementById('secure-warning')
  if (el) el.style.display = 'block'
}

// ── Nav tabs ───────────────────────────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('.nav-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.panel
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'))
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(`panel-${target}`)?.classList.add('active')
    if (target === 'stats') renderStatsPanel()
  })
})

// ── Settings + stats panels ────────────────────────────────────────────────────
initSettingsPanel()
initStatsPanel()

// ── Character (main page) ──────────────────────────────────────────────────────
let mainChar: CharacterInstance | null = null

function computeFatiguePct(): number {
  const { breakTimer } = getAppState()
  const settings = getSettings()
  if (breakTimer.phase === 'NOTIFYING') return 100
  if (breakTimer.phase === 'RUNNING' || breakTimer.phase === 'PAUSED')
    return Math.min(100, (breakTimer.elapsedMs / settings.breakIntervalMs) * 100)
  return 0
}

// ── App state → re-render status panel + PiP ──────────────────────────────────
subscribeAppState((state) => {
  renderStatusPanel(state)
  if (isPipOpen()) updatePip(state)
  mainChar?.setFatigue(computeFatiguePct())
  mainChar?.setEyeAlert(state.eyeTimer.phase === 'NOTIFYING')
})

// ── Absence tracking (for per-absence deduplication of stats) ─────────────────
let absenceTotalMs = 0
let absenceActualStartMs = 0
let eyeBreakRecordedThisAbsence = false
let longBreakRecordedThisAbsence = false

// ── Web Worker timer ───────────────────────────────────────────────────────────
const worker = new TimerWorker()

worker.addEventListener('message', (e: MessageEvent) => {
  if (e.data.type !== 'TICK') return
  const { deltaMs } = e.data as { deltaMs: number }

  const appState = getAppState()
  if (!appState.facePresent && appState.cameraStatus === 'active') return

  const eyeState = tickEyeTimer(deltaMs)
  const breakState = tickBreakTimer(deltaMs)
  recordEvent({ type: 'ACTIVE_TIME_ELAPSED', ms: deltaMs })
  updateAppState({ eyeTimer: eyeState, breakTimer: breakState })
})

// ── Face presence events ───────────────────────────────────────────────────────
on('FACE_PRESENT', ({ durationMs }) => {
  const settings = getSettings()

  const exactAbsenceMs = absenceActualStartMs > 0 ? Date.now() - absenceActualStartMs : 0

  if (exactAbsenceMs >= settings.awayThresholdMs) {
    recordEvent({ type: 'AWAY_TIME_ELAPSED', ms: exactAbsenceMs })
  }

  updateAppState({
    facePresent: true,
    absenceElapsedMs: 0,
    lastAbsenceDurationMs: durationMs > 0 ? durationMs : null,
    showWelcomeBack: durationMs >= settings.awayThresholdMs,
  })

  if (durationMs >= settings.eyeCountdownMs) {
    if (!eyeBreakRecordedThisAbsence) {
      recordEvent({ type: 'EYE_BREAK_COMPLETED' })
    }
    eyeBreakRecordedThisAbsence = false
    resetEyeTimer()
  } else {
    resumeEyeTimer()
  }
  resumeBreakTimer()
  worker.postMessage({ type: 'RESUME' })

  if (getAppState().showWelcomeBack) {
    setTimeout(() => updateAppState({ showWelcomeBack: false }), WELCOME_BACK_SHOW_MS)
  }
})

on('FACE_ABSENT', () => {
  absenceActualStartMs = Date.now()
  eyeBreakRecordedThisAbsence = false
  // Preserve absenceTotalMs and longBreakRecordedThisAbsence during an ongoing
  // long break session (NOTIFYING = break needed but not yet taken).
  // Reset only when no break is pending so stale progress doesn't carry over.
  if (getBreakTimerState().phase !== 'NOTIFYING') {
    absenceTotalMs = 0
    longBreakRecordedThisAbsence = false
  }
  updateAppState({ facePresent: false })
  pauseEyeTimer()
  pauseBreakTimer()
  worker.postMessage({ type: 'PAUSE' })
  updateAppState({ eyeTimer: getEyeTimerState(), breakTimer: getBreakTimerState() })
})

on('AWAY_THRESHOLD_REACHED', ({ totalAwayMs }) => {
  absenceTotalMs += totalAwayMs

  const settings = getSettings()

  if (!longBreakRecordedThisAbsence && absenceTotalMs >= settings.minBreakDurationMs) {
    longBreakRecordedThisAbsence = true
    onLongAbsenceDetected()
    dismissNotification(NOTIFICATION_TAGS.BREAK)
    updateAppState({ breakTimer: getBreakTimerState() })
  }

  if (!eyeBreakRecordedThisAbsence) {
    eyeBreakRecordedThisAbsence = true
    recordEvent({ type: 'EYE_BREAK_COMPLETED' })
  }
  resetEyeTimer()
  dismissNotification(NOTIFICATION_TAGS.EYE)
  hideOverlay()
  clearBadge()
  updateAppState({ eyeTimer: getEyeTimerState() })
})

// ── Eye timer events ───────────────────────────────────────────────────────────
on('EYE_REMINDER_FIRED', () => {
  const settings = getSettings()
  const sec = Math.round(settings.eyeCountdownMs / 1000)
  recordEvent({ type: 'EYE_REMINDER_RECEIVED' })
  showNotification(
    NOTIFICATION_TAGS.EYE,
    '👁 Eye Break',
    `Look at something 20 feet away for ${sec} seconds.`,
    RE_NOTIFY_DELAY_MS
  )
  updateAppState({ eyeTimer: getEyeTimerState() })
})

on('EYE_COUNTDOWN_STARTED', () => {
  const settings = getSettings()
  showOverlay(settings.eyeCountdownMs, () => {})
  mainChar?.startEyeBreak()
  startPipEyeBreak()
})

on('EYE_COUNTDOWN_COMPLETE', () => {
  recordEvent({ type: 'EYE_BREAK_COMPLETED' })
  hideOverlay()
  clearBadge()
  updateAppState({ eyeTimer: getEyeTimerState() })
  mainChar?.endEyeBreak()
  endPipEyeBreak()
})

// ── Break timer events ─────────────────────────────────────────────────────────
on('BREAK_REMINDER_FIRED', () => {
  const settings = getSettings()
  const min = Math.round(settings.breakIntervalMs / 60000)
  recordEvent({ type: 'BREAK_REMINDER_RECEIVED' })
  showNotification(
    NOTIFICATION_TAGS.BREAK,
    '☕ Time for a Break',
    `You've been working for ${min} minutes. Stand up and take a break!`,
    RE_NOTIFY_DELAY_MS
  )
  updateAppState({ breakTimer: getBreakTimerState() })
})

on('BREAK_COMPLETED', () => {
  absenceTotalMs = 0
  longBreakRecordedThisAbsence = false
  recordEvent({ type: 'LONG_BREAK_COMPLETED' })
  clearBadge()
  updateAppState({ breakTimer: getBreakTimerState() })
})


// ── Notification dismiss → timer transitions ───────────────────────────────────
on('NOTIFICATION_DISMISSED', ({ tag }) => {
  if (tag === NOTIFICATION_TAGS.EYE) {
    onEyeNotificationDismissed()
    clearBadge()
    updateAppState({ eyeTimer: getEyeTimerState() })
  } else if (tag === NOTIFICATION_TAGS.BREAK) {
    clearBadge()
  }
})

// ── Re-notify ──────────────────────────────────────────────────────────────────
on('RE_NOTIFY', ({ tag }) => {
  incrementBadge()
  if (tag === NOTIFICATION_TAGS.EYE) {
    const sec = Math.round(getSettings().eyeCountdownMs / 1000)
    showNotification(
      NOTIFICATION_TAGS.EYE,
      '👁 Eye Break — Still Waiting',
      `Please look 20 feet away for ${sec} seconds!`,
      RE_NOTIFY_DELAY_MS
    )
  } else if (tag === NOTIFICATION_TAGS.BREAK) {
    showNotification(
      NOTIFICATION_TAGS.BREAK,
      '☕ Break Reminder',
      'Please take a break — you need it!',
      RE_NOTIFY_DELAY_MS
    )
  }
})

// ── Notification permission bar ────────────────────────────────────────────────
function renderNotifStatus(): void {
  const el = document.getElementById('notif-status')
  if (!el) return
  const perm = 'Notification' in window ? Notification.permission : 'unsupported'
  if (perm === 'granted') {
    el.innerHTML = ''
    el.style.display = 'none'
  } else if (perm === 'denied') {
    el.style.display = 'flex'
    el.className = 'notif-status-bar notif-status-bar--denied'
    el.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
      <span>Notifications blocked</span>
      <span>·</span>
      <span>Re-enable in your browser's site settings, then reload.</span>
    `
  } else {
    el.style.display = 'flex'
    el.className = 'notif-status-bar'
    el.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span>Desktop notifications are off</span>
      <button id="enable-notif-btn" class="btn-notif-enable">Enable</button>
    `
    document.getElementById('enable-notif-btn')?.addEventListener('click', async () => {
      const granted = await requestPermission()
      if (granted) renderNotifStatus()
    })
  }
}

// ── Live absence timer (updates absenceElapsedMs every second while away) ─────
setInterval(() => {
  if (!getAppState().facePresent) {
    updateAppState({ absenceElapsedMs: absenceTotalMs + getAbsenceDurationMs() })
  }
}, 1000)

// ── Camera + startup ───────────────────────────────────────────────────────────
async function init() {
  if (window.isSecureContext) {
    await startCamera()
  } else {
    updateAppState({ cameraStatus: 'denied', facePresent: true })
  }

  const appState = getAppState()

  if (appState.cameraStatus === 'denied' || appState.cameraStatus === 'error') {
    updateAppState({ facePresent: true })
    document.getElementById('camera-request')!.style.display = 'block'
  }

  document.getElementById('grant-camera-btn')?.addEventListener('click', async () => {
    await startCamera()
    const s = getAppState()
    if (s.cameraStatus === 'active') {
      document.getElementById('camera-request')!.style.display = 'none'
    }
  })

  const prismContainer = document.getElementById('prism-bg')
  if (prismContainer) {
    createPlasma(prismContainer as HTMLElement, {
      color: '#ffffff',
      speed: 0.5,
      direction: 'forward',
      scale: 0.75,
      opacity: 1.0,
      mouseInteractive: false,
      renderScale: 0.6,
      maxFps: 30,
    })
  }

  const charContainer = document.getElementById('main-char')
  if (charContainer) mainChar = createCharacter(charContainer as HTMLElement, 100)

  startEyeTimer()
  startBreakTimer()
  worker.postMessage({ type: 'START' })
  updateAppState({ eyeTimer: getEyeTimerState(), breakTimer: getBreakTimerState() })

  renderNotifStatus()

  // ── PiP button ───────────────────────────────────────────────────────────────
  const pipBtn = document.getElementById('pip-btn')
  if (!('documentPictureInPicture' in window)) {
    pipBtn?.setAttribute('title', 'Requires Chrome 116+')
    pipBtn?.setAttribute('disabled', '')
  } else {
    pipBtn?.addEventListener('click', async () => {
      if (isPipOpen()) {
        closePip()
        pipBtn!.classList.remove('active')
        document.getElementById('pip-btn-label')!.textContent = 'Float'
      } else {
        const ok = await openPip()
        if (ok) {
          pipBtn!.classList.add('active')
          document.getElementById('pip-btn-label')!.textContent = 'Floating'
          updatePip(getAppState())
          const poll = setInterval(() => {
            if (!isPipOpen()) {
              pipBtn!.classList.remove('active')
              document.getElementById('pip-btn-label')!.textContent = 'Float'
              clearInterval(poll)
            }
          }, 500)
        }
      }
    })
  }
}

init()
