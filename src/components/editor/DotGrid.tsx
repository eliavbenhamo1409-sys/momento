import { useRef, useEffect } from 'react'

const DOT_SPACING = 14
const DOT_RADIUS = 0.6
const BASE_ALPHA = 0.18
const REVEAL_RADIUS = 90
const REVEAL_ALPHA = 0.85
const REVEAL_RADIUS_GROWTH = 1.4
const DOT_COLOR = '50, 50, 50'
const THROTTLE_MS = 33

export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    mx: -9999,
    my: -9999,
    prevMx: -9999,
    prevMy: -9999,
    raf: 0,
    running: false,
    baseCanvas: null as OffscreenCanvas | HTMLCanvasElement | null,
    baseW: 0,
    baseH: 0,
    lastMoveTime: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const state = stateRef.current

    const ensureBase = (w: number, h: number, dpr: number) => {
      const pw = Math.round(w * dpr)
      const ph = Math.round(h * dpr)
      if (pw === 0 || ph === 0) return
      if (state.baseCanvas && state.baseW === pw && state.baseH === ph) return
      state.baseW = pw
      state.baseH = ph
      const off = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(pw, ph)
        : document.createElement('canvas')
      if (!(off instanceof OffscreenCanvas)) {
        off.width = pw
        off.height = ph
      }
      const ctx = off.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.fillStyle = `rgba(${DOT_COLOR}, ${BASE_ALPHA})`
      for (let x = DOT_SPACING; x < w; x += DOT_SPACING) {
        for (let y = DOT_SPACING; y < h; y += DOT_SPACING) {
          ctx.beginPath()
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      state.baseCanvas = off
    }

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)
        state.baseCanvas = null
      }

      ensureBase(w, h, dpr)

      ctx.clearRect(0, 0, w, h)

      if (state.baseCanvas) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(state.baseCanvas as HTMLCanvasElement, 0, 0)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      const mx = state.mx
      const my = state.my
      const mouseActive = mx > -1000 && my > -1000
      if (mouseActive) {
        const rr = REVEAL_RADIUS * REVEAL_RADIUS
        const startCol = Math.max(0, Math.floor((mx - REVEAL_RADIUS) / DOT_SPACING) - 1)
        const endCol = Math.min(Math.ceil(w / DOT_SPACING), Math.ceil((mx + REVEAL_RADIUS) / DOT_SPACING) + 1)
        const startRow = Math.max(0, Math.floor((my - REVEAL_RADIUS) / DOT_SPACING) - 1)
        const endRow = Math.min(Math.ceil(h / DOT_SPACING), Math.ceil((my + REVEAL_RADIUS) / DOT_SPACING) + 1)

        for (let col = startCol; col <= endCol; col++) {
          const x = col * DOT_SPACING
          for (let row = startRow; row <= endRow; row++) {
            const y = row * DOT_SPACING
            const dx = x - mx
            const dy = y - my
            const distSq = dx * dx + dy * dy
            if (distSq < rr) {
              const t = 1 - Math.sqrt(distSq) / REVEAL_RADIUS
              const easedT = t * t * (3 - 2 * t)
              const alpha = REVEAL_ALPHA * easedT
              if (alpha > BASE_ALPHA) {
                const r = DOT_RADIUS + REVEAL_RADIUS_GROWTH * easedT
                ctx.fillStyle = `rgba(${DOT_COLOR}, ${alpha})`
                ctx.beginPath()
                ctx.arc(x, y, r, 0, Math.PI * 2)
                ctx.fill()
              }
            }
          }
        }
      }

      state.prevMx = mx
      state.prevMy = my

      if (mouseActive) {
        state.raf = requestAnimationFrame(draw)
      } else {
        state.running = false
      }
    }

    const startLoop = () => {
      if (!state.running) {
        state.running = true
        state.raf = requestAnimationFrame(draw)
      }
    }

    draw()
    state.running = false

    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - state.lastMoveTime < THROTTLE_MS) return
      state.lastMoveTime = now

      const rect = canvas.getBoundingClientRect()
      state.mx = e.clientX - rect.left
      state.my = e.clientY - rect.top
      startLoop()
    }

    const onLeave = () => {
      state.mx = -9999
      state.my = -9999
      cancelAnimationFrame(state.raf)
      state.running = false
      startLoop()
    }

    const onResize = () => {
      state.baseCanvas = null
      startLoop()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(state.raf)
      state.running = false
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden
    />
  )
}
