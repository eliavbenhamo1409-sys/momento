import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'
import Icon from '../shared/Icon'

export default function HeroSection() {
  const navigate = useNavigate()
  const { isLoggedIn, openAuthModal } = useUIStore()

  const handleCreate = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('signup', '/upload')
  }

  const handleExisting = () => {
    if (isLoggedIn) navigate('/dashboard')
    else openAuthModal('login', '/dashboard')
  }

  return (
    <section className="relative min-h-screen pt-24 pb-20 flex items-center justify-center overflow-hidden">
      {/* רקע: התמונה כמו שהיא — בלי פילטרים, בלי שכבות הבהרה/הכהה */}
      <div className="absolute inset-0 pointer-events-none">
        <img src="/hero-bg.png" alt="" className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl md:text-7xl font-light leading-[1.1] mb-6 max-w-4xl tracking-tight"
          style={{
            fontFamily: 'var(--font-family-headline)',
            textShadow:
              '0 1px 2px rgba(255,252,250,0.9), 0 2px 20px rgba(255,252,250,0.75), 0 0 1px rgba(255,252,250,0.5)',
          }}
        >
          הופכים רגעים לספרים{' '}
          <br />
          <span className="font-bold">מושלמים</span> עם AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg text-secondary mb-12 max-w-2xl leading-relaxed"
          style={{
            textShadow:
              '0 1px 2px rgba(255,252,250,0.95), 0 2px 16px rgba(255,252,250,0.7)',
          }}
        >
          האלבום שתמיד חלמת עליו, מעוצב באופן אוטומטי ובאיכות פרימיום.
          פשוט להעלות תמונות, והשאר עלינו.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-xl w-full rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 48px rgba(90,80,70,0.1), 0 4px 16px rgba(90,80,70,0.06)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <div className="p-8 md:p-12">
            <div className="flex justify-center gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(234,226,210,0.6) 0%, rgba(234,226,210,0.2) 100%)',
                  boxShadow: '0 2px 8px rgba(90,80,70,0.06)',
                }}
              >
                <Icon name="folder" size={28} className="text-on-secondary-container" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(233,227,201,0.6) 0%, rgba(233,227,201,0.2) 100%)',
                  boxShadow: '0 2px 8px rgba(90,80,70,0.06)',
                }}
              >
                <Icon name="photo_camera" size={28} className="text-on-primary-fixed" />
              </motion.div>
            </div>

            <h3
              className="text-2xl font-semibold mb-8 text-deep-brown"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              העלה את התמונות שבחרת
            </h3>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                className="py-4 px-10 rounded-xl text-lg font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #605c48 0%, #8E8973 100%)',
                  boxShadow: '0 6px 24px rgba(96,92,72,0.25), 0 2px 8px rgba(96,92,72,0.15)',
                }}
              >
                צור אלבום חדש עם AI
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExisting}
                className="py-4 px-10 rounded-xl text-lg font-semibold text-deep-brown transition-all"
                style={{
                  background: 'rgba(234,226,210,0.4)',
                  boxShadow: '0 2px 8px rgba(90,80,70,0.05)',
                }}
              >
                המשך עריכה של אלבום קיים
              </motion.button>
            </div>

            <p className="mt-7 text-xs text-warm-gray/60 tracking-wider">
              עריכה קלה, ללא ניסיון נדרש
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
