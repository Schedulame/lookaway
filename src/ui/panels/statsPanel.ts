import { getAllStats, resetStats } from '../../state/stats'
import { getDateKey } from '../../utils/dateUtils'

const iconCalendar = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
const iconHistory = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>`

export function initStatsPanel(): void {
  const resetBtn = document.getElementById('stats-reset-btn')
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all statistics? This cannot be undone.')) {
        resetStats()
        renderStatsPanel()
      }
    })
  }
}

export function renderStatsPanel(): void {
  const container = document.getElementById('stats-container')
  if (!container) return

  const all = getAllStats()
  const today = getDateKey(new Date())

  if (all.length === 0) {
    container.innerHTML = '<p class="stats-empty">No data yet — start working to see your stats.</p>'
    return
  }

  const todayData = all.find(d => d.dateKey === today)
  const history   = all.filter(d => d.dateKey !== today)

  let html = ''

  if (todayData) {
    const activeH  = (todayData.totalActiveMs / 3600000).toFixed(1)
    const awayMin  = Math.round(todayData.totalAwayMs / 60000)
    const eyeDone  = todayData.eyeBreaksCompleted
    const lbDone   = todayData.longBreaksCompleted

    html += `
      <div class="stats-card">
        <div class="stats-card-header">${iconCalendar} Today</div>
        <div class="stats-today-grid">
          <div class="stat-cell">
            <span class="stat-value stat-value--eye">${eyeDone}</span>
            <span class="stat-label">Eye breaks</span>
          </div>
          <div class="stat-cell">
            <span class="stat-value stat-value--break">${lbDone}</span>
            <span class="stat-label">Long breaks</span>
          </div>
          <div class="stat-cell">
            <span class="stat-value">${activeH}h</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-cell">
            <span class="stat-value">${awayMin}m</span>
            <span class="stat-label">Away</span>
          </div>
        </div>
      </div>
    `
  }

  if (history.length > 0) {
    const rows = history.slice().reverse().map(day => {
      const activeH  = (day.totalActiveMs / 3600000).toFixed(1)
      const eyeTotal = day.eyeBreaksCompleted + day.eyeBreaksSkipped
      const lbTotal  = day.longBreaksCompleted + day.longBreaksSkipped
      return `
        <tr>
          <td class="stat-date">${day.dateKey}</td>
          <td>
            <span class="stat-chip stat-chip--eye">${day.eyeBreaksCompleted}</span>
            <span class="stat-chip-sep">/ ${eyeTotal}</span>
          </td>
          <td>
            <span class="stat-chip stat-chip--break">${day.longBreaksCompleted}</span>
            <span class="stat-chip-sep">/ ${lbTotal}</span>
          </td>
          <td class="stat-time">${activeH}h</td>
        </tr>
      `
    }).join('')

    html += `
      <div class="stats-card">
        <div class="stats-card-header">${iconHistory} History</div>
        <table class="stats-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Eye breaks</th>
              <th>Long breaks</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }

  container.innerHTML = html
}
