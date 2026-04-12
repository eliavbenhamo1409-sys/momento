import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'motion/react'
import { useNavigate } from 'react-router'
import { useUIStore } from '../../store/uiStore'
import { PRICING } from '../../lib/constants'
import Icon from '../shared/Icon'

function AnimatedPrice({ target, isInView: visible }: { target: number; isInView: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!visible) return
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, visible])
  return <>{value}</>
}

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const handleSelect = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('login', '/upload')
  }

  return (
    <section ref={ref} id="מחירים" className="py-28 md:py-36 bg-surface relative">
      <div className="container mx-auto px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sage font-medium tracking-[0.2em] text-xs mb-4 uppercase">תמחור</p>
          <h2
            className="text-4xl md:text-5xl text-deep-brown mb-4"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            בלי אותיות קטנות.
          </h2>
          <p className="text-warm-gray text-lg max-w-md mx-auto">
            הכל כלול. עיצוב, כריכה קשה, משלוח. נקודה.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`tilt-card relative rounded-3xl p-8 flex flex-col cursor-default ${
                plan.recommended ? 'md:scale-[1.04]' : ''
              }`}
              style={{
                background: plan.recommended ? '#1A1714' : 'white',
                color: plan.recommended ? 'white' : undefined,
                boxShadow: plan.recommended
                  ? '0 20px 60px rgba(26,23,20,0.2)'
                  : '0 2px 20px rgba(26,23,20,0.03)',
                border: plan.recommended ? 'none' : '1px solid rgba(0,0,0,0.03)',
              }}
            >
              {plan.recommended && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-5 py-1.5 rounded-full bg-white text-deep-brown"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                >
                  הכי פופולרי
                </span>
              )}

              <h3
                className="text-lg font-bold mb-1"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.recommended ? 'text-white/50' : 'text-warm-gray'}`}>
                {plan.id === 'basic' ? 'להתחלה' : plan.id === 'premium' ? 'הבחירה של רוב האנשים' : 'לרגעים שלא חוזרים'}
              </p>

              <div className="mb-8">
                <span className="text-5xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-family-headline)' }}>
                  ₪<AnimatedPrice target={plan.price} isInView={isInView} />
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Icon
                      name="check"
                      size={16}
                      className={plan.recommended ? 'text-white/40' : 'text-sage'}
                    />
                    <span className={plan.recommended ? 'text-white/80' : ''}>{f}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                onClick={handleSelect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                  plan.recommended ? 'text-deep-brown bg-white' : 'text-white'
                }`}
                style={{
                  background: plan.recommended ? 'white' : '#2D2926',
                  boxShadow: plan.recommended
                    ? '0 4px 16px rgba(0,0,0,0.1)'
                    : '0 4px 16px rgba(26,23,20,0.15)',
                }}
              >
                בחירה
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
