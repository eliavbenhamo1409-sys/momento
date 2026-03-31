import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { useUIStore } from '../../store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import Icon from '../shared/Icon'
import type { PhotoElement } from '../../types'

// ─── Helpers ─────────────────────────────────────────────────────────

function parseObjectPosition(pos: string): { x: number; y: number } {
  const parts = pos.split(/\s+/)
  return {
    x: parseFloat(parts[0]) || 50,
    y: parseFloat(parts[1]) || 50,
  }
}

// ─── Pan Handle (draggable photo preview) ────────────────────────────

function PanPreview({
  photoUrl,
  objectPosition,
  objectFit,
  scale,
  borderRadius,
  onPositionChange,
}: {
  photoUrl: string
  objectPosition: string
  objectFit: 'cover' | 'contain'
  scale: number
  borderRadius: number
  onPositionChange: (pos: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startObjPos = useRef({ x: 50, y: 50 })
  const localPosRef = useRef<string | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    localPosRef.current = null
    startPos.current = { x: e.clientX, y: e.clientY }
    startObjPos.current = parseObjectPosition(objectPosition)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [objectPosition])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y

    const sensitivity = 100 / Math.max(rect.width, 1)
    const newX = Math.max(0, Math.min(100, startObjPos.current.x - dx * sensitivity))
    const newY = Math.max(0, Math.min(100, startObjPos.current.y - dy * sensitivity))

    const newPos = `${Math.round(newX)}% ${Math.round(newY)}%`
    localPosRef.current = newPos
    if (imgRef.current) {
      imgRef.current.style.objectPosition = newPos
      if (scale > 1) imgRef.current.style.transformOrigin = newPos
    }
  }, [scale])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
    if (localPosRef.current) {
      onPositionChange(localPosRef.current)
      localPosRef.current = null
    }
  }, [onPositionChange])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ borderRadius }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        ref={imgRef}
        src={photoUrl}
        alt=""
        draggable={false}
        className="w-full h-full pointer-events-none"
        style={{
          objectFit,
          objectPosition,
          transformOrigin: scale > 1 ? objectPosition : undefined,
          transform: scale > 1 ? `scale(${scale})` : undefined,
        }}
      />

      {/* Drag indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/30 backdrop-blur-sm rounded-full p-2">
          <Icon name="open_with" size={20} className="text-white" />
        </div>
      </div>

      {/* Crosshair guides */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15" />
      </div>
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────

export default function PhotoEditorModal() {
  const { selectedPhotoId, spreads, currentSpreadIndex } = useEditorStore(useShallow((s) => ({
    selectedPhotoId: s.selectedPhotoId,
    spreads: s.spreads,
    currentSpreadIndex: s.currentSpreadIndex,
  })))
  const selectPhoto = useEditorStore((s) => s.selectPhoto)
  const updatePhotoObjectPosition = useEditorStore((s) => s.updatePhotoObjectPosition)
  const updatePhotoScale = useEditorStore((s) => s.updatePhotoScale)
  const updatePhotoSlotRadius = useEditorStore((s) => s.updatePhotoSlotRadius)
  const resizePhotoSlot = useEditorStore((s) => s.resizePhotoSlot)
  const replacePhotoInSlot = useEditorStore((s) => s.replacePhotoInSlot)
  const removePhotoFromSlot = useEditorStore((s) => s.removePhotoFromSlot)
  const addToast = useUIStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'position' | 'frame' | 'ai'>('position')

  // Resolve the selected photo element
  const spread = spreads[currentSpreadIndex]
  const slotId = selectedPhotoId?.replace(`${spread?.id}-`, '') ?? ''

  const photoElement = spread?.design?.elements.find(
    (el) => el.type === 'photo' && el.slotId === slotId,
  ) as PhotoElement | undefined

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectPhoto(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectPhoto])

  if (!selectedPhotoId || !photoElement?.photoUrl) return null

  const pos = parseObjectPosition(photoElement.objectPosition || '50% 50%')
  const currentScale = photoElement.scale ?? 1

  const handlePositionChange = (newPos: string) => {
    updatePhotoObjectPosition(slotId, newPos)
  }

  const handleReplace = () => fileRef.current?.click()

  const handleRemove = () => {
    removePhotoFromSlot(slotId)
    addToast('התמונה הוסרה מהמסגרת', 'success')
  }

  return (
    <AnimatePresence>
      <motion.div
        key="photo-editor-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => selectPhoto(null)}
      >
        <motion.div
          key="photo-editor-panel"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          dir="rtl"
          className="relative w-[min(28rem,92vw)] max-h-[90vh] overflow-y-auto no-scrollbar bg-white rounded-3xl shadow-[0_24px_80px_rgba(45,40,35,0.20),0_0_0_1px_rgba(0,0,0,0.04)] p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Icon name="photo_camera" size={18} className="text-primary" />
              </div>
              <h2
                className="text-base font-bold text-on-surface"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                עריכת תמונה
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => selectPhoto(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
            >
              <Icon name="close" size={20} />
            </motion.button>
          </div>

          {/* Photo preview with pan */}
          <div className="px-5 pb-4 group">
            <PanPreview
              photoUrl={photoElement.photoUrl}
              objectPosition={photoElement.objectPosition || '50% 50%'}
              objectFit={photoElement.objectFit}
              scale={currentScale}
              borderRadius={photoElement.borderRadius}
              onPositionChange={handlePositionChange}
            />
            <p className="text-center text-[11px] text-secondary/50 mt-2 font-medium">
              גרור את התמונה למיקום הרצוי
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 px-5 pb-3">
            {([
              { id: 'position' as const, icon: 'open_with', label: 'מיקום' },
              { id: 'frame' as const, icon: 'crop' , label: 'מסגרת' },
              { id: 'ai' as const, icon: 'auto_awesome', label: 'AI' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-secondary/60 hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <Icon name={tab.icon} size={15} filled={activeTab === tab.id} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-5 pb-5">
            <AnimatePresence mode="wait">
              {activeTab === 'position' && (
                <motion.div
                  key="tab-position"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {/* Position nudge */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-secondary/70 font-semibold tracking-wide">מיקום התמונה במסגרת</label>
                    <div className="grid grid-cols-3 gap-1.5 max-w-[9rem] mx-auto">
                      <div />
                      <NudgeBtn icon="keyboard_arrow_up" onClick={() => handlePositionChange(`${pos.x}% ${Math.max(0, pos.y - 5)}%`)} />
                      <div />
                      <NudgeBtn icon="keyboard_arrow_right" onClick={() => handlePositionChange(`${Math.max(0, pos.x - 5)}% ${pos.y}%`)} />
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handlePositionChange('50% 50%')}
                          className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                          title="מרכז"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary/50" />
                        </button>
                      </div>
                      <NudgeBtn icon="keyboard_arrow_left" onClick={() => handlePositionChange(`${Math.min(100, pos.x + 5)}% ${pos.y}%`)} />
                      <div />
                      <NudgeBtn icon="keyboard_arrow_down" onClick={() => handlePositionChange(`${pos.x}% ${Math.min(100, pos.y + 5)}%`)} />
                      <div />
                    </div>
                  </div>

                  {/* Zoom */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-secondary/70 font-semibold tracking-wide">זום</label>
                      <span className="text-[10px] text-secondary/40">{Math.round(currentScale * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="zoom_out" size={16} className="text-secondary/40" />
                      <input
                        type="range"
                        min={100}
                        max={250}
                        step={5}
                        value={Math.round(currentScale * 100)}
                        onChange={(e) => updatePhotoScale(slotId, Number(e.target.value) / 100)}
                        className="flex-1 h-1.5 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                      />
                      <Icon name="zoom_in" size={16} className="text-secondary/40" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'frame' && (
                <motion.div
                  key="tab-frame"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {/* Frame size */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-secondary/70 font-semibold tracking-wide">גודל מסגרת</label>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => resizePhotoSlot(slotId, { width: -3, height: -3 })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-xs text-on-surface/70 transition-colors font-medium"
                      >
                        <Icon name="zoom_out" size={15} />
                        הקטן
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => resizePhotoSlot(slotId, { width: 3, height: 3 })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-xs text-on-surface/70 transition-colors font-medium"
                      >
                        <Icon name="zoom_in" size={15} />
                        הגדל
                      </motion.button>
                    </div>
                  </div>

                  {/* Corner radius */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-secondary/70 font-semibold tracking-wide">עיגול פינות</label>
                      <span className="text-[10px] text-secondary/40">{photoElement.borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={photoElement.borderRadius}
                      onChange={(e) => updatePhotoSlotRadius(slotId, Number(e.target.value))}
                      className="w-full h-1.5 bg-surface-container-low rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-secondary/40">
                      <span>חד</span>
                      <span>עגול</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  key="tab-ai"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <Icon name="auto_awesome" size={24} className="text-primary" />
                    </div>
                    <p className="text-sm text-secondary/70 text-center leading-relaxed">
                      שיפור תמונה חכם עם AI
                      <br />
                      <span className="text-xs text-secondary/40">בקרוב...</span>
                    </p>
                  </div>
                  <button
                    disabled
                    className="w-full py-2.5 bg-primary/10 text-primary/40 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Icon name="magic_button" size={18} />
                    שפר עם AI
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action bar */}
          <div className="border-t border-black/[0.04] px-5 py-4 flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.heic,.heif,.tiff,.tif"
              className="sr-only"
              onChange={async (e) => {
                const raw = e.target.files?.[0]
                if (raw) {
                  const { convertImageFile } = await import('../../lib/photoUtils')
                  const f = await convertImageFile(raw).catch(() => raw)
                  replacePhotoInSlot(slotId, f)
                  addToast('התמונה הוחלפה בהצלחה', 'success')
                }
                if (e.target) e.target.value = ''
              }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReplace}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/8 hover:bg-primary/14 text-primary text-xs font-semibold transition-colors"
            >
              <Icon name="swap_horiz" size={16} />
              החלף תמונה
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRemove}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-error/8 hover:bg-error/14 text-error text-xs font-semibold transition-colors"
            >
              <Icon name="delete" size={16} />
              הסר
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Small nudge button ──────────────────────────────────────────────

function NudgeBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex items-center justify-center p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
    >
      <Icon name={icon} size={16} className="text-on-surface/60" />
    </motion.button>
  )
}
