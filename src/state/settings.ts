import { DEFAULTS, LS_KEYS } from '../constants'
import type { Settings } from '../types'
import { emit } from '../utils/eventBus'

let current: Settings = loadSettings()

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS_KEYS.SETTINGS)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULTS, ...parsed }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS }
}

export function getSettings(): Settings {
  return current
}

export function saveSettings(s: Settings): void {
  current = { ...s }
  localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(current))
  emit('SETTINGS_CHANGED', current)
}
