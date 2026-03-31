import { useState, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { useEditorStore } from '../../store/editorStore'
import Icon from '../shared/Icon'

const GAP_PRESETS = [
  { label: 'ללא', value: 0 },
  { label: 'צר', value: 4 },
  { label: 'רגיל', value: 10 },
  { label: 'רחב', value: 18 },
  { label: 'מרווח', value: 28 },
]

const MARGIN_PRESETS = [
  { label: 'ללא', value: 0 },
  { label: 'צר', value: 2 },
  { label: 'רגיל', value: 6 },
  { label: 'רחב', value: 10 },
  { label: 'מרווח', value: 16 },
]

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
  const storeGap = useEditorStore((s) => s.globalPhotoGapPx)
  const storeMargin = useEditorStore((s) => s.globalPageMarginPercent)
  const setGlobalPhotoGap = useEditorStore((s) => s.setGlobalPhotoGap)
  const setGlobalPageMargin = useEditorStore((s) => s.setGlobalPageMargin)

  const initialGap = useRef(storeGap)
  const initialMargin = useRef(storeMargin)

  const [gap, setGap] = useState(storeGap ?? 10)
  const [margin, setMargin] = useState(storeMargin ?? 6)
  const [dirty, setDirty] = useState(false)

  const handleGapChange = useCallback((v: number) => {
    setGap(v)
    setDirty(true)
    setGlobalPhotoGap(v)
  }, [setGlobalPhotoGap])

  const handleMarginChange = useCallback((v: number) => {
    setMargin(v)
    setDirty(true)
    setGlobalPageMargin(v)
  }, [setGlobalPageMargin])

  const handleConfirm = useCallback(() => {
    setGlobalPhotoGap(gap)
    setGlobalPageMargin(margin)
    onClose()
  }, [gap, margin, setGlobalPhotoGap, setGlobalPageMargin, onClose])

  const handleReset = useCallback(() => {
    setGap(10)
    setMargin(6)
    setDirty(true)
    setGlobalPhotoGap(null)
    setGlobalPageMargin(null)
  }, [setGlobalPhotoGap, setGlobalPageMargin])

  const handleCancel = useCallback(() => {
    setGlobalPhotoGap(initialGap.current)
    setGlobalPageMargin(initialMargin.current)
    onClose()
  }, [setGlobalPhotoGap, setGlobalPageMargin, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute md:right-full md:top-0 md:me-3 max-md:bottom-full max-md:mb-3 max-md:right-0 w-72 max-w-[min(18rem,calc(100vw-3rem))] max-h-[70vh] overflow-y-auto no-scrollbar rounded-2xl bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(45,40,35,0.12)] p-4 pointer-events-auto"
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
            שוליים
          </h3>
        </div>
        <button
          onClick={handleCancel}
          className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-on-surface hover:bg-surface-container-high/70 transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <SliderRow
          label="מרווח בין תמונות"
          icon="space_bar"
          value={gap}
          min={0}
          max={28}
          step={1}
          presets={GAP_PRESETS}
          unit="px"
          onChange={handleGapChange}
        />

        <div className="h-px bg-gradient-to-l from-transparent via-black/6 to-transparent" />

        <SliderRow
          label="שוליים מקצה העמוד"
          icon="crop_free"
          value={margin}
          min={0}
          max={16}
          step={0.5}
          presets={MARGIN_PRESETS}
          unit="%"
          onChange={handleMarginChange}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <motion.button
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
          {dirty ? 'תצוגה מקדימה — לחצו אישור לשמירה' : 'השינויים חלים על כל עמודי האלבום'}
        </p>
      </div>
    </motion.div>
  )
}
