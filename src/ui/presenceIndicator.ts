import type { AppState } from '../types'

export function renderPresenceIndicator(state: AppState): void {
  const dot   = document.getElementById('presence-dot')
  const label = document.getElementById('presence-label')
  if (!dot || !label) return

  dot.className = 'presence-dot'

  if (state.cameraStatus === 'pending') {
    dot.classList.add('pending')
    label.textContent = 'Initializing...'
  } else if (state.cameraStatus === 'denied') {
    dot.classList.add('denied')
    label.textContent = 'Camera denied · Timer only'
  } else if (state.cameraStatus === 'error') {
    dot.classList.add('denied')
    label.textContent = 'Camera error · Timer only'
  } else if (state.facePresent) {
    dot.classList.add('present')
    label.textContent = 'Webcam · Present'
  } else {
    dot.classList.add('absent')
    label.textContent = 'Webcam · Away'
  }
}
