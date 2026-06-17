const BASE_TITLE = 'Lookaway'
let badgeCount = 0

export function setBadge(count: number): void {
  badgeCount = count
  document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(count).catch(() => {})
  }
}

export function clearBadge(): void {
  setBadge(0)
}

export function incrementBadge(): void {
  setBadge(badgeCount + 1)
}
