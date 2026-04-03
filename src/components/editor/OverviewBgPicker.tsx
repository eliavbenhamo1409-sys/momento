import { useRef, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { PREDEFINED_BG_COLORS } from '../../lib/constants'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

const PICKER_SPRING = { type: 'spring' as const, stiffness: 500, damping: 32, mass: 0.6 }

interface Props {
  spreadId: string
  anchorRect: DOMRect
  onClose: () => void
}

export default function OverviewBgPicker({ spreadId, anchorRect, onClose }: Props) {
  const setSpreadBgColor = useEditorStore((s) => s.setSpreadBgColor)
  const setAllSpreadsBgColor = useEditorStore((s) => s.setAllSpreadsBgColor)
  const addToast = useUIStore((s) => s.addToast)
  const [lastApplied, setLastApplied] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('pointerdown', handler, true)
    return () => window.removeEventListener('pointerdown', handler, true)
  }, [onClose])

  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 320)
  const left = Math.min(anchorRect.left, window.innerWidth - 260)

  const applyColor = (color: string) => {
    setSpreadBgColor(spreadId, color)
    setLastApplied(color)
    addToast('הרקע עודכן', 'success')
  }

  const applyToAll = () => {
    if (!lastApplied) return
    setAllSpreadsBgColor(lastApplied)
    addToast('הרקע הוחל על כל האלבום', 'success')
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={PICKER_SPRING}
      className="fixed z-[60] w-[240px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(45,40,35,0.12)] border border-black/[0.06] p-3"
      style={{ top, left }}
      dir="rtl"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold text-on-surface" style={{ fontFamily: 'var(--font-family-headline)' }}>
          צבע רקע
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/[0.04] transition-colors"
        >
          <Icon name="close" size={14} className="text-secondary/50" />
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {PREDEFINED_BG_COLORS.map((bg) => (
          <motion.button
            key={bg.value}
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => applyColor(bg.value)}
            className={`aspect-square rounded-lg border shadow-sm transition-shadow ${
              lastApplied === bg.value
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-white border-primary/30'
                : 'border-black/[0.06] hover:shadow-md'
            }`}
            style={{ background: bg.gradient }}
            title={bg.label}
          />
        ))}
      </div>

      {lastApplied && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={applyToAll}
          className="w-full mt-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <Icon name="select_all" size={13} />
          החל על כל האלבום
        </motion.button>
      )}
    </motion.div>
  )
}
