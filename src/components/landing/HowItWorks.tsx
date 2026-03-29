import { motion } from 'motion/react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Icon from '../shared/Icon'

const steps = [
  {
    num: '01',
    icon: 'cloud_upload',
    title: 'העלאת תמונות',
    desc: 'מעלים את התמונות מהטלפון או מהמחשב — אין צורך במיון מוקדם.',
  },
  {
    num: '02',
    icon: 'psychology',
    title: 'ה-AI מעצב',
    desc: 'הטכנולוגיה שלנו מסדרת, עורכת ומעצבת את האלבום המושלם עבורך.',
  },
  {
    num: '03',
    icon: 'menu_book',
    title: 'קבלת האלבום',
    desc: 'מאשרים את העיצוב, והאלבום בדרך אליך בהדפסה איכותית.',
  },
]

export default function HowItWorks() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} id="איך זה עובד" className="py-32 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-family-headline)' }}>
            איך זה עובד?
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-surface-container-lowest p-12 rounded-2xl text-center flex flex-col items-center group hover:bg-surface-container transition-colors"
            >
              <div className="text-6xl font-extralight text-primary/20 mb-6 group-hover:text-primary/40 transition-colors" style={{ fontFamily: 'var(--font-family-headline)' }}>
                {step.num}
              </div>
              <Icon name={step.icon} size={36} className="text-primary mb-6" />
              <h3 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-family-headline)' }}>
                {step.title}
              </h3>
              <p className="text-secondary leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
