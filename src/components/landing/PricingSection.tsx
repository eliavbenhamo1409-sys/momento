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
    <section ref={ref} id="מחירים" className="py-28 md:py-40 bg-surface relative">
      <div className="container mx-auto px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p
            className="text-[11px] tracking-[0.4em] uppercase text-warm-gray/50 mb-5"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
          >
            Pricing
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-deep-brown mb-5"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
          >
            בלי אותיות קטנות.
          </h2>
          <p className="text-warm-gray/60 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            הכל כלול. עיצוב, כריכה קשה, משלוח. נקודה.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-muted-border/10 max-w-5xl mx-auto items-stretch">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`relative p-10 md:p-12 flex flex-col cursor-default ${
                plan.recommended ? 'bg-[#1A1714] text-white' : 'bg-white'
              }`}
            >
              {plan.recommended && (
                <span
                  className="absolute -top-px left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, #B5A48A, #8B8573)' }}
                />
              )}

              <div className="mb-8">
                <p
                  className={`text-[10px] tracking-[0.3em] uppercase mb-3 ${
                    plan.recommended ? 'text-white/35' : 'text-warm-gray/40'
                  }`}
                  style={{ fontFamily: 'var(--font-family-headline)' }}
                >
                  {plan.id === 'basic' ? 'Essential' : plan.id === 'premium' ? 'Most Popular' : 'Deluxe'}
                </p>
                <h3
                  className="text-lg font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-family-headline)' }}
                >
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.recommended ? 'text-white/40' : 'text-warm-gray/50'}`}>
                  {plan.id === 'basic' ? 'להתחלה' : plan.id === 'premium' ? 'הבחירה של רוב האנשים' : 'לרגעים שלא חוזרים'}
                </p>
              </div>

              <div className="mb-8">
                <span
                  className="text-4xl md:text-5xl tabular-nums"
                  style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
                >
                  ₪<AnimatedPrice target={plan.price} isInView={isInView} />
                </span>
              </div>

              <ul className="space-y-3.5 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <Icon
                      name="check"
                      size={15}
                      className={`mt-0.5 ${plan.recommended ? 'text-white/25' : 'text-sage/50'}`}
                    />
                    <span className={plan.recommended ? 'text-white/70' : 'text-warm-gray/70'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSelect}
                className={`w-full py-3.5 text-[13px] tracking-[0.15em] uppercase font-medium transition-all duration-500 ${
                  plan.recommended
                    ? 'bg-white text-[#1A1714] hover:bg-white/90'
                    : 'border border-deep-brown/15 text-deep-brown hover:bg-deep-brown hover:text-white'
                }`}
              >
                בחירה
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
