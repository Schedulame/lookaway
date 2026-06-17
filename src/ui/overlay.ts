let overlayEl: HTMLElement | null = null
let rafId: number | null = null
let onCompleteCallback: (() => void) | null = null
let startTime = 0
let durationMs = 0

export function showOverlay(duration: number, onComplete: () => void): void {
  hide()
  durationMs = duration
  onCompleteCallback = onComplete
  startTime = performance.now()

  overlayEl = document.createElement('div')
  overlayEl.id = 'eye-overlay'
  overlayEl.innerHTML = `
    <div class="overlay-inner">
      <svg class="countdown-ring" viewBox="0 0 120 120" width="180" height="180">
        <circle class="ring-bg" cx="60" cy="60" r="54" />
        <circle class="ring-progress" id="ring-progress" cx="60" cy="60" r="54"
          stroke-dasharray="339.29"
          stroke-dashoffset="0"
          transform="rotate(-90 60 60)" />
      </svg>
      <div class="overlay-count" id="overlay-count">20</div>
      <div class="overlay-label">Look at something<br>20 feet away</div>
    </div>
  `
  document.body.appendChild(overlayEl)
  rafId = requestAnimationFrame(animate)
}

function animate(now: number): void {
  const elapsed = now - startTime
  const remaining = Math.max(0, durationMs - elapsed)
  const progress = remaining / durationMs

  const ringEl = document.getElementById('ring-progress')
  const countEl = document.getElementById('overlay-count')
  const circumference = 339.29

  if (ringEl) {
    ringEl.setAttribute('stroke-dashoffset', String(circumference * (1 - progress)))
  }
  if (countEl) {
    countEl.textContent = String(Math.ceil(remaining / 1000))
  }

  if (remaining <= 0) {
    hide()
    if (onCompleteCallback) {
      const cb = onCompleteCallback
      onCompleteCallback = null
      cb()
    }
    return
  }

  rafId = requestAnimationFrame(animate)
}

export function hide(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (overlayEl) {
    overlayEl.remove()
    overlayEl = null
  }
}

export function isVisible(): boolean {
  return overlayEl !== null
}
