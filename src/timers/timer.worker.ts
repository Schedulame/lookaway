let intervalId: ReturnType<typeof setInterval> | null = null
let lastTick = Date.now()

function tick() {
  const now = Date.now()
  const deltaMs = now - lastTick
  lastTick = now
  self.postMessage({ type: 'TICK', deltaMs })
}

self.addEventListener('message', (e: MessageEvent) => {
  const { type } = e.data
  if (type === 'START' || type === 'RESUME') {
    if (intervalId !== null) clearInterval(intervalId)
    lastTick = Date.now()
    intervalId = setInterval(tick, 250)
  } else if (type === 'PAUSE') {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
})
