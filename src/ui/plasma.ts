import { Renderer, Program, Mesh, Triangle } from 'ogl'

export interface PlasmaOptions {
  color?: string
  speed?: number
  direction?: 'forward' | 'reverse' | 'pingpong'
  scale?: number
  opacity?: number
  mouseInteractive?: boolean
  renderScale?: number  // 0-1, fraction of container size to render at (default 0.6)
  maxFps?: number       // cap frame rate (default 30)
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return [1, 0.5, 0.2]
  return [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255]
}

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`

const fragment = `#version 300 es
precision highp float;
uniform vec2  iResolution;
uniform float iTime;
uniform vec3  uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2  uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;
  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);
  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;
  for (vec2 r = iResolution.xy, Q; ++i < 35.; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y));
    p.z -= 4.;
    S = p;
    d = p.y-T;
    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05);
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T));
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }
  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(finite1(c.r)?c.r:0.0, finite1(c.g)?c.g:0.0, finite1(c.b)?c.b:0.0);
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`

export function createPlasma(container: HTMLElement, opts: PlasmaOptions = {}): () => void {
  const {
    color,
    speed = 1,
    direction = 'forward',
    scale = 1,
    opacity = 1,
    mouseInteractive = false,
    renderScale = 0.6,
    maxFps = 30,
  } = opts

  const FRAME_MS = 1000 / maxFps
  const RS = Math.max(0.2, Math.min(1, renderScale))

  const useCustomColor  = color ? 1.0 : 0.0
  const customColorRgb  = color ? hexToRgb(color) : ([1, 1, 1] as [number, number, number])
  const directionMult   = direction === 'reverse' ? -1.0 : 1.0

  let renderer: Renderer
  try {
    renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: 1,  // force 1x — biggest perf win on retina displays
    })
  } catch {
    return () => {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gl = renderer.gl as any
  if (!gl) return () => {}

  const canvas = gl.canvas as HTMLCanvasElement
  canvas.style.display = 'block'
  canvas.style.width   = '100%'
  canvas.style.height  = '100%'
  container.appendChild(canvas)

  const geometry = new Triangle(gl)

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      iTime:            { value: 0 },
      iResolution:      { value: new Float32Array([1, 1]) },
      uCustomColor:     { value: new Float32Array(customColorRgb) },
      uUseCustomColor:  { value: useCustomColor },
      uSpeed:           { value: speed * 0.4 },
      uDirection:       { value: directionMult },
      uScale:           { value: scale },
      uOpacity:         { value: opacity },
      uMouse:           { value: new Float32Array([0, 0]) },
      uMouseInteractive:{ value: mouseInteractive ? 1.0 : 0.0 },
    } as any,
  })

  const mesh = new Mesh(gl, { geometry, program })

  const mouse = { x: 0, y: 0 }
  const handleMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect()
    mouse.x = e.clientX - rect.left
    mouse.y = e.clientY - rect.top
    const u = (program.uniforms as any).uMouse.value as Float32Array
    u[0] = mouse.x
    u[1] = mouse.y
  }
  if (mouseInteractive) container.addEventListener('mousemove', handleMouseMove)

  const setSize = () => {
    const rect = container.getBoundingClientRect()
    const w = Math.max(1, Math.floor(rect.width  * RS))
    const h = Math.max(1, Math.floor(rect.height * RS))
    renderer.setSize(w, h)
    // OGL's setSize overrides canvas style with px values — re-apply CSS scaling
    canvas.style.width  = '100%'
    canvas.style.height = '100%'
    const res = (program.uniforms as any).iResolution.value as Float32Array
    res[0] = gl.drawingBufferWidth
    res[1] = gl.drawingBufferHeight
  }
  const ro = new ResizeObserver(setSize)
  ro.observe(container)
  setSize()

  let rafId = 0
  let contextLost = false
  let isVisible = true
  let lastFrameT = 0
  const t0 = performance.now()
  const PINGPONG_DUR = 10

  function loop(t: number) {
    if (contextLost || !isVisible) return
    // fps cap: skip frame if not enough time has elapsed
    if (t - lastFrameT < FRAME_MS) { rafId = requestAnimationFrame(loop); return }
    lastFrameT = t
    const elapsed = (t - t0) * 0.001
    const uniforms = program.uniforms as any

    if (direction === 'pingpong') {
      const seg  = elapsed % PINGPONG_DUR
      const fwd  = Math.floor(elapsed / PINGPONG_DUR) % 2 === 0
      const u    = seg / PINGPONG_DUR
      const s    = u * u * (3 - 2 * u)
      uniforms.uDirection.value = 1.0
      uniforms.iTime.value = (fwd ? s : 1 - s) * PINGPONG_DUR
    } else {
      uniforms.iTime.value = elapsed
    }

    renderer.render({ scene: mesh })
    rafId = requestAnimationFrame(loop)
  }

  const onContextLost = (e: Event) => { e.preventDefault(); contextLost = true; cancelAnimationFrame(rafId) }
  const onContextRestored = () => { contextLost = false; if (isVisible) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop) } }
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  const io = new IntersectionObserver(([entry]) => {
    const was = isVisible
    isVisible = entry.isIntersecting
    if (isVisible && !was && !contextLost) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop) }
  }, { threshold: 0 })
  io.observe(container)

  rafId = requestAnimationFrame(loop)

  return () => {
    cancelAnimationFrame(rafId)
    ro.disconnect()
    io.disconnect()
    canvas.removeEventListener('webglcontextlost', onContextLost)
    canvas.removeEventListener('webglcontextrestored', onContextRestored)
    if (mouseInteractive) container.removeEventListener('mousemove', handleMouseMove)
    try { container.removeChild(canvas) } catch {}
  }
}
