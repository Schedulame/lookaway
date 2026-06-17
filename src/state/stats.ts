import { LS_KEYS, STATS_MAX_DAYS } from '../constants'
import type { DayStats, StatEvent } from '../types'
import { getDateKey } from '../utils/dateUtils'

function emptyDay(dateKey: string): DayStats {
  return {
    dateKey,
    eyeRemindersReceived: 0,
    eyeBreaksCompleted: 0,
    eyeBreaksSkipped: 0,
    breakRemindersReceived: 0,
    longBreaksCompleted: 0,
    longBreaksSkipped: 0,
    totalActiveMs: 0,
    totalAwayMs: 0,
  }
}

function load(): DayStats[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.STATS)
    if (raw) return JSON.parse(raw) as DayStats[]
  } catch {
    // ignore
  }
  return []
}

function save(days: DayStats[]): void {
  const pruned = days
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, STATS_MAX_DAYS)
  localStorage.setItem(LS_KEYS.STATS, JSON.stringify(pruned))
}

export function getTodayStats(): DayStats {
  const today = getDateKey(new Date())
  const all = load()
  return all.find((d) => d.dateKey === today) ?? emptyDay(today)
}

export function getAllStats(): DayStats[] {
  return load().sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

export function recordEvent(event: StatEvent): void {
  const today = getDateKey(new Date())
  const all = load()
  let day = all.find((d) => d.dateKey === today)
  if (!day) {
    day = emptyDay(today)
    all.push(day)
  }
  switch (event.type) {
    case 'EYE_REMINDER_RECEIVED':
      day.eyeRemindersReceived++
      break
    case 'EYE_BREAK_COMPLETED':
      day.eyeBreaksCompleted++
      break
    case 'EYE_BREAK_SKIPPED':
      day.eyeBreaksSkipped++
      break
    case 'BREAK_REMINDER_RECEIVED':
      day.breakRemindersReceived++
      break
    case 'LONG_BREAK_COMPLETED':
      day.longBreaksCompleted++
      break
    case 'LONG_BREAK_SKIPPED':
      day.longBreaksSkipped++
      break
    case 'ACTIVE_TIME_ELAPSED':
      day.totalActiveMs += event.ms
      break
    case 'AWAY_TIME_ELAPSED':
      day.totalAwayMs += event.ms
      break
  }
  save(all)
}

export function resetStats(): void {
  localStorage.removeItem(LS_KEYS.STATS)
}
