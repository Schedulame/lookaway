import { getSettings, saveSettings } from '../../state/settings'
import type { Settings } from '../../types'

export function initSettingsPanel(): void {
  const form = document.getElementById('settings-form') as HTMLFormElement | null
  if (!form) return

  populateForm()
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(form)

    const parse = (key: string, min: number, max: number, defaultVal: number): number => {
      const raw = Number(data.get(key))
      if (!isFinite(raw) || raw < min || raw > max) return defaultVal
      return raw
    }

    const current = getSettings()
    const next: Settings = {
      eyeIntervalMs: parse('eyeIntervalMin', 1, 120, current.eyeIntervalMs / 60000) * 60000,
      eyeCountdownMs: parse('eyeCountdownSec', 5, 120, current.eyeCountdownMs / 1000) * 1000,
      breakIntervalMs: parse('breakIntervalMin', 10, 480, current.breakIntervalMs / 60000) * 60000,
      minBreakDurationMs:
        parse('minBreakDurationMin', 1, 60, current.minBreakDurationMs / 60000) * 60000,
      awayThresholdMs:
        parse('awayThresholdMin', 1, 30, current.awayThresholdMs / 60000) * 60000,
    }
    saveSettings(next)
    showSaved()
  })
}

function populateForm(): void {
  const s = getSettings()
  setVal('eyeIntervalMin', s.eyeIntervalMs / 60000)
  setVal('eyeCountdownSec', s.eyeCountdownMs / 1000)
  setVal('breakIntervalMin', s.breakIntervalMs / 60000)
  setVal('minBreakDurationMin', s.minBreakDurationMs / 60000)
  setVal('awayThresholdMin', s.awayThresholdMs / 60000)
}

function setVal(id: string, val: number): void {
  const el = document.getElementById(id) as HTMLInputElement | null
  if (el) el.value = String(val)
}

function showSaved(): void {
  const btn = document.getElementById('settings-save-btn')
  if (!btn) return
  const orig = btn.textContent
  btn.textContent = 'Saved!'
  setTimeout(() => { btn.textContent = orig }, 1500)
}
