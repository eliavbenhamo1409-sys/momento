import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'

interface Slot {
  id: string
  videoSrc?: string
  imageSrc?: string
  bg: string
}

const slots: Slot[] = [
  {
    id: 'v1',
    videoSrc: '/static-wooden.mp4',
    bg: '#E8E3DC',
  },
  {
    id: 'v2',
    imageSrc: '/showcase-left-shadow.png',
    bg: '#DDD7CE',
  },
]

const STEPS = [
  { num: '01', text: 'מעלים את התמונות' },
  { num: '02', text: 'AI מעצב ומסנן' },
  { num: '03', text: 'אלבום מוכן לעריכה מלאה' },
]

interface VideoShowcaseProps {
  lead?: boolean
}

export default function VideoShowcase({ lead = false }: VideoShowcaseProps) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const effectiveInView = lead || isInView

  const handleCreate = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('signup', '/upload')
  }

  return (
    <section ref={ref} className="w-full">
      {/* Intro band */}
      <div
        data-landing-video-intro={lead ? '' : undefined}
        className={
          lead
            ? 'border-b border-black/[0.06] bg-white px-6 pt-32 pb-12 text-center md:pt-40 md:pb-16'
            : 'px-6 py-20 text-center md:py-28'
        }
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={effectiveInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className={
            lead
              ? 'mb-5 text-[11px] uppercase tracking-[0.45em] text-secondary md:text-[12px]'
              : 'mb-5 text-[11px] uppercase tracking-[0.45em] text-warm-gray/60 md:text-[12px]'
          }
          style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
        >
          See It in Motion
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-3xl leading-tight text-deep-brown sm:text-4xl md:text-5xl"
          style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
        >
          תראו בעצמכם.
        </motion.h2>

        {lead && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={effectiveInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="mt-10 flex justify-center"
          >
            <button
              type="button"
              onClick={handleCreate}
              className="btn-press bg-deep-brown px-10 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-sm transition-[background-color,transform] duration-300 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-brown focus-visible:ring-offset-2 focus-visible:ring-offset-white md:px-12 md:py-4 md:text-[12px] md:tracking-[0.2em]"
            >
              התחילו ליצור
            </button>
          </motion.div>
        )}
      </div>

      {/* Two-up media grid with center steps overlay */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {slots.map((slot, i) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0 }}
              animate={effectiveInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
              className="relative overflow-hidden"
              style={{ aspectRatio: '16 / 10' }}
            >
              {slot.videoSrc ? (
                <video
                  src={slot.videoSrc}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : slot.imageSrc ? (
                <img
                  src={slot.imageSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${slot.bg} 0%, ${slot.bg}dd 100%)`,
                  }}
                />
              )}

              {/* Darkening veil for readability where steps sit */}
              <div
                className="pointer-events-none absolute inset-0 bg-black/25"
                aria-hidden
              />
            </motion.div>
          ))}
        </div>

        {/* 3-step journey — centered overlay on the dividing line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="pointer-events-none absolute inset-0 z-30 hidden items-center justify-center md:flex"
        >
          <div className="flex flex-col items-center gap-10">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex flex-col items-center gap-2.5">
                {/* numbered circle */}
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-[11px] font-medium tracking-widest text-white/80 backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {step.num}
                </span>
                {/* label */}
                <span
                  className="text-center text-[13px] font-medium leading-snug tracking-wide text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]"
                  style={{ fontFamily: "'Allura', cursive", fontSize: '1.15rem' }}
                >
                  {step.text}
                </span>
                {/* connector line */}
                {i < STEPS.length - 1 && (
                  <span
                    className="mt-1 block h-6 w-px bg-gradient-to-b from-white/30 to-transparent"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mobile: steps strip below the media */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={effectiveInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col items-center gap-6 bg-deep-brown px-6 py-10 md:hidden"
        >
          <div className="flex w-full max-w-sm items-start justify-between gap-2">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex flex-1 flex-col items-center gap-2 text-center">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-[9px] font-medium tracking-widest text-white/80"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {step.num}
                </span>
                <span
                  className="text-[12px] leading-snug text-white/75"
                  style={{ fontFamily: "'Allura', cursive", fontSize: '0.95rem' }}
                >
                  {step.text}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="sr-only">→</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
