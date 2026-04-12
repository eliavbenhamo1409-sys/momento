import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { useUIStore } from '../../store/uiStore'
import { PRICING } from '../../lib/constants'
import Icon from '../shared/Icon'

export default function PricingSection() {
  const { ref, isVisible } = useScrollReveal()
  const navigate = useNavigate()
  const isLoggedIn = useUIStore((s) => s.isLoggedIn)
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const handleSelect = () => {
    if (isLoggedIn) navigate('/upload')
    else openAuthModal('login', '/upload')
  }

  return (
    <section ref={ref} id="מחירים" className="py-32 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-family-headline)' }}>
            מחירים
          </h2>
          <p className="text-secondary">בחרו את החבילה שמתאימה לכם</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.recommended
                  ? 'ring-2 ring-sage editorial-shadow scale-105'
                  : 'bg-surface-container-lowest editorial-shadow'
              }`}
              style={plan.recommended ? {
                background: 'linear-gradient(160deg, #B8725A 0%, #C4876D 60%, #D09880 100%)',
                color: 'white',
              } : undefined}
            >
              {plan.recommended && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #A06048 0%, #B8725A 100%)' }}
                >
                  מומלץ
                </span>
              )}

              <h3
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                {plan.name}
              </h3>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-family-headline)' }}>
                  ₪{plan.price}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Icon
                      name="check"
                      size={18}
                      className={plan.recommended ? 'text-white/90' : 'text-sage'}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSelect}
                className={`w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                  plan.recommended
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'text-white hover:opacity-90'
                }`}
                style={!plan.recommended ? {
                  background: 'linear-gradient(135deg, #B8725A 0%, #C4876D 100%)',
                } : undefined}
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
