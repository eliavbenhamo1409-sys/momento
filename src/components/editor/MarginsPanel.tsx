import { useState, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import { DEFAULT_GLOBAL_PAGE_EDGE_MARGIN_PERCENT } from './editorDefaults'
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
  { label: 'צר', value: 1 },
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

const MICRO_BOX = 'shrink-0 w-[42px] h-[52px] rounded-[10px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_3px_rgba(45,40,35,0.06)]'
const PHOTO_GRAD = 'bg-gradient-to-br from-stone-400/60 to-stone-500/50'
const ANIM_EASE = [0.4, 0, 0.2, 1] as const
const ANIM_DURATION = 2.6

function FrameMicroAnim() {
  return (
    <div className={MICRO_BOX} style={{ background: '#ede9e1' }}>
      <div className="w-full h-full flex gap-[2px] p-[2px]">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="flex-1 bg-white overflow-hidden"
            style={{ minWidth: 0, minHeight: 0 }}
            animate={{ padding: [0, 5, 0] }}
            transition={{
              duration: ANIM_DURATION,
              repeat: Infinity,
              ease: ANIM_EASE,
              delay: i * 0.12,
            }}
          >
            <div className={`w-full h-full ${PHOTO_GRAD}`} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function MarginMicroAnim() {
  return (
    <motion.div
      className={MICRO_BOX}
      style={{ background: 'linear-gradient(160deg, #f3f0ea, #e8e4dc)' }}
      animate={{ padding: ['1px', '8px', '1px'] }}
      transition={{ duration: ANIM_DURATION, repeat: Infinity, ease: ANIM_EASE }}
    >
      <div className="w-full h-full flex gap-[1px] overflow-hidden">
        <div className={`flex-1 min-w-0 min-h-0 ${PHOTO_GRAD}`} />
        <div className={`flex-1 min-w-0 min-h-0 ${PHOTO_GRAD}`} />
      </div>
    </motion.div>
  )
}

function CornerMicroAnim() {
  return (
    <div className={MICRO_BOX} style={{ background: '#ede9e1' }}>
      <div className="w-full h-full flex gap-[2px] p-[3px]">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className={`flex-1 min-w-0 min-h-0 ${PHOTO_GRAD}`}
            animate={{ borderRadius: ['0px', '12px', '0px'] }}
            transition={{
              duration: ANIM_DURATION,
              repeat: Infinity,
              ease: ANIM_EASE,
              delay: i * 0.12,
            }}
          />
        ))}
      </div>
    </div>
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
  microPreview,
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
  microPreview?: React.ReactNode
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex gap-3 items-center">
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
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
              className={`flex-1 text-[9px] font-semibold py-1.5 rounded-lg transition-colors ${
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

      {microPreview && (
        <div className="shrink-0 self-center">{microPreview}</div>
      )}
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
  const [margin, setMargin] = useState(storeMargin ?? DEFAULT_GLOBAL_PAGE_EDGE_MARGIN_PERCENT)
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
    setMargin(DEFAULT_GLOBAL_PAGE_EDGE_MARGIN_PERCENT)
    setCornerPx(12)
    setDirty(true)
    setGlobalPhotoFramePadding(null)
    setGlobalPageMargin(DEFAULT_GLOBAL_PAGE_EDGE_MARGIN_PERCENT)
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

      <div className="flex flex-col gap-5">
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
          microPreview={<FrameMicroAnim />}
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
          microPreview={<MarginMicroAnim />}
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
          microPreview={<CornerMicroAnim />}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          className="btn-press flex-1 py-2.5 rounded-xl bg-deep-brown text-white text-[12px] font-bold shadow-[0_4px_14px_rgba(47,46,43,0.25)] hover:shadow-[0_6px_20px_rgba(47,46,43,0.35)] transition-shadow"
        >
          <div className="flex items-center justify-center gap-1.5">
            <Icon name="check" size={16} className="text-white" />
            <span>אישור</span>
          </div>
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="btn-press px-3 py-2.5 rounded-xl bg-surface-container-low/80 text-secondary/70 text-[11px] font-semibold hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          איפוס
        </button>
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
