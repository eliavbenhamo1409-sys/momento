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
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, 60])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  const handleCreate = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('signup', '/upload')
  }

  const handleExisting = () => {
    if (isLoggedIn) navigate('/dashboard')
    else openAuthModal('login', '/dashboard')
  }

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden">
      {/* Full-bleed background */}
      <motion.div className="absolute inset-0" style={{ scale: imgScale }}>
        <img
          src="/hero-nature.png"
          alt="אלבום תמונות בחיק הטבע"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(26,23,20,0.65) 0%, rgba(26,23,20,0.25) 35%, rgba(26,23,20,0.08) 70%, rgba(26,23,20,0.15) 100%)',
        }}
      />

      {/* Content — anchored to bottom-center */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full flex flex-col items-center justify-end pb-20 md:pb-28 lg:pb-32 text-center px-6"
      >
        {/* English editorial tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] md:text-[13px] tracking-[0.5em] uppercase text-white/50 mb-7"
          style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
        >
          The Art of Remembering
        </motion.p>

        {/* Hebrew headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[2.6rem] sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-6"
          style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
        >
          התמונות שלכם.
          <br />
          <span style={{ fontWeight: 600 }}>באלבום מושלם.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="text-[15px] md:text-lg text-white/55 mb-12 max-w-md leading-relaxed"
        >
          שופכים תמונות מהטלפון. מקבלים אלבום מעוצב בדלת.
          <br className="hidden sm:block" />
          <span className="text-white/70">בין לבין — אפס עבודה.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col sm:flex-row gap-5 items-center"
        >
          <button
            onClick={handleCreate}
            className="border border-white/70 text-white px-12 py-4 tracking-[0.2em] uppercase text-[12px] font-medium hover:bg-white hover:text-[#1A1714] transition-all duration-500 backdrop-blur-sm"
          >
            התחילו ליצור
          </button>
          <button
            onClick={handleExisting}
            className="text-white/40 hover:text-white/70 transition-colors duration-300 text-[13px] tracking-wide"
          >
            יש לי כבר חשבון
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
