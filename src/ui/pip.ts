import type { AppState } from '../types'
import { getSettings } from '../state/settings'
import { CHARACTER_CSS, createCharacter, type CharacterInstance } from './character'

let pipWin: Window | null = null
let pipChar: CharacterInstance | null = null

const PIP_BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #07080e;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    overflow: hidden;
    padding: 10px 0 8px;
  }
  .pip-char-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 0;
  }
  .pip-status-dots {
    display: flex;
    gap: 5px;
    align-items: center;
    flex-shrink: 0;
  }
  .pip-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    transition: background 0.4s, box-shadow 0.4s;
  }
  .pip-dot--eye   { background: #3a3a5a; }
  .pip-dot--break { background: #3a3a5a; }
  .pip-dot--eye.active   { background: #d0d0f0; box-shadow: 0 0 5px rgba(208,208,240,0.8); }
  .pip-dot--break.active { background: #6a6a98; box-shadow: 0 0 5px rgba(106,106,152,0.8); }
  .pip-dot--eye.urgent   { background: #e87878; box-shadow: 0 0 6px rgba(232,120,120,1); animation: pip-pulse 1s ease-in-out infinite; }
  .pip-dot--break.urgent { background: #e87878; box-shadow: 0 0 6px rgba(232,120,120,1); animation: pip-pulse 1s ease-in-out infinite; }
  @keyframes pip-pulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }
`

function buildPipShell(): string {
  return `
    <div class="pip-char-wrap" id="pip-char-wrap"></div>
    <div class="pip-status-dots">
      <div class="pip-dot pip-dot--eye"   id="pip-dot-eye"></div>
      <div class="pip-dot pip-dot--break" id="pip-dot-break"></div>
    </div>
  `
}

export async function openPip(): Promise<boolean> {
  if (!('documentPictureInPicture' in window)) return false

  try {
    pipWin = await (window as any).documentPictureInPicture.requestWindow({
      width: 110,
      height: 140,
      disallowReturnToOpener: false,
    })

    const style = pipWin!.document.createElement('style')
    style.textContent = PIP_BASE_STYLES + CHARACTER_CSS
    pipWin!.document.head.appendChild(style)

    pipWin!.document.body.innerHTML = buildPipShell()

    const charWrap = pipWin!.document.getElementById('pip-char-wrap') as HTMLElement
    pipChar = createCharacter(charWrap, 78, pipWin!.document)

    pipWin!.addEventListener('pagehide', () => { pipWin = null; pipChar = null })

    return true
  } catch {
    pipWin = null
    pipChar = null
    return false
  }
}

export function closePip(): void {
  pipChar = null
  pipWin?.close()
  pipWin = null
}

export function isPipOpen(): boolean {
  return pipWin !== null
}

export function updatePip(state: AppState): void {
  if (!pipWin) return
  if (pipChar) {
    pipChar.setFatigue(computeFatiguePct(state))
    pipChar.setEyeAlert(state.eyeTimer.phase === 'NOTIFYING')
  }
  const eyeDot   = pipWin.document.getElementById('pip-dot-eye')
  const breakDot = pipWin.document.getElementById('pip-dot-break')
  if (eyeDot) {
    const ep = state.eyeTimer.phase
    eyeDot.className = 'pip-dot pip-dot--eye' +
      (ep === 'NOTIFYING' || ep === 'COUNTDOWN' ? ' urgent' : ep === 'RUNNING' ? ' active' : '')
  }
  if (breakDot) {
    const bp = state.breakTimer.phase
    breakDot.className = 'pip-dot pip-dot--break' +
      (bp === 'NOTIFYING' ? ' urgent' : bp === 'RUNNING' ? ' active' : '')
  }
}

function computeFatiguePct(state: AppState): number {
  const settings = getSettings()
  const brk = state.breakTimer
  if (brk.phase === 'NOTIFYING') return 100
  if (brk.phase === 'RUNNING' || brk.phase === 'PAUSED')
    return Math.min(100, (brk.elapsedMs / settings.breakIntervalMs) * 100)
  return 0
}

export function startPipEyeBreak(): void { pipChar?.startEyeBreak() }
export function endPipEyeBreak(): void   { pipChar?.endEyeBreak() }
