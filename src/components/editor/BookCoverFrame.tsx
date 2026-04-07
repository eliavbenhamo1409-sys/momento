import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import Icon from '../shared/Icon'
import type { CoverMaterial } from '../../types'

const MATERIALS: Record<CoverMaterial, {
  bg: string
  texture: string
  edgeLight: string
  spineTint: string
  label: string
  /** Solid base — blocks dot-grid showing through */
  solid: string
}> = {
  linen: {
    solid: '#e4dcd0',
    bg: 'linear-gradient(145deg, #e8e0d4 0%, #d9d0c2 40%, #cec4b4 100%)',
    texture: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2zm4 0h1v1H4zm-2 2h1v1H2zm2 2h1v1H4zM0 4h1v1H0z' fill='%23000' fill-opacity='.03'/%3E%3C/svg%3E")`,
    edgeLight: 'rgba(255,255,255,0.35)',
    spineTint: 'rgba(0,0,0,0.06)',
    label: 'פשתן',
  },
  white: {
    solid: '#f2f0ec',
    bg: 'linear-gradient(145deg, #faf9f7 0%, #f3f1ed 40%, #edeae4 100%)',
    texture: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23000' fill-opacity='.015'/%3E%3C/svg%3E")`,
    edgeLight: 'rgba(255,255,255,0.6)',
    spineTint: 'rgba(0,0,0,0.04)',
    label: 'לבן',
  },
  'light-brown': {
    solid: '#c9b89a',
    bg: 'linear-gradient(145deg, #d4c4a8 0%, #c8b697 40%, #a89472 100%)',
    texture: `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zm4 2h1v1H4zm-2 4h1v1H2zm4 2h1v1H4z' fill='%23000' fill-opacity='.04'/%3E%3C/svg%3E")`,
    edgeLight: 'rgba(255,255,255,0.25)',
    spineTint: 'rgba(0,0,0,0.07)',
    label: 'חום בהיר',
  },
}

const DEFAULT_MATERIAL: CoverMaterial = 'linen'

export function BookCoverFrame({ material }: { material: CoverMaterial | undefined }) {
  const m = MATERIALS[material ?? DEFAULT_MATERIAL] ?? MATERIALS[DEFAULT_MATERIAL]

  return (
    <motion.div
      key={material ?? DEFAULT_MATERIAL}
      className="absolute pointer-events-none select-none"
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        /* Larger visible “board” around the spread */
        inset: '-16px -20px -16px -20px',
        zIndex: -1,
        borderRadius: 8,
        backgroundColor: m.solid,
        backgroundImage: `${m.texture}, ${m.bg}`,
        boxShadow: [
          '0 2px 8px rgba(0,0,0,0.10)',
          '0 8px 24px rgba(0,0,0,0.08)',
          '0 20px 48px rgba(0,0,0,0.06)',
          `inset 0 1px 0 ${m.edgeLight}`,
          'inset 0 -1px 2px rgba(0,0,0,0.05)',
        ].join(', '),
      }}
    >
      {/* Top edge highlight */}
      <div
        className="absolute top-0 left-2 right-2 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${m.edgeLight}, transparent)` }}
      />

      {/* Bottom edge shadow */}
      <div
        className="absolute bottom-0 left-2 right-2 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent)' }}
      />

      {/* Spine groove */}
      <div
        className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2"
        style={{
          width: 10,
          background: `linear-gradient(to right, 
            transparent 0%, 
            ${m.spineTint} 20%, 
            rgba(0,0,0,0.03) 45%, 
            rgba(255,255,255,0.08) 50%, 
            rgba(0,0,0,0.03) 55%, 
            ${m.spineTint} 80%, 
            transparent 100%
          )`,
          borderRadius: 1,
        }}
      />

      <div
        className="absolute top-1 bottom-1 left-0 rounded-l-[7px]"
        style={{
          width: 3,
          background: `linear-gradient(to right, rgba(0,0,0,0.08), transparent)`,
        }}
      />

      <div
        className="absolute top-1 bottom-1 right-0 rounded-r-[7px]"
        style={{
          width: 3,
          background: `linear-gradient(to left, rgba(0,0,0,0.08), transparent)`,
        }}
      />
    </motion.div>
  )
}

/**
 * Animated book-close overlay.
 *
 * Phase 1 — "flip": one half of the spread rotates 180° around the spine
 *   (CSS 3D rotateY with perspective, same technique as the page-flip library).
 * Phase 2 — "settle": the resulting cover square slides to the centre of the
 *   spread container.
 *
 * The component is an absolute overlay at z-20 inside the scaleX(-1) book
 * container. It does NOT touch the HTMLFlipBook or its animation callbacks.
 */
export function BookCoverOverlay({
  material,
  side,
}: {
  material: CoverMaterial | undefined
  side: 'front' | 'back'
}) {
  const m = MATERIALS[material ?? DEFAULT_MATERIAL] ?? MATERIALS[DEFAULT_MATERIAL]
  const isFront = side === 'front'
  const flipRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'flip' | 'settle' | 'done'>('flip')

  const FLIP_S = 0.75
  const SETTLE_S = 0.45

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        if (flipRef.current) flipRef.current.style.visibility = 'hidden'
        setPhase('settle')
      }, FLIP_S * 1000),
      setTimeout(() => setPhase('done'), (FLIP_S + SETTLE_S) * 1000 + 50),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const coverBg: React.CSSProperties = {
    backgroundColor: m.solid,
    backgroundImage: `${m.texture}, ${m.bg}`,
  }

  const coverShadow = [
    '0 2px 8px rgba(0,0,0,0.10)',
    '0 8px 24px rgba(0,0,0,0.08)',
    '0 20px 48px rgba(0,0,0,0.06)',
    `inset 0 1px 0 ${m.edgeLight}`,
    'inset 0 -1px 2px rgba(0,0,0,0.05)',
  ].join(', ')

  return (
    <motion.div
      className="absolute inset-0 z-20"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ perspective: phase === 'flip' ? 2500 : undefined }}
    >
      {/* Opaque backdrop — hides flipbook pages behind the animation */}
      <div className="absolute inset-0" style={{ backgroundColor: '#fff' }} />

      {/* Cover material revealed on the origin side as the page lifts away */}
      <motion.div
        animate={{ opacity: phase === 'flip' ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', top: 0, height: '100%', width: '50%',
          ...(isFront ? { left: 0 } : { right: 0 }),
          ...coverBg,
          zIndex: 1,
        }}
      />

      {/* Main cover — sits at the landing position, then slides to centre */}
      <motion.div
        animate={{
          left: phase !== 'flip' ? '25%' : (isFront ? '50%' : '0%'),
        }}
        transition={{
          duration: phase === 'settle' ? SETTLE_S : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: 'absolute', top: 0, width: '50%', height: '100%',
          ...coverBg,
          zIndex: 2,
          boxShadow: coverShadow,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${m.edgeLight}, transparent)` }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent)' }}
        />
        {/* Spine-edge shadow on the cover */}
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, width: 6,
            ...(isFront ? { left: 0 } : { right: 0 }),
            background: isFront
              ? 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)'
              : 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
          }}
        />
      </motion.div>

      {/* 3D flipping page — rotateY around the spine edge */}
      <motion.div
        ref={flipRef}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFront ? 180 : -180 }}
        transition={{ duration: FLIP_S, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute', top: 0, height: '100%', width: '50%',
          ...(isFront ? { left: 0 } : { right: 0 }),
          transformOrigin: isFront ? '100% 50%' : '0% 50%',
          transformStyle: 'preserve-3d',
          zIndex: 5,
        }}
      >
        {/* Front face — white page surface */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          backgroundColor: '#FFFFFF',
        }} />
        {/* Back face — cover material (visible past 90°) */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          ...coverBg,
        }} />
      </motion.div>

      {/* Dynamic shadow cast onto the landing side during the flip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'flip' ? 0.12 : 0 }}
        transition={{ duration: 0.3, delay: phase === 'flip' ? 0.08 : 0 }}
        style={{
          position: 'absolute', top: '2%', height: '96%', width: '25%',
          ...(isFront ? { left: '50%' } : { right: '50%' }),
          background: isFront
            ? 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)'
            : 'linear-gradient(to left, rgba(0,0,0,0.3), transparent)',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}

export function CoverMaterialPicker({
  value,
  onChange,
}: {
  value: CoverMaterial | undefined
  onChange: (m: CoverMaterial) => void
}) {
  const materials: CoverMaterial[] = ['linen', 'white', 'light-brown']
  const safeValue = value && materials.includes(value) ? value : DEFAULT_MATERIAL
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)

  const close = useCallback(() => setOpen(false), [])

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    setMenuRect({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 120),
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPosition()
    const id = requestAnimationFrame(updateMenuPosition)
    return () => cancelAnimationFrame(id)
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const onWin = () => updateMenuPosition()
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const current = MATERIALS[safeValue]

  const menuLayer =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {open && menuRect ? (
              <motion.div
                key="cover-material-menu"
                ref={menuRef}
                role="listbox"
                dir="rtl"
                aria-label="חומר כריכה"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="fixed py-1 rounded-xl border border-black/[0.08] shadow-[0_12px_40px_rgba(45,40,35,0.18)] overflow-hidden pointer-events-auto"
                style={{
                  backgroundColor: '#faf8f5',
                  top: menuRect.top,
                  left: menuRect.left,
                  width: menuRect.width,
                  zIndex: 200,
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {materials.map((mat) => {
                  const info = MATERIALS[mat]
                  const active = mat === safeValue
                  return (
                    <button
                      key={mat}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-right transition-colors ${
                        active ? 'bg-sage/12' : 'hover:bg-black/[0.04]'
                      }`}
                      onClick={() => {
                        onChange(mat)
                        close()
                      }}
                    >
                      <span
                        className="size-5 rounded-md shrink-0 ring-1 ring-black/[0.06]"
                        style={{
                          backgroundColor: info.solid,
                          backgroundImage: `${info.texture}, ${info.bg}`,
                        }}
                      />
                      <span
                        className="text-[11px] font-semibold text-deep-brown/85"
                        style={{ fontFamily: 'var(--font-family-body)' }}
                      >
                        {info.label}
                      </span>
                      {active && (
                        <Icon name="check" size={16} className="text-sage ms-auto shrink-0" />
                      )}
                    </button>
                  )
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null

  return (
    <>
    <div
      ref={rootRef}
      dir="rtl"
      className="relative z-30 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`כריכה: ${current.label}`}
        className="btn-press flex items-center gap-2 h-8 ps-2 pe-1.5 rounded-full border border-black/[0.08] shadow-[0_1px_4px_rgba(45,40,35,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(45,40,35,0.08)]"
        style={{
          backgroundColor: '#faf8f5',
          minWidth: '7.5rem',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="size-5 rounded-md shrink-0 ring-1 ring-black/[0.06]"
          style={{
            backgroundColor: current.solid,
            backgroundImage: `${current.texture}, ${current.bg}`,
          }}
        />
        <span
          className="flex-1 text-right text-[11px] font-semibold text-deep-brown/80 truncate"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          {current.label}
        </span>
        <Icon
          name="expand_more"
          size={18}
          className={`text-deep-brown/45 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
    {menuLayer}
    </>
  )
}
