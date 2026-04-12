import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'

const WORDS = ['מושלם', 'אישי', 'ייחודי', 'שלכם']

export default function HeroSection() {
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const sectionRef = useRef<HTMLElement>(null)
  const [wordIdx, setWordIdx] = useState(0)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -40])

  useEffect(() => {
    const interval = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 2800)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20
    mouseX.set(x)
    mouseY.set(y)
  }

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
      onMouseMove={handleMouseMove}
      className="relative min-h-[94vh] pt-28 pb-24 flex items-center overflow-hidden hero-gradient"
    >
      <div className="container mx-auto px-6 md:px-16 relative z-10">
        <div className="flex flex-col md:flex-row-reverse items-center gap-16 lg:gap-24">

          {/* ── Text side ────────────────────────── */}
          <motion.div style={{ y: textY }} className="flex-1 max-w-2xl">
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sage font-medium tracking-widest text-sm mb-6 uppercase"
            >
              אלבומים שנולדו מתמונות אמיתיות
            </motion.p>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[3.2rem] md:text-[4.2rem] lg:text-[5rem] leading-[1.05] mb-8 text-deep-brown"
              style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 400 }}
            >
              הבלגן שבגלריה?
              <br />
              <span className="font-bold">הפך לאלבום</span>{' '}
              <span className="relative inline-block min-w-[140px]">
                {WORDS.map((w, i) => (
                  <motion.span
                    key={w}
                    initial={false}
                    animate={{
                      opacity: i === wordIdx ? 1 : 0,
                      y: i === wordIdx ? 0 : 16,
                      rotateX: i === wordIdx ? 0 : -40,
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-0 font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #B8725A 20%, #D4A48A 80%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {w}
                  </motion.span>
                ))}
                <span className="invisible font-bold">ייחודי</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="text-lg md:text-xl text-warm-gray leading-relaxed mb-10 max-w-lg"
              style={{ fontFamily: 'var(--font-family-body)' }}
            >
              תעלו את התמונות — אנחנו נדאג לסדר, לעצב ולהדפיס.
              <br />
              <span className="text-deep-brown font-medium">ובלי שתרגישו שעבדתם.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                onClick={handleCreate}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group relative py-4 px-10 rounded-2xl text-lg font-semibold text-white overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #B8725A 0%, #C4876D 100%)',
                  boxShadow: '0 8px 32px rgba(184,114,90,0.3)',
                }}
              >
                <span className="relative z-10">בואו נתחיל</span>
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, #A06048 0%, #B8725A 100%)',
                  }}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.button
                onClick={handleExisting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="py-4 px-8 rounded-2xl text-lg font-medium text-deep-brown hover-underline"
              >
                יש לי כבר אלבום →
              </motion.button>
            </motion.div>

            {/* ── Social proof nugget ─────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-12 flex items-center gap-4"
            >
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-soft-cream bg-surface-container-high"
                    style={{
                      backgroundImage: `url(https://i.pravatar.cc/64?img=${20 + i})`,
                      backgroundSize: 'cover',
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-warm-gray">
                <span className="font-bold text-deep-brown">2,400+</span> אלבומים נוצרו החודש
              </p>
            </motion.div>
          </motion.div>

          {/* ── Image side with parallax ──────────── */}
          <motion.div
            style={{ y: imgY }}
            className="flex-1 flex items-center justify-center relative"
          >
            <motion.div
              style={{ x: springX, y: springY }}
              className="relative w-[340px] h-[420px] md:w-[400px] md:h-[500px]"
            >
              {/* Shadow card behind */}
              <div
                className="absolute -inset-3 rounded-3xl -z-10"
                style={{
                  background: 'linear-gradient(160deg, rgba(196,135,109,0.12) 0%, rgba(242,224,214,0.2) 100%)',
                  filter: 'blur(40px)',
                }}
              />

              {/* Main photo */}
              <motion.div
                initial={{ opacity: 0, y: 40, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 2 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 32px 80px rgba(53,47,43,0.14), 0 12px 32px rgba(53,47,43,0.08)',
                }}
              >
                <img src="/hero-bg.png" alt="" className="w-full h-full object-cover" />
              </motion.div>

              {/* Second photo peeking */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -right-10 top-8 w-[160px] h-[200px] rounded-xl overflow-hidden"
                style={{
                  boxShadow: '0 20px 50px rgba(53,47,43,0.12)',
                  transform: 'rotate(-4deg)',
                }}
              >
                <img
                  src="https://picsum.photos/seed/momento-hero-2/320/400"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.9,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                className="absolute -bottom-5 -left-5 bg-white rounded-2xl py-3 px-5 flex items-center gap-3 z-10"
                style={{
                  boxShadow: '0 16px 48px rgba(53,47,43,0.1)',
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  className="text-2xl"
                >
                  ✨
                </motion.span>
                <div>
                  <p className="text-xs font-bold text-deep-brown" style={{ fontFamily: 'var(--font-family-headline)' }}>
                    נראה מדהים
                  </p>
                  <p className="text-[10px] text-warm-gray">עוצב אוטומטית ב-2 דקות</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
