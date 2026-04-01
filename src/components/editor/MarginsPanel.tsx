import { useState, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import Icon from '../shared/Icon'

/** White frame around each photo (px) */
const FRAME_PRESETS = [
  { label: 'ללא', value: 0 },
  { label: 'דק', value: 4 },
  { label: 'רגיל', value: 8 },
  { label: 'רחב', value: 14 },
  { label: 'מסגרת', value: 22 },
]

const MARGIN_PRESETS = [
  { label: 'ללא', value: 0 },
  { label: 'צר', value: 2 },
  { label: 'רגיל', value: 6 },
  { label: 'רחב', value: 10 },
  { label: 'מרווח', value: 16 },
]

const CORNER_PRESETS = [
  { label: 'חד', value: 0 },
  { label: 'מעט', value: 6 },
  { label: 'רגיל', value: 12 },
  { label: 'עגול', value: 18 },
  { label: 'מלא', value: 24 },
]

function MarginsMiniPreview({
  pageMarginPercent,
  framePaddingPx,
  cornerRadiusPx,
}: {
  pageMarginPercent: number
  framePaddingPx: number
  cornerRadiusPx: number
}) {
  const m = Math.max(0, Math.min(20, pageMarginPercent))
  const f = Math.max(0, framePaddingPx)
  const frameVis = Math.min(6, 1 + f * 0.35)
  const rMini = Math.max(0, Math.min(10, cornerRadiusPx * 0.38))

  return (
    <motion.div
      className="shrink-0 flex flex-col items-center gap-2"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <span
        className="text-[9px] font-semibold text-secondary/45 uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-family-body)' }}
      >
        תצוגה
      </span>
      <div
        className="rounded-xl overflow-hidden shadow-[inset_0_1px_3px_rgba(45,40,35,0.08)] border border-black/[0.07] box-border"
        style={{
          width: 72,
          height: 92,
          background: 'linear-gradient(160deg, #f3f0ea 0%, #e8e4dc 100%)',
          padding: `${m}%`,
        }}
      >
        <div className="w-full h-full min-h-0 flex">
          <div
            className="flex-1 rounded-md bg-white flex gap-0.5 min-h-0 min-w-0 shadow-[0_1px_4px_rgba(45,40,35,0.06)]"
            style={{
              padding: `${frameVis}px`,
              gap: 2,
            }}
          >
            <motion.div
              className="flex-1 min-w-0 min-h-0 bg-gradient-to-br from-stone-400/55 to-stone-500/45"
              layout
              style={{ borderRadius: rMini }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
            <motion.div
              className="flex-1 min-w-0 min-h-0 bg-gradient-to-br from-stone-400/55 to-stone-500/45"
              layout
              style={{ borderRadius: rMini }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SliderRow({
  label,
  icon,
  value,
  min,
  max,
  step,
  presets,
  unit,
  onChange,
}: {
  label: string
  icon: string
  value: number
  min: number
  max: number
  step: number
  presets: { label: string; value: number }[]
  unit: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/12 to-primary/4 flex items-center justify-center">
          <Icon name={icon} size={14} className="text-primary" />
        </div>
        <span className="text-[11px] font-semibold text-on-surface">{label}</span>
        <span className="text-[10px] text-secondary/60 mr-auto font-mono tabular-nums">
          {value}{unit}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-deep-brown [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
                     [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95"
          style={{
            background: `linear-gradient(to left, var(--color-primary) ${pct}%, rgba(0,0,0,0.06) ${pct}%)`,
          }}
        />
        {presets.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none flex items-center">
            {presets.map((p) => {
              const pos = ((p.value - min) / (max - min)) * 100
              return (
                <div
                  key={p.value}
                  className="absolute w-0.5 h-2.5 rounded-full bg-black/10"
                  style={{ right: `calc(${pos}% - 1px)` }}
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`flex-1 text-[9px] font-semibold py-1.5 rounded-lg transition-all duration-200 ${
              value === p.value
                ? 'bg-deep-brown text-white shadow-sm scale-[1.02]'
                : 'bg-surface-container-low/60 text-secondary/60 hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MarginsPanel({ onClose }: { onClose: () => void }) {
  const storeFrame = useEditorStore((s) => s.globalPhotoFramePaddingPx)
  const storeMargin = useEditorStore((s) => s.globalPageMarginPercent)
  const storeRadius = useEditorStore((s) => s.globalPhotoBorderRadiusPx)
  const setGlobalPhotoFramePadding = useEditorStore((s) => s.setGlobalPhotoFramePadding)
  const setGlobalPageMargin = useEditorStore((s) => s.setGlobalPageMargin)
  const setGlobalPhotoBorderRadius = useEditorStore((s) => s.setGlobalPhotoBorderRadius)

  const initialFrame = useRef(storeFrame)
  const initialMargin = useRef(storeMargin)
  const initialRadius = useRef(storeRadius)

  const [framePx, setFramePx] = useState(storeFrame ?? 8)
  const [margin, setMargin] = useState(storeMargin ?? 6)
  const [cornerPx, setCornerPx] = useState(storeRadius ?? 12)
  const [dirty, setDirty] = useState(false)

  const handleFrameChange = useCallback((v: number) => {
    setFramePx(v)
    setDirty(true)
    setGlobalPhotoFramePadding(v)
  }, [setGlobalPhotoFramePadding])

  const handleMarginChange = useCallback((v: number) => {
    setMargin(v)
    setDirty(true)
    setGlobalPageMargin(v)
  }, [setGlobalPageMargin])

  const handleCornerChange = useCallback((v: number) => {
    setCornerPx(v)
    setDirty(true)
    setGlobalPhotoBorderRadius(v)
  }, [setGlobalPhotoBorderRadius])

  const handleConfirm = useCallback(() => {
    setGlobalPhotoFramePadding(framePx)
    setGlobalPageMargin(margin)
    setGlobalPhotoBorderRadius(cornerPx)
    onClose()
  }, [framePx, margin, cornerPx, setGlobalPhotoFramePadding, setGlobalPageMargin, setGlobalPhotoBorderRadius, onClose])

  const handleReset = useCallback(() => {
    setFramePx(8)
    setMargin(6)
    setCornerPx(12)
    setDirty(true)
    setGlobalPhotoFramePadding(null)
    setGlobalPageMargin(null)
    setGlobalPhotoBorderRadius(null)
  }, [setGlobalPhotoFramePadding, setGlobalPageMargin, setGlobalPhotoBorderRadius])

  const handleCancel = useCallback(() => {
    setGlobalPhotoFramePadding(initialFrame.current)
    setGlobalPageMargin(initialMargin.current)
    setGlobalPhotoBorderRadius(initialRadius.current)
    onClose()
  }, [setGlobalPhotoFramePadding, setGlobalPageMargin, setGlobalPhotoBorderRadius, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-[min(22rem,calc(100vw-2.5rem))] max-h-[78vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
            <Icon name="padding" size={16} className="text-primary" />
          </div>
          <h3
            className="text-sm font-bold text-on-surface"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            שוליים ופינות
          </h3>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:gap-5">
        <div className="flex flex-col gap-5 flex-1 min-w-0 order-2 sm:order-1">
          <SliderRow
            label="מסגרת לבנה סביב כל תמונה"
            icon="crop_square"
            value={framePx}
            min={0}
            max={28}
            step={1}
            presets={FRAME_PRESETS}
            unit="px"
            onChange={handleFrameChange}
          />

          <div className="h-px bg-gradient-to-l from-transparent via-black/6 to-transparent" />

          <SliderRow
            label="שוליים מקצה העמוד (כל הפריסה)"
            icon="crop_free"
            value={margin}
            min={0}
            max={16}
            step={0.5}
            presets={MARGIN_PRESETS}
            unit="%"
            onChange={handleMarginChange}
          />

          <div className="h-px bg-gradient-to-l from-transparent via-black/6 to-transparent" />

          <SliderRow
            label="עיגול פינות כל המסגרות"
            icon="rounded_corner"
            value={cornerPx}
            min={0}
            max={24}
            step={1}
            presets={CORNER_PRESETS}
            unit="px"
            onChange={handleCornerChange}
          />
        </div>

        <div className="order-1 sm:order-2 flex justify-center sm:pt-1">
          <MarginsMiniPreview
            pageMarginPercent={margin}
            framePaddingPx={framePx}
            cornerRadiusPx={cornerPx}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          className="flex-1 py-2.5 rounded-xl bg-deep-brown text-white text-[12px] font-bold shadow-[0_4px_14px_rgba(47,46,43,0.25)] hover:shadow-[0_6px_20px_rgba(47,46,43,0.35)] transition-shadow"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Icon name="check" size={16} className="text-white" />
            <span>אישור</span>
          </div>
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleReset}
          className="px-3 py-2.5 rounded-xl bg-surface-container-low/80 text-secondary/70 text-[11px] font-semibold hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          איפוס
        </motion.button>
      </div>

      <div className="mt-3 pt-2 border-t border-black/[0.04]">
        <p className="text-[9px] text-secondary/40 leading-relaxed text-center">
          {dirty
            ? 'השינויים מוצגים בזמן אמת — אישור משאיר את הערכים בכל העמודים'
            : 'השינויים חלים על כל עמודי האלבום'}
        </p>
      </div>
    </motion.div>
  )
}
