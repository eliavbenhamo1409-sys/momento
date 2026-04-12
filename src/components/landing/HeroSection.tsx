import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

export default function HeroSection() {
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const handleCreate = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('signup', '/upload')
  }

  const handleExisting = () => {
    if (isLoggedIn) navigate('/dashboard')
    else openAuthModal('login', '/dashboard')
  }

  return (
    <section className="relative min-h-[92vh] pt-28 pb-20 flex items-center overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 65% 40%, rgba(196,135,109,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(242,224,214,0.15) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row-reverse items-center gap-16 md:gap-20">
          {/* Right side (RTL): Text content */}
          <div className="flex-1 text-center md:text-right max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.06] mb-8"
            >
              <Icon name="auto_awesome" size={16} className="text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">מונע בינה מלאכותית</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.08] mb-7 tracking-tight text-deep-brown"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              הופכים רגעים
              <br />
              לספרים <span className="font-bold">מושלמים</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg text-warm-gray mb-10 max-w-md leading-relaxed md:mr-0 mx-auto"
            >
              העלו תמונות, והבינה המלאכותית שלנו תעצב אלבום פרימיום מושלם —
              בהדפסה יוקרתית עד הבית.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 md:justify-start justify-center"
            >
              <button
                onClick={handleCreate}
                className="btn-press py-4 px-10 rounded-2xl text-lg font-semibold text-white transition-all hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #B8725A 0%, #C4876D 100%)',
                  boxShadow: '0 8px 32px rgba(184,114,90,0.3), 0 2px 8px rgba(184,114,90,0.15)',
                }}
              >
                צור אלבום חדש
                <Icon name="arrow_back" size={20} className="inline-block mr-2 align-middle" />
              </button>
              <button
                onClick={handleExisting}
                className="btn-press py-4 px-8 rounded-2xl text-lg font-medium text-deep-brown bg-white/70 hover:bg-white transition-all"
                style={{
                  boxShadow: '0 2px 12px rgba(90,80,70,0.06)',
                  border: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                האלבומים שלי
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-6 mt-10 md:justify-start justify-center text-warm-gray"
            >
              <div className="flex items-center gap-2">
                <Icon name="schedule" size={16} className="text-sage" />
                <span className="text-xs font-medium">2 דקות ומוכן</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="local_shipping" size={16} className="text-sage" />
                <span className="text-xs font-medium">משלוח חינם</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="verified" size={16} className="text-sage" />
                <span className="text-xs font-medium">הדפסה פרימיום</span>
              </div>
            </motion.div>
          </div>

          {/* Left side: Floating album composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 flex items-center justify-center relative"
          >
            <div className="relative w-[380px] h-[440px] md:w-[420px] md:h-[480px]">
              {/* Main album mockup */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="absolute inset-0 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 24px 64px rgba(53,47,43,0.12), 0 8px 24px rgba(53,47,43,0.08)',
                }}
              >
                <img
                  src="/hero-bg.png"
                  alt="דוגמת אלבום"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, transparent 50%, rgba(53,47,43,0.08) 100%)',
                  }}
                />
              </motion.div>

              {/* Floating accent card 1 */}
              <motion.div
                initial={{ opacity: 0, x: 40, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -bottom-6 -left-8 bg-white rounded-2xl p-4 flex items-center gap-3 z-10"
                style={{
                  boxShadow: '0 12px 40px rgba(53,47,43,0.1), 0 4px 12px rgba(53,47,43,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(196,135,109,0.15) 0%, rgba(196,135,109,0.05) 100%)' }}
                >
                  <Icon name="auto_awesome" filled size={20} className="text-sage" />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep-brown">עוצב ב-AI</p>
                  <p className="text-[10px] text-warm-gray">תוך 2 דקות</p>
                </div>
              </motion.div>

              {/* Floating accent card 2 */}
              <motion.div
                initial={{ opacity: 0, x: -30, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -top-4 -right-6 bg-white rounded-2xl p-4 flex items-center gap-3 z-10"
                style={{
                  boxShadow: '0 12px 40px rgba(53,47,43,0.1), 0 4px 12px rgba(53,47,43,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(196,135,109,0.15) 0%, rgba(196,135,109,0.05) 100%)' }}
                >
                  <Icon name="print" filled size={20} className="text-sage" />
                </div>
                <div>
                  <p className="text-xs font-bold text-deep-brown">הדפסה פרימיום</p>
                  <p className="text-[10px] text-warm-gray">כריכה קשה</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
