import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'

const ROTATING = ['מושלם', 'שלכם', 'אישי', 'אמיתי']

export default function HeroSection() {
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const sectionRef = useRef<HTMLElement>(null)
  const [wordIdx, setWordIdx] = useState(0)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const imgX = useSpring(mouseX, { stiffness: 40, damping: 25 })
  const imgY = useSpring(mouseY, { stiffness: 40, damping: 25 })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % ROTATING.length), 3000)
    return () => clearInterval(t)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const r = sectionRef.current?.getBoundingClientRect()
    if (!r) return
    mouseX.set(((e.clientX - r.left) / r.width - 0.5) * 24)
    mouseY.set(((e.clientY - r.top) / r.height - 0.5) * 16)
  }, [mouseX, mouseY])

  const handleCreate = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('signup', '/upload')
  }

  const handleExisting = () => {
    if (isLoggedIn) navigate('/dashboard')
    else openAuthModal('login', '/dashboard')
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative min-h-[96vh] pt-32 pb-24 flex items-center overflow-hidden"
    >
      {/* Warm neutral bg */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />

      <motion.div
        style={{ opacity: textOpacity }}
        className="container mx-auto px-5 sm:px-8 md:px-12 lg:px-10 xl:px-14 relative z-10 max-w-[1400px]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.32fr)] gap-12 lg:gap-14 xl:gap-16 items-center">

          {/* ── Text ──────────────────────────────── */}
          <div className="order-2 lg:order-1 max-w-2xl lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                className="text-sm tracking-[0.2em] text-warm-gray mb-8 font-medium uppercase"
                style={{ fontFamily: 'var(--font-family-body)' }}
              >
                נ.ב. — האלבום מכין את עצמו
              </p>

              <h1
                className="text-[2.8rem] sm:text-[3.5rem] lg:text-[4.4rem] leading-[1.06] mb-8 text-deep-brown"
                style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 400 }}
              >
                התמונות שלכם.
                <br />
                <span className="font-bold">באלבום </span>
                <span className="relative inline-block min-w-[100px] sm:min-w-[140px]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={wordIdx}
                      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                      className="absolute right-0 font-bold text-deep-brown"
                    >
                      {ROTATING[wordIdx]}.
                    </motion.span>
                  </AnimatePresence>
                  <span className="invisible font-bold">ייחודי.</span>
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg sm:text-xl text-warm-gray leading-relaxed mb-10 max-w-lg"
            >
              שופכים תמונות מהטלפון.
              <br />
              מקבלים אלבום מעוצב בדלת.
              <br />
              <span className="text-deep-brown font-medium">בין לבין — אפס עבודה.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 items-start"
            >
              <motion.button
                onClick={handleCreate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="group relative py-4 px-10 rounded-full text-lg font-semibold text-white overflow-hidden"
                style={{
                  background: '#2D2926',
                  boxShadow: '0 4px 24px rgba(26,23,20,0.2)',
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  נתחיל?
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    ←
                  </motion.span>
                </span>
              </motion.button>

              <motion.button
                onClick={handleExisting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="py-4 px-8 rounded-full text-base font-medium text-deep-brown/70 hover:text-deep-brown transition-colors"
              >
                יש לי כבר אלבום
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-14 flex items-center gap-8"
            >
              {[
                { num: '500+', label: 'אלבומים נוצרו' },
                { num: '< 2 דק׳', label: 'זמן יצירה' },
                { num: '4.9', label: 'דירוג ממוצע' },
              ].map((stat, i) => (
                <div key={i} className={i > 0 ? 'border-r border-muted-border/30 pr-8' : ''}>
                  <p className="text-lg font-bold text-deep-brown tabular-nums" style={{ fontFamily: 'var(--font-family-headline)' }}>
                    {stat.num}
                  </p>
                  <p className="text-xs text-warm-gray">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Image ─────────────────────────────── */}
          <motion.div
            style={{ y: parallaxY }}
            className="order-1 lg:order-2 flex justify-center lg:justify-end relative w-full"
          >
            <motion.div
              style={{ x: imgX, y: imgY }}
              className="relative"
            >
              {/* Soft glow behind */}
              <div
                className="absolute -inset-8 rounded-[2rem] -z-10 opacity-60"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(181,164,138,0.15) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[min(94vw,440px)] aspect-[95/112] sm:max-w-[min(92vw,500px)] lg:max-w-none lg:w-[min(64vw,820px)] lg:aspect-auto lg:h-[min(68vh,820px)] rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 30px 80px rgba(26,23,20,0.12), 0 10px 30px rgba(26,23,20,0.06)',
                }}
              >
                <img
                  src="/hero-nature.png"
                  alt="אלבום תמונות בחיק הטבע"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Floating badge - bottom left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute -bottom-4 -left-6 bg-white rounded-2xl py-3.5 px-5 z-10 flex items-center gap-3"
                style={{ boxShadow: '0 12px 40px rgba(26,23,20,0.08)' }}
              >
                <span className="text-xl">✦</span>
                <div>
                  <p className="text-xs font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                    מוכן בדקות
                  </p>
                  <p className="text-[10px] text-warm-gray">AI עושה הכל</p>
                </div>
              </motion.div>

              {/* Floating badge - top right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute -top-3 -right-5 bg-deep-brown text-white rounded-full py-2 px-4 z-10"
                style={{ boxShadow: '0 8px 24px rgba(26,23,20,0.2)' }}
              >
                <p className="text-[11px] font-bold">משלוח חינם</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
