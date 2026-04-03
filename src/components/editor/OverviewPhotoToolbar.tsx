import { useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import Icon from '../shared/Icon'

const TOOLBAR_SPRING = { type: 'spring' as const, stiffness: 600, damping: 30, mass: 0.5 }

interface Props {
  anchorRect: DOMRect
  onReplace: () => void
  onRemove: () => void
  onNavigate: () => void
  onClose: () => void
}

export default function OverviewPhotoToolbar({ anchorRect, onReplace, onRemove, onNavigate, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('pointerdown', handler, true)
    return () => window.removeEventListener('pointerdown', handler, true)
  }, [onClose])

  const toolbarWidth = 148
  const toolbarHeight = 36
  const gap = 8

  let top = anchorRect.top - toolbarHeight - gap
  if (top < 8) top = anchorRect.bottom + gap

  let left = anchorRect.left + anchorRect.width / 2 - toolbarWidth / 2
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8))

  const actions = [
    { icon: 'swap_horiz', label: 'החלף תמונה', onClick: onReplace },
    { icon: 'delete_outline', label: 'הסר תמונה', onClick: onRemove, danger: true },
    { icon: 'open_in_full', label: 'עבור לעמוד', onClick: onNavigate },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 6 }}
      transition={TOOLBAR_SPRING}
      className="fixed z-[60] flex items-center gap-0.5 bg-white/95 backdrop-blur-xl rounded-full shadow-[0_6px_24px_rgba(45,40,35,0.14)] border border-black/[0.06] px-1.5 py-1"
      style={{ top, left }}
      dir="rtl"
    >
      {actions.map((action) => (
        <motion.button
          key={action.icon}
          type="button"
          whileHover={{ scale: 1.1, backgroundColor: action.danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.04)' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); action.onClick() }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          title={action.label}
        >
          <Icon
            name={action.icon}
            size={17}
            className={action.danger ? 'text-red-400' : 'text-secondary/70'}
          />
        </motion.button>
      ))}
    </motion.div>
  )
}
