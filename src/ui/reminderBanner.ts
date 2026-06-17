type BannerType = 'eye' | 'break'

let currentBanner: HTMLElement | null = null
let onDismissCallback: (() => void) | null = null

export function showReminderBanner(type: BannerType, onDismiss: () => void): void {
  hideReminderBanner()
  onDismissCallback = onDismiss

  const el = document.createElement('div')
  el.id = 'reminder-banner'
  el.className = `reminder-banner reminder-banner--${type}`

  const isEye = type === 'eye'
  el.innerHTML = `
    <div class="banner-icon">${isEye ? '👁' : '☕'}</div>
    <div class="banner-text">
      <strong>${isEye ? 'Eye Break!' : 'Long Break!'}</strong>
      <span>${isEye ? 'Look 20 feet away for 20 seconds.' : 'Step away from your desk for a few minutes.'}</span>
    </div>
    <button class="banner-dismiss" id="banner-dismiss-btn">
      ${isEye ? 'Start countdown' : 'Dismiss'}
    </button>
  `

  document.body.appendChild(el)
  document.getElementById('banner-dismiss-btn')?.addEventListener('click', () => {
    hideReminderBanner()
    const cb = onDismissCallback
    onDismissCallback = null
    cb?.()
  })

  currentBanner = el
}

export function hideReminderBanner(): void {
  if (currentBanner) {
    currentBanner.remove()
    currentBanner = null
  }
  onDismissCallback = null
}
