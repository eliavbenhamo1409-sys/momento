import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'

export default function HeroSection() {
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.04])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, 24])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0])

  const handleCreate = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('signup', '/upload')
  }

  return (
    <section
      ref={sectionRef}
      data-landing-hero=""
      className="relative z-[1] isolate w-full overflow-hidden border-b border-black/[0.06] bg-white"
    >
      {/* LTR row: physical left = image, physical right = copy (Hebrew RTL inside) */}
      <div className="flex min-h-[min(40vh,420px)] max-h-[min(44vh,480px)] flex-col md:mx-auto md:min-h-[min(42vh,440px)] md:max-h-[min(46vh,520px)] md:max-w-[1600px] md:flex-row">
        {/* Image — left on desktop, top on mobile */}
        <motion.div
          className="relative h-[28vh] min-h-[200px] max-h-[280px] w-full shrink-0 overflow-hidden md:h-auto md:max-h-none md:min-h-0 md:w-[48%] lg:w-[50%]"
          style={{ scale: imgScale }}
        >
          <img
            src="/hero-nature.png"
            alt="אלבום תמונות בחיק הטבע"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0 md:hidden"
            style={{
              background:
                'linear-gradient(to bottom, transparent 60%, rgba(26,23,20,0.12) 100%)',
            }}
          />
        </motion.div>

        {/* Copy + CTA — right on desktop */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          dir="rtl"
          className="relative z-10 flex flex-1 flex-col justify-center gap-5 bg-white px-8 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-right text-[10px] font-medium uppercase tracking-[0.45em] text-secondary md:text-[12px]"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
          >
            The Art of Remembering
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-right text-[1.85rem] leading-[1.12] text-deep-brown sm:text-4xl md:text-[2.35rem] md:leading-[1.1] lg:text-5xl"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
          >
            התמונות שלכם.
            <br />
            <span style={{ fontWeight: 600 }}>באלבום מושלם.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.5 }}
            className="max-w-md text-right text-[14px] leading-relaxed text-on-surface-variant md:text-[15px]"
          >
            מעלים את כל התמונות מהטלפון. מקבלים אלבום מעוצב בדלת.
            <br className="hidden sm:block" />
            <span className="text-secondary">בין לבין — אפס עבודה.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.72 }}
            className="flex flex-col items-end"
          >
            <button
              type="button"
              onClick={handleCreate}
              className="btn-press bg-deep-brown px-10 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-sm transition-[background-color,transform] duration-300 hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-brown focus-visible:ring-offset-2 focus-visible:ring-offset-white md:px-12 md:py-4 md:text-[12px] md:tracking-[0.2em]"
            >
              הרכיבו זיכרון
            </button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.7 }}
        className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 md:bottom-5"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-7 w-px bg-gradient-to-b from-transparent via-deep-brown/25 to-transparent"
        />
      </motion.div>
    </section>
  )
}
