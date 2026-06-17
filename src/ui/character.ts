export const CHARACTER_CSS = `
@keyframes lw-bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-9px); }
}
@keyframes lw-swy {
  0%, 100% { transform: rotate(-2deg); }
  50%       { transform: rotate(2deg); }
}
.lw-char-wrap { display: flex; justify-content: center; }
.lw-char-wrap.lw-energico { animation: lw-bob 0.85s ease-in-out infinite; }
.lw-char-wrap.lw-stanco   { animation: lw-swy 2.8s  ease-in-out infinite; }
`

// ── Interfaccia pubblica ────────────────────────────────────────────────────

export interface CharacterInstance {
  setFatigue(percent: number): void
  setEyeAlert(active: boolean): void
  startEyeBreak(): void
  endEyeBreak(): void
  destroy(): void
}

// ── Definizione stati (7 livelli) ───────────────────────────────────────────

interface State {
  pctMax: number
  anim: string
  color: string
  dark: string
  legColor: string
  eyeRy: number
  lidRy: number
  pupilCy: number
  pupilR: number
  browLx1: number; browLy1: number; browLx2: number; browLy2: number
  browRx1: number; browRy1: number; browRx2: number; browRy2: number
  mouth: string
  armLx2: number; armLy2: number; armRx2: number; armRy2: number
  bodyRy: number
  headCy: number
  dead: boolean
}

const STATES: State[] = [
  { // energico  0-15%
    pctMax: 15, anim: 'lw-energico',
    color: '#1D9E75', dark: '#04342C', legColor: '#0F6E56',
    eyeRy: 11, lidRy: 0, pupilCy: 93, pupilR: 6,
    browLx1: 55, browLy1: 72, browLx2: 72, browLy2: 68,
    browRx1: 88, browRy1: 68, browRx2: 105, browRy2: 72,
    mouth: 'M62 116 Q80 134 98 116',
    armLx2: 28, armLy2: 133, armRx2: 132, armRy2: 133,
    bodyRy: 30, headCy: 98, dead: false,
  },
  { // sveglio  15-30%
    pctMax: 30, anim: '',
    color: '#1D9E75', dark: '#04342C', legColor: '#0F6E56',
    eyeRy: 11, lidRy: 0, pupilCy: 93, pupilR: 6,
    browLx1: 55, browLy1: 74, browLx2: 72, browLy2: 70,
    browRx1: 88, browRy1: 70, browRx2: 105, browRy2: 74,
    mouth: 'M63 117 Q80 130 97 117',
    armLx2: 30, armLy2: 141, armRx2: 130, armRy2: 141,
    bodyRy: 30, headCy: 99, dead: false,
  },
  { // normale  30-45%
    pctMax: 45, anim: '',
    color: '#1D9E75', dark: '#04342C', legColor: '#0F6E56',
    eyeRy: 11, lidRy: 0, pupilCy: 93, pupilR: 6,
    browLx1: 55, browLy1: 74, browLx2: 72, browLy2: 70,
    browRx1: 88, browRy1: 70, browRx2: 105, browRy2: 74,
    mouth: 'M65 117 Q80 124 95 117',
    armLx2: 32, armLy2: 150, armRx2: 128, armRy2: 150,
    bodyRy: 30, headCy: 100, dead: false,
  },
  { // stanco  45-60%
    pctMax: 60, anim: 'lw-stanco',
    color: '#EF9F27', dark: '#412402', legColor: '#BA7517',
    eyeRy: 7, lidRy: 4, pupilCy: 94, pupilR: 5,
    browLx1: 55, browLy1: 73, browLx2: 72, browLy2: 75,
    browRx1: 88, browRy1: 75, browRx2: 105, browRy2: 73,
    mouth: 'M66 119 Q80 122 94 119',
    armLx2: 34, armLy2: 158, armRx2: 126, armRy2: 158,
    bodyRy: 28, headCy: 103, dead: false,
  },
  { // affaticato  60-75%
    pctMax: 75, anim: 'lw-stanco',
    color: '#D07730', dark: '#3A1505', legColor: '#8F4F15',
    eyeRy: 4, lidRy: 7, pupilCy: 95, pupilR: 3.5,
    browLx1: 55, browLy1: 71, browLx2: 72, browLy2: 75,
    browRx1: 88, browRy1: 75, browRx2: 105, browRy2: 71,
    mouth: 'M67 121 Q80 116 93 121',
    armLx2: 35, armLy2: 165, armRx2: 125, armRy2: 165,
    bodyRy: 24, headCy: 106, dead: false,
  },
  { // esausto  75-90%
    pctMax: 90, anim: '',
    color: '#D85A30', dark: '#4A1B0C', legColor: '#993C1D',
    eyeRy: 2, lidRy: 9, pupilCy: 95, pupilR: 2,
    browLx1: 55, browLy1: 70, browLx2: 72, browLy2: 75,
    browRx1: 88, browRy1: 75, browRx2: 105, browRy2: 70,
    mouth: 'M67 122 Q80 114 93 122',
    armLx2: 36, armLy2: 171, armRx2: 124, armRy2: 171,
    bodyRy: 18, headCy: 110, dead: false,
  },
  { // alzati  90-100%
    pctMax: 100, anim: '',
    color: '#E24B4A', dark: '#501313', legColor: '#A32D2D',
    eyeRy: 0, lidRy: 0, pupilCy: 93, pupilR: 0,
    browLx1: 55, browLy1: 72, browLx2: 72, browLy2: 68,
    browRx1: 88, browRy1: 68, browRx2: 105, browRy2: 72,
    mouth: 'M68 124 Q80 120 92 124',
    armLx2: 38, armLy2: 179, armRx2: 122, armRy2: 179,
    bodyRy: 11, headCy: 114, dead: true,
  },
]

function getState(pct: number): State {
  return STATES.find(s => pct <= s.pctMax) ?? STATES[STATES.length - 1]
}

// ── Factory ──────────────────────────────────────────────────────────────────

export function createCharacter(
  container: HTMLElement,
  charWidth = 100,
  ownerDoc: Document = container.ownerDocument ?? document,
): CharacterInstance {
  const charHeight = Math.round(charWidth * (218 / 160))

  container.innerHTML = `
    <div class="lw-char-wrap" id="lw-wrap">
      <svg id="lw-svg" viewBox="0 0 160 218"
           width="${charWidth}" height="${charHeight}">

        <!-- ombra -->
        <ellipse cx="80" cy="212" rx="36" ry="6" fill="rgba(0,0,0,0.07)"/>

        <!-- corpo -->
        <ellipse id="lw-body" cx="80" cy="176" rx="26" ry="30" fill="#1D9E75"/>

        <!-- testa -->
        <circle id="lw-head" cx="80" cy="98" r="52" fill="#1D9E75"/>

        <!-- sopracciglia -->
        <g id="lw-brows">
          <line id="lw-brow-l" x1="55" y1="72" x2="72" y2="68"
                stroke="#04342C" stroke-width="3" stroke-linecap="round"/>
          <line id="lw-brow-r" x1="88" y1="68" x2="105" y2="72"
                stroke="#04342C" stroke-width="3" stroke-linecap="round"/>
        </g>

        <!-- occhi normali -->
        <g id="lw-eyes-normal">
          <ellipse id="lw-ewl" cx="64" cy="90" rx="11" ry="11" fill="white"/>
          <ellipse id="lw-lidl" cx="64" cy="80" rx="11" ry="0" fill="#1D9E75" opacity="0"/>
          <circle  id="lw-epl" cx="64" cy="93" r="6" fill="#04342C"/>
          <ellipse id="lw-ewr" cx="96" cy="90" rx="11" ry="11" fill="white"/>
          <ellipse id="lw-lidr" cx="96" cy="80" rx="11" ry="0" fill="#1D9E75" opacity="0"/>
          <circle  id="lw-epr" cx="96" cy="93" r="6" fill="#04342C"/>
        </g>

        <!-- mani che coprono gli occhi (eye-break, nascosto di default) -->
        <g id="lw-eyecover" opacity="0">
          <ellipse cx="64" cy="91" rx="18" ry="12" id="lw-hand-l"
                   fill="#1D9E75" stroke="#04342C" stroke-width="2.5"/>
          <ellipse cx="96" cy="91" rx="18" ry="12" id="lw-hand-r"
                   fill="#1D9E75" stroke="#04342C" stroke-width="2.5"/>
        </g>

        <!-- etichetta "guarda lontano" (nascosta di default) -->
        <g id="lw-arrow" opacity="0">
          <text x="138" y="60" font-size="10" fill="#04342C"
                font-family="sans-serif" font-weight="600" text-anchor="middle">guarda</text>
          <text x="138" y="74" font-size="10" fill="#04342C"
                font-family="sans-serif" font-weight="600" text-anchor="middle">lontano</text>
          <text x="138" y="96" font-size="20" text-anchor="middle">↗</text>
        </g>

        <!-- anello countdown (nascosto di default) -->
        <g id="lw-ring" opacity="0">
          <circle cx="80" cy="98" r="62" fill="none"
                  stroke="rgba(0,0,0,0.08)" stroke-width="5"/>
          <circle id="lw-ring-arc" cx="80" cy="98" r="62" fill="none"
                  stroke="#1D9E75" stroke-width="5"
                  stroke-dasharray="390" stroke-dashoffset="0"
                  stroke-linecap="round" transform="rotate(-90 80 98)"/>
        </g>

        <!-- bocca -->
        <path id="lw-mouth" d="M62 116 Q80 134 98 116"
              stroke="#04342C" stroke-width="3.5" fill="none" stroke-linecap="round"/>

        <!-- braccio sinistro -->
        <line id="lw-arm-l" x1="56" y1="162" x2="28" y2="133"
              stroke="#1D9E75" stroke-width="11" stroke-linecap="round"/>

        <!-- braccio destro -->
        <line id="lw-arm-r" x1="104" y1="162" x2="132" y2="133"
              stroke="#1D9E75" stroke-width="11" stroke-linecap="round"/>

        <!-- gambe -->
        <line x1="70" y1="203" x2="61" y2="211"
              stroke="#0F6E56" stroke-width="9" stroke-linecap="round"/>
        <line x1="90" y1="203" x2="99" y2="211"
              stroke="#0F6E56" stroke-width="9" stroke-linecap="round"/>

      </svg>
    </div>`

  // ── Riferimenti agli elementi ─────────────────────────────────────────────

  const q  = <T extends Element>(sel: string) => container.querySelector(sel) as T
  const sa = (sel: string, attr: string, val: string | number) => {
    const e = q<Element>(sel); if (e) e.setAttribute(attr, String(val))
  }
  const op = (sel: string, val: number) => sa(sel, 'opacity', val)

  const wrap  = q<HTMLElement>('.lw-char-wrap')
  const svg   = q<SVGSVGElement>('#lw-svg')
  const legs  = Array.from(container.querySelectorAll<SVGLineElement>(
    'line:not([id])'
  ))

  // ── Stato interno ─────────────────────────────────────────────────────────

  let curPct        = 0
  let eyeBreakActive = false
  let eyeAlertActive = false
  let ebTimerId: ReturnType<typeof setInterval> | null = null

  // ── Helpers ───────────────────────────────────────────────────────────────

  function removeXEyes() {
    ;['lw-xll','lw-xlr','lw-xrl','lw-xrr'].forEach(id => {
      svg.querySelector('#' + id)?.remove()
    })
  }

  function addXEyes(dark: string) {
    removeXEyes()
    const NS = 'http://www.w3.org/2000/svg'
    const defs: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [
      { id: 'lw-xll', x1: 55, y1: 80, x2: 73, y2: 100 },
      { id: 'lw-xlr', x1: 73, y1: 80, x2: 55, y2: 100 },
      { id: 'lw-xrl', x1: 87, y1: 80, x2: 105, y2: 100 },
      { id: 'lw-xrr', x1: 105, y1: 80, x2: 87,  y2: 100 },
    ]
    const mouth = q('#lw-mouth')
    defs.forEach(d => {
      const ln = ownerDoc.createElementNS(NS, 'line')
      ln.id = d.id
      ln.setAttribute('x1', String(d.x1)); ln.setAttribute('y1', String(d.y1))
      ln.setAttribute('x2', String(d.x2)); ln.setAttribute('y2', String(d.y2))
      ln.setAttribute('stroke', dark)
      ln.setAttribute('stroke-width', '3.5')
      ln.setAttribute('stroke-linecap', 'round')
      if (mouth) svg.insertBefore(ln, mouth)
      else svg.appendChild(ln)
    })
  }

  function applyPupilAlert() {
    const dx = eyeAlertActive ? 3 : 0
    const dy = eyeAlertActive ? -3 : 0
    sa('#lw-epl', 'cx', 64 + dx); sa('#lw-epl', 'cy', getState(curPct).pupilCy + dy)
    sa('#lw-epr', 'cx', 96 + dx); sa('#lw-epr', 'cy', getState(curPct).pupilCy + dy)
  }

  // ── Render stato fatica ───────────────────────────────────────────────────

  function applyFatigue(pct: number) {
    const s = getState(pct)

    // colori corpo
    sa('#lw-body', 'fill', s.color)
    sa('#lw-head', 'fill', s.color)
    sa('#lw-arm-l', 'stroke', s.color)
    sa('#lw-arm-r', 'stroke', s.color)
    sa('#lw-hand-l', 'fill', s.color)
    sa('#lw-hand-r', 'fill', s.color)
    legs.forEach(l => l.setAttribute('stroke', s.legColor))

    // sopracciglia
    sa('#lw-brow-l', 'x1', s.browLx1); sa('#lw-brow-l', 'y1', s.browLy1)
    sa('#lw-brow-l', 'x2', s.browLx2); sa('#lw-brow-l', 'y2', s.browLy2)
    sa('#lw-brow-l', 'stroke', s.dark)
    sa('#lw-brow-r', 'x1', s.browRx1); sa('#lw-brow-r', 'y1', s.browRy1)
    sa('#lw-brow-r', 'x2', s.browRx2); sa('#lw-brow-r', 'y2', s.browRy2)
    sa('#lw-brow-r', 'stroke', s.dark)

    // forma
    sa('#lw-body', 'ry', s.bodyRy)
    sa('#lw-head', 'cy', s.headCy)
    sa('#lw-mouth', 'd', s.mouth)
    sa('#lw-mouth', 'stroke', s.dark)

    // occhi (solo se eye-break non attivo)
    if (!eyeBreakActive) {
      if (s.dead) {
        sa('#lw-ewl', 'ry', 0); sa('#lw-ewr', 'ry', 0)
        sa('#lw-epl', 'r', 0);  sa('#lw-epr', 'r', 0)
        op('#lw-lidl', 0); op('#lw-lidr', 0)
        addXEyes(s.dark)
      } else {
        removeXEyes()
        sa('#lw-ewl', 'ry', s.eyeRy); sa('#lw-ewr', 'ry', s.eyeRy)
        sa('#lw-epl', 'r', s.pupilR); sa('#lw-epr', 'r', s.pupilR)
        sa('#lw-epl', 'fill', s.dark); sa('#lw-epr', 'fill', s.dark)
        // palpebra
        sa('#lw-lidl', 'fill', s.color); sa('#lw-lidl', 'ry', s.lidRy)
        sa('#lw-lidr', 'fill', s.color); sa('#lw-lidr', 'ry', s.lidRy)
        op('#lw-lidl', s.lidRy > 0 ? 1 : 0)
        op('#lw-lidr', s.lidRy > 0 ? 1 : 0)
        // pupille (con eventuale alert)
        applyPupilAlert()
      }
    }

    // braccia (solo se eye-break non attivo)
    if (!eyeBreakActive) {
      sa('#lw-arm-l', 'x2', s.armLx2); sa('#lw-arm-l', 'y2', s.armLy2)
      sa('#lw-arm-r', 'x2', s.armRx2); sa('#lw-arm-r', 'y2', s.armRy2)
    }

    // animazione (solo se eye-break non attivo)
    if (!eyeBreakActive) {
      wrap.className = 'lw-char-wrap' + (s.anim ? ' ' + s.anim : '')
    }

    // aggiorna colore anello se eye-break attivo
    if (eyeBreakActive) sa('#lw-ring-arc', 'stroke', s.color)
  }

  // ── Eye break ─────────────────────────────────────────────────────────────

  function startEyeBreak() {
    if (eyeBreakActive) return
    eyeBreakActive = true
    let sec = 20

    wrap.className = 'lw-char-wrap'
    op('#lw-brows', 0)
    op('#lw-eyes-normal', 0)
    op('#lw-eyecover', 1)
    op('#lw-arrow', 1)
    op('#lw-ring', 1)

    // braccia su a coprire gli occhi
    sa('#lw-arm-l', 'x2', 50); sa('#lw-arm-l', 'y2', 88)
    sa('#lw-arm-r', 'x2', 110); sa('#lw-arm-r', 'y2', 88)

    sa('#lw-ring-arc', 'stroke-dashoffset', '0')
    sa('#lw-ring-arc', 'stroke', getState(curPct).color)

    if (ebTimerId) clearInterval(ebTimerId)
    ebTimerId = setInterval(() => {
      sec--
      sa('#lw-ring-arc', 'stroke-dashoffset', String(Math.round(390 * (20 - sec) / 20)))
      if (sec <= 0) { clearInterval(ebTimerId!); ebTimerId = null; endEyeBreak() }
    }, 1000)
  }

  function endEyeBreak() {
    if (!eyeBreakActive) return
    if (ebTimerId) { clearInterval(ebTimerId); ebTimerId = null }
    eyeBreakActive = false

    op('#lw-brows', 1)
    op('#lw-eyes-normal', 1)
    op('#lw-eyecover', 0)
    op('#lw-arrow', 0)
    op('#lw-ring', 0)

    applyFatigue(curPct)
  }

  // ── Inizializzazione ──────────────────────────────────────────────────────

  applyFatigue(0)

  // ── API pubblica ──────────────────────────────────────────────────────────

  return {
    setFatigue(pct: number) {
      curPct = Math.max(0, Math.min(100, pct))
      applyFatigue(curPct)
    },
    setEyeAlert(active: boolean) {
      if (eyeAlertActive === active) return
      eyeAlertActive = active
      if (!eyeBreakActive && !getState(curPct).dead) applyPupilAlert()
    },
    startEyeBreak,
    endEyeBreak,
    destroy() {
      if (ebTimerId) clearInterval(ebTimerId)
      container.innerHTML = ''
    },
  }
}
