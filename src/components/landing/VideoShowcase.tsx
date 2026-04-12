import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

interface Slot {
  id: string
  videoSrc?: string
  /** Static image instead of video / placeholder (e.g. RTL visual left column) */
  imageSrc?: string
  bg: string
  label: string
  caption: string
}

const slots: Slot[] = [
  {
    id: 'v1',
    /** RTL: first column = visual right */
    videoSrc: '/static-wooden.mp4',
    bg: '#E8E3DC',
    label: 'מדריך קצר',
    caption: 'איך יוצרים אלבום ב-2 דקות',
  },
  {
    id: 'v2',
    /** RTL: second column = visual left */
    imageSrc: '/showcase-left-shadow.png',
    bg: '#DDD7CE',
    label: 'מאחורי הקלעים',
    caption: 'האיכות שמרגישים ביד',
  },
]

interface VideoShowcaseProps {
  /** First on page: dark intro under fixed header + light nav */
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

  const handleExisting = () => {
    if (isLoggedIn) navigate('/dashboard')
    else openAuthModal('login', '/dashboard')
  }

  return (
    <section ref={ref} className="w-full">
      {/* Editorial heading above the videos */}
      <div
        data-landing-video-intro={lead ? '' : undefined}
        className={
          lead
            ? 'text-center px-6 pt-28 pb-14 md:pt-32 md:pb-20 bg-gradient-to-b from-deep-brown via-[#1f1c19] to-[#252220]'
            : 'text-center py-20 md:py-28 px-6'
        }
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={effectiveInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className={
            lead
              ? 'text-[11px] md:text-[12px] tracking-[0.45em] uppercase text-white/45 mb-5'
              : 'text-[11px] md:text-[12px] tracking-[0.45em] uppercase text-warm-gray/60 mb-5'
          }
          style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
        >
          See It in Motion
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={effectiveInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className={
            lead
              ? 'text-3xl sm:text-4xl md:text-5xl text-white leading-tight'
              : 'text-3xl sm:text-4xl md:text-5xl text-deep-brown leading-tight'
          }
          style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
        >
          תראו בעצמכם.
        </motion.h2>

        {lead && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={effectiveInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
          >
            <button
              type="button"
              onClick={handleCreate}
              className="btn-press border border-white/65 bg-white/[0.06] px-10 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all duration-500 hover:border-white hover:bg-white hover:text-deep-brown md:px-12 md:py-4 md:text-[12px] md:tracking-[0.2em]"
            >
              התחילו ליצור
            </button>
            <button
              type="button"
              onClick={handleExisting}
              className="btn-press text-[12px] text-white/45 transition-colors duration-300 hover:text-white/80 md:text-[13px]"
            >
              יש לי כבר חשבון
            </button>
          </motion.div>
        )}
      </div>

      {/* Two-up video grid — Artifact Uprising split style */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0 }}
            animate={effectiveInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
            className="relative overflow-hidden group cursor-pointer"
            style={{ aspectRatio: '16 / 10' }}
          >
            {/* Background: video, image, or placeholder */}
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
              <>
                <img
                  src={slot.imageSrc}
                  alt="צל אמנותי של ספר על קיר טקסטורי"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                  aria-hidden
                />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${slot.bg} 0%, ${slot.bg}dd 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 1px 1px, #2D2926 0.5px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }}
                />
              </div>
            )}

            {/* Play button — placeholder slots only */}
            {!slot.videoSrc && !slot.imageSrc && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-deep-brown/15 backdrop-blur-sm transition-all duration-500 group-hover:border-deep-brown/30 group-hover:bg-white/10 md:h-24 md:w-24"
                >
                  <Icon
                    name="play_arrow"
                    size={36}
                    className="mr-[-2px] text-deep-brown/35 transition-colors duration-500 group-hover:text-deep-brown/60"
                  />
                </motion.div>
              </div>
            )}

            {/* Caption — bottom-left */}
            <div className="absolute bottom-6 right-6 left-6 md:bottom-8 md:right-8 md:left-8 z-10">
              <p
                className="text-[10px] tracking-[0.35em] uppercase text-deep-brown/30 mb-1.5"
                style={{ fontFamily: 'var(--font-family-label)' }}
              >
                {slot.label}
              </p>
              <p
                className="text-base md:text-lg text-deep-brown/60 leading-snug"
                style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 400 }}
              >
                {slot.caption}
              </p>
            </div>

            {/* Hairline separator between slots */}
            {i === 0 && (
              <div className="hidden md:block absolute top-0 left-0 bottom-0 w-px bg-deep-brown/[0.06] z-20" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
