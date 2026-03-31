import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
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
      <motion.button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`כריכה: ${current.label}`}
        className="flex items-center gap-2 h-8 ps-2 pe-1.5 rounded-full border border-black/[0.08] shadow-[0_1px_4px_rgba(45,40,35,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(45,40,35,0.08)]"
        style={{
          backgroundColor: '#faf8f5',
          minWidth: '7.5rem',
        }}
        whileTap={{ scale: 0.98 }}
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
      </motion.button>
    </div>
    {menuLayer}
    </>
  )
}
