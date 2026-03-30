import { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'

const SPREAD_LABELS: Record<number, string> = {
  0: 'כריכה',
}

function getSpreadLabel(index: number, total: number): string {
  if (SPREAD_LABELS[index]) return SPREAD_LABELS[index]
  if (index === total - 1 && total > 2) return 'סיום'
  return `${index * 2 + 1}–${index * 2 + 2}`
}

const DOT_SPRING = { type: 'spring' as const, stiffness: 600, damping: 38, mass: 0.6 }

export default function PageThumbnails() {
  const { spreads, currentSpreadIndex } = useEditorStore(useShallow((s) => ({
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
  })))
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread)
  const addSpread = useEditorStore((s) => s.addSpread)
  const addToast = useUIStore((s) => s.addToast)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stripRef.current) return
    const active = stripRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentSpreadIndex, spreads.length])

  const handleAdd = useCallback(() => {
    addSpread()
    addToast('נוסף דף ריק — העלו תמונות מהמחשב', 'success')
  }, [addSpread, addToast])

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/80 backdrop-blur-lg px-5 py-3.5 rounded-2xl flex flex-col items-center gap-2.5 shadow-[0_2px_12px_rgba(45,40,35,0.06)] pointer-events-auto border border-black/[0.05]"
      >
        <div className="flex items-center gap-3 w-full overflow-x-auto no-scrollbar">
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleAdd}
            className="flex-shrink-0 w-14 h-11 bg-primary/[0.06] hover:bg-primary/[0.12] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors border border-dashed border-primary/20"
            aria-label="הוסף עמוד"
          >
            <Icon name="add" size={18} className="text-primary/70" />
            <span className="text-[8px] text-primary/60 font-medium mt-0.5">עמוד</span>
          </motion.button>

          <div className="w-px h-8 bg-outline-variant/15 shrink-0" />

          <div ref={stripRef} className="flex items-center gap-2.5 min-w-0">
            <AnimatePresence mode="popLayout">
              {spreads.map((spread, i) => {
                const isActive = i === currentSpreadIndex
                const leftSrc = spread.leftPhotos.find((s) => s != null) ?? null
                const rightSrc = spread.rightPhotos.find((s) => s != null) ?? null
                const label = getSpreadLabel(i, spreads.length)
                return (
                  <motion.button
                    key={spread.id}
                    layout
                    type="button"
                    data-active={isActive}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={DOT_SPRING}
                    onClick={() => setCurrentSpread(i)}
                    className="flex-shrink-0 flex flex-col items-center gap-1 group"
                  >
                    <motion.div
                      animate={{ opacity: isActive ? 1 : 0.5 }}
                      transition={{ duration: 0.3 }}
                      className={`w-[4.5rem] h-[3rem] rounded-lg overflow-hidden relative ring-1 ${
                        isActive
                          ? 'ring-primary/30'
                          : 'ring-black/[0.06] group-hover:opacity-90 group-hover:ring-black/[0.12]'
                      }`}
                    >
                      <div className="w-full h-full flex">
                        <div className="flex-1 overflow-hidden bg-surface-container-high/60 relative">
                          {leftSrc ? (
                            <img src={leftSrc} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="image" size={14} className="text-outline-variant/40" />
                            </div>
                          )}
                        </div>
                        <div className="w-px bg-white/50 shrink-0" />
                        <div className="flex-1 overflow-hidden bg-surface-container-high/60 relative">
                          {rightSrc ? (
                            <img src={rightSrc} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="image" size={14} className="text-outline-variant/40" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    <span
                      className={`text-[9px] font-medium transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-secondary/40 group-hover:text-secondary/60'
                      }`}
                    >
                      {label}
                    </span>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Sliding dot indicator */}
        <div className="flex items-center gap-[6px]">
          {spreads.map((spread, i) => {
            const isActive = i === currentSpreadIndex
            return (
              <button
                key={spread.id}
                type="button"
                onClick={() => setCurrentSpread(i)}
                className="relative flex items-center justify-center w-3 h-3"
                aria-label={getSpreadLabel(i, spreads.length)}
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
      </motion.div>
    </div>
  )
}
