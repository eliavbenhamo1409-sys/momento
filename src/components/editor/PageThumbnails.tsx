import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

const DOT_SPRING = { type: 'spring' as const, stiffness: 600, damping: 38, mass: 0.6 }

export default function PageThumbnails() {
  const spreadCount = useEditorStore((s) => s.spreads.length)
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex)
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const addSpread = useEditorStore((s) => s.addSpread)
  const addToast = useUIStore((s) => s.addToast)

  const handleAdd = useCallback(() => {
    addSpread()
    addToast('נוסף דף ריק — העלו תמונות מהמחשב', 'success')
  }, [addSpread, addToast])

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/80 backdrop-blur-lg px-5 py-3 rounded-full flex items-center gap-3 shadow-[0_2px_12px_rgba(45,40,35,0.06)] pointer-events-auto border border-black/[0.05]"
      >
        <div className="flex items-center gap-[7px]">
          {Array.from({ length: spreadCount }, (_, i) => {
            const isActive = i === currentSpreadIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSpread(i)}
                className="relative flex items-center justify-center w-3.5 h-3.5"
              >
                <span
                  className={`block rounded-full transition-all duration-200 ${
                    isActive ? 'w-[5px] h-[5px] bg-transparent' : 'w-[5px] h-[5px] bg-secondary/20 hover:bg-secondary/40'
                  }`}
                />
                {isActive && (
                  <motion.span
                    layoutId="active-dot"
                    className="absolute inset-0 m-auto w-[7px] h-[7px] rounded-full bg-primary shadow-[0_0_6px_rgba(96,92,72,0.3)]"
                    transition={DOT_SPRING}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="w-px h-4 bg-outline-variant/15 shrink-0" />

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleAdd}
          className="w-7 h-7 rounded-full bg-primary/[0.06] hover:bg-primary/[0.12] flex items-center justify-center cursor-pointer transition-colors"
          aria-label="הוסף עמוד"
        >
          <Icon name="add" size={16} className="text-primary/70" />
        </motion.button>
      </motion.div>
    </div>
  )
}
