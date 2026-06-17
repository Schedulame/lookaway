import { emit } from '../utils/eventBus'

const reNotifyTimers = new Map<string, ReturnType<typeof setTimeout>>()

// Listen for messages from the service worker (notificationclose / notificationclick)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, tag } = event.data ?? {}
    if ((type === 'NOTIFICATION_CLOSED' || type === 'NOTIFICATION_CLICKED') && tag) {
      clearReNotifyTimer(tag)
      emit('NOTIFICATION_DISMISSED', { tag })
    }
  })
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function hasPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function getPermissionStatus(): string {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function showNotification(
  tag: string,
  title: string,
  body: string,
  reNotifyDelayMs?: number
): Promise<void> {
  if (!hasPermission()) return

  clearReNotifyTimer(tag)

  const options: NotificationOptions = {
    body,
    tag,
    icon: '/favicon.svg',
    requireInteraction: true,
  }

  // Use SW registration (bypasses macOS restrictions on timer-triggered notifications)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, options)
    } catch {
      new Notification(title, options)
    }
  } else {
    new Notification(title, options)
  }

  if (reNotifyDelayMs) {
    const timer = setTimeout(() => {
      emit('RE_NOTIFY', { tag })
    }, reNotifyDelayMs)
    reNotifyTimers.set(tag, timer)
  }
}

export async function dismissNotification(tag: string): Promise<void> {
  clearReNotifyTimer(tag)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      const notifications = await reg.getNotifications({ tag })
      notifications.forEach((n) => n.close())
    } catch { /* ignore */ }
  }
}

export async function sendTestNotification(): Promise<'sent' | 'no-permission' | 'denied' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') {
    const ok = await requestPermission()
    if (!ok) return 'no-permission'
  }
  await showNotification('lookaway-test', '✅ Lookaway — Test', 'Desktop notifications are working!')
  return 'sent'
}

function clearReNotifyTimer(tag: string): void {
  const timer = reNotifyTimers.get(tag)
  if (timer !== undefined) {
    clearTimeout(timer)
    reNotifyTimers.delete(tag)
  }
}
