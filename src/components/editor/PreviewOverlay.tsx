import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useShallow } from 'zustand/react/shallow'
import Skeleton from '../shared/Skeleton'
import Icon from '../shared/Icon'
import type { PhotoElement, EditorSpread } from '../../types'

function PreviewSpread({ spread }: { spread: EditorSpread }) {
  const design = spread.design
  const hasDesign = design && design.elements.length > 0

  if (hasDesign) {
    const leftElements = design.elements.filter((e) => e.type === 'photo' && e.page === 'left') as PhotoElement[]
    const rightElements = design.elements.filter((e) => e.type === 'photo' && e.page === 'right') as PhotoElement[]
    const fullElements = design.elements.filter((e) => e.type === 'photo' && e.page === 'full') as PhotoElement[]
    const bgColor = design.background.color || '#FFFFFF'

    return (
      <div className="w-full h-full relative" style={{ backgroundColor: bgColor }}>
        {design.background.generatedBgUrl && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${design.background.generatedBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: design.background.generatedBgOpacity ?? 1,
            }}
          />
        )}
        {design.background.generatedBgLeftUrl && (
          <div
            className="absolute inset-y-0 left-0 w-1/2 z-0"
            style={{
              backgroundImage: `url(${design.background.generatedBgLeftUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: design.background.generatedBgLeftOpacity ?? 1,
            }}
          />
        )}
        {design.background.generatedBgRightUrl && (
          <div
            className="absolute inset-y-0 right-0 w-1/2 z-0"
            style={{
              backgroundImage: `url(${design.background.generatedBgRightUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: design.background.generatedBgRightOpacity ?? 1,
            }}
          />
        )}
        {fullElements.map((el) => (
          <div
            key={el.slotId}
            className="absolute overflow-hidden"
            style={{
              left: `${el.x / 2}%`, top: `${el.y}%`,
              width: `${el.width / 2}%`, height: `${el.height}%`,
              borderRadius: el.borderRadius,
            }}
          >
            {el.photoUrl ? (
              <img src={el.photoUrl} alt="" className="w-full h-full object-cover" style={{
                objectPosition: el.objectPosition || '50% 50%',
                transformOrigin: (el.scale ?? 1) > 1 ? (el.objectPosition || '50% 50%') : undefined,
                transform: (el.scale ?? 1) > 1 ? `scale(${el.scale})` : undefined,
              }} />
            ) : (
              <div className="w-full h-full bg-stone-100/60" />
            )}
          </div>
        ))}
        <div className="absolute inset-y-0 left-0 w-1/2">
          {leftElements.map((el) => (
            <div
              key={el.slotId}
              className="absolute overflow-hidden"
              style={{
                left: `${el.x}%`, top: `${el.y}%`,
                width: `${el.width}%`, height: `${el.height}%`,
                borderRadius: el.borderRadius,
              }}
            >
              {el.photoUrl ? (
                <img src={el.photoUrl} alt="" className="w-full h-full object-cover" style={{
                  objectPosition: el.objectPosition || '50% 50%',
                  transformOrigin: (el.scale ?? 1) > 1 ? (el.objectPosition || '50% 50%') : undefined,
                  transform: (el.scale ?? 1) > 1 ? `scale(${el.scale})` : undefined,
                }} />
              ) : (
                <div className="w-full h-full bg-stone-100/60" />
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-1/2">
          {rightElements.map((el) => (
            <div
              key={el.slotId}
              className="absolute overflow-hidden"
              style={{
                left: `${el.x}%`, top: `${el.y}%`,
                width: `${el.width}%`, height: `${el.height}%`,
                borderRadius: el.borderRadius,
              }}
            >
              {el.photoUrl ? (
                <img src={el.photoUrl} alt="" className="w-full h-full object-cover" style={{
                  objectPosition: el.objectPosition || '50% 50%',
                  transformOrigin: (el.scale ?? 1) > 1 ? (el.objectPosition || '50% 50%') : undefined,
                  transform: (el.scale ?? 1) > 1 ? `scale(${el.scale})` : undefined,
                }} />
              ) : (
                <div className="w-full h-full bg-stone-100/60" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 p-4">
        {spread.leftPhotos.map((src, i) =>
          src ? (
            <img key={i} src={src} alt="" className="w-full h-full object-cover rounded-sm" />
          ) : (
            <div key={i} className="w-full h-full min-h-[80px] bg-surface-container-high rounded-sm" />
          ),
        )}
      </div>
      <div className="flex-1 p-4 grid grid-cols-2 gap-2">
        {spread.rightPhotos.map((src, i) =>
          src ? (
            <img key={i} src={src} alt="" className="w-full h-full object-cover rounded-sm" />
          ) : (
            <div key={i} className="w-full h-full min-h-[60px] bg-surface-container-high rounded-sm" />
          ),
        )}
      </div>
    </>
  )
}

function usePreloadSpreadImages(activeIdx: number) {
  useEffect(() => {
    const spreads = useEditorStore.getState().spreads
    const indices = [activeIdx - 1, activeIdx + 1].filter(
      (i) => i >= 0 && i < spreads.length,
    )
    for (const idx of indices) {
      const spread = spreads[idx]
      if (!spread?.design) continue
      for (const el of spread.design.elements) {
        if (el.type === 'photo' && 'photoUrl' in el && el.photoUrl) {
          const img = new Image()
          img.src = el.photoUrl
        }
      }
    }
  }, [activeIdx])
}

export default function PreviewOverlay() {
  const { isPreviewOpen, spreads, currentSpreadIndex } = useEditorStore(useShallow((s) => ({
    isPreviewOpen: s.isPreviewOpen,
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
  })))
  const togglePreview = useEditorStore((s) => s.togglePreview)
  const navigate = useNavigate()
  const [activeIdx, setActiveIdx] = useState(currentSpreadIndex)
  const [spreadReady, setSpreadReady] = useState(false)

  useEffect(() => {
    if (isPreviewOpen) {
      setActiveIdx(currentSpreadIndex)
      setSpreadReady(false)
      const timer = setTimeout(() => setSpreadReady(true), 200)
      return () => clearTimeout(timer)
    }
  }, [isPreviewOpen, currentSpreadIndex])

  const handleSpreadChange = useCallback((idx: number) => {
    setSpreadReady(false)
    setActiveIdx(idx)
    requestAnimationFrame(() => {
      setTimeout(() => setSpreadReady(true), 100)
    })
  }, [])

  usePreloadSpreadImages(activeIdx)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') togglePreview()
      if (e.key === 'ArrowLeft') handleSpreadChange(Math.min(activeIdx + 1, spreads.length - 1))
      if (e.key === 'ArrowRight') handleSpreadChange(Math.max(activeIdx - 1, 0))
    }
    if (isPreviewOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPreviewOpen, togglePreview, spreads.length, activeIdx, handleSpreadChange])

  if (!isPreviewOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-[#1a1918]/92 backdrop-blur-sm flex flex-col"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={togglePreview}
            className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <Icon name="arrow_forward" size={20} />
            חזור לעריכה
          </button>
        </div>
        <span
          className="text-white/40 text-sm font-medium tracking-wide"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          תצוגה מקדימה — {activeIdx + 1} מתוך {spreads.length}
        </span>
        <button
          onClick={togglePreview}
          className="text-white/50 hover:text-white transition-colors"
        >
          <Icon name="close" size={24} />
        </button>
      </motion.div>

      <div className="flex-1 overflow-hidden flex items-center justify-center px-3 md:px-6 relative" dir="ltr">
        <button
          onClick={() => handleSpreadChange(Math.max(activeIdx - 1, 0))}
          disabled={activeIdx === 0}
          className="absolute left-2 md:left-6 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center backdrop-blur-sm disabled:opacity-0 transition-all"
        >
          <Icon name="chevron_left" size={28} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={spreads[activeIdx]?.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: spreadReady ? 1 : 0.4, scale: spreadReady ? 1 : 0.98 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-4xl aspect-[2/1] bg-white rounded-lg overflow-hidden shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)] relative flex"
          >
            {!spreadReady && (
              <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Skeleton width="90%" height="80%" borderRadius={8} />
              </div>
            )}
            <PreviewSpread spread={spreads[activeIdx]} />
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => handleSpreadChange(Math.min(activeIdx + 1, spreads.length - 1))}
          disabled={activeIdx === spreads.length - 1}
          className="absolute right-2 md:right-6 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center backdrop-blur-sm disabled:opacity-0 transition-all"
        >
          <Icon name="chevron_right" size={28} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pb-4 md:pb-6 pt-3 md:pt-4 px-4"
      >
        <div className="flex items-center gap-2">
          {spreads.map((_, i) => (
            <button
              key={i}
              onClick={() => handleSpreadChange(i)}
              className={`rounded-full transition-all duration-200 ${
                i === activeIdx
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/25 hover:bg-white/45'
              }`}
            />
          ))}
        </div>
        <div className="h-5 w-px bg-white/15" />
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { togglePreview(); navigate('/checkout') }}
          className="px-8 py-2.5 rounded-full bg-white text-deep-brown font-bold text-sm shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_32px_rgba(255,255,255,0.3)] transition-all"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          הזמן הדפסה
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
