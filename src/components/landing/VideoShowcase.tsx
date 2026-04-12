import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import Icon from '../shared/Icon'

interface Slot {
  id: string
  /** Replace with actual video src when ready */
  videoSrc?: string
  bg: string
  label: string
  caption: string
}

const slots: Slot[] = [
  {
    id: 'v1',
    bg: '#E8E3DC',
    label: 'מדריך קצר',
    caption: 'איך יוצרים אלבום ב-2 דקות',
  },
  {
    id: 'v2',
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
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const effectiveInView = lead || isInView

  return (
    <section ref={ref} className="w-full">
      {/* Editorial heading above the videos */}
      <div
        data-landing-video-intro={lead ? '' : undefined}
        className={
          lead
            ? 'text-center px-6 pt-28 pb-16 md:pt-32 md:pb-20 bg-gradient-to-b from-deep-brown via-[#1f1c19] to-[#252220]'
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
            {/* Background / video */}
            {slot.videoSrc ? (
              <video
                src={slot.videoSrc}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                playsInline
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${slot.bg} 0%, ${slot.bg}dd 100%)`,
                }}
              >
                {/* Subtle texture pattern for placeholder */}
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

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-deep-brown/15 flex items-center justify-center backdrop-blur-sm transition-all duration-500 group-hover:border-deep-brown/30 group-hover:bg-white/10"
              >
                <Icon
                  name="play_arrow"
                  size={36}
                  className="text-deep-brown/35 group-hover:text-deep-brown/60 transition-colors duration-500 mr-[-2px]"
                />
              </motion.div>
            </div>

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
