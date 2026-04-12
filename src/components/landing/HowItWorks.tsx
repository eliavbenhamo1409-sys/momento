import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import Icon from '../shared/Icon'

const steps = [
  {
    num: '01',
    icon: 'cloud_upload',
    title: 'שופכים הכל',
    desc: 'בלי למיין. בלי לדאוג. פשוט שופכים את כל מה שיש בגלריה.',
    accent: '#2D2926',
  },
  {
    num: '02',
    icon: 'auto_awesome',
    title: 'הקסם קורה',
    desc: 'ה-AI בוחר את התמונות הכי טובות, מסדר אותן בסיפור, ומעצב כל עמוד.',
    accent: '#57534E',
  },
  {
    num: '03',
    icon: 'menu_book',
    title: 'מגיע הביתה',
    desc: 'אלבום מושלם בכריכה קשה, ישר לדלת. בלי לצאת מהבית.',
    accent: '#8B8573',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="איך זה עובד" className="py-28 md:py-36 bg-surface relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-16" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <p className="text-sage font-medium tracking-[0.2em] text-xs mb-4 uppercase">
            איך זה עובד
          </p>
          <h2
            className="text-4xl md:text-5xl text-deep-brown leading-tight"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            שלושה צעדים.
            <br />
            <span className="font-bold">אפס התעסקות.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {steps.map((step) => (
            <motion.div
              key={step.num}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="tilt-card group relative bg-white rounded-3xl p-10 cursor-default"
              style={{
                boxShadow: '0 2px 20px rgba(26,23,20,0.03)',
                border: '1px solid rgba(0,0,0,0.03)',
              }}
            >
              <span
                className="block text-[5rem] font-bold leading-none mb-6 select-none"
                style={{
                  fontFamily: 'var(--font-family-headline)',
                  color: step.accent,
                  opacity: 0.06,
                }}
              >
                {step.num}
              </span>

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${step.accent}0A` }}
              >
                <Icon name={step.icon} size={24} style={{ color: step.accent }} />
              </div>

              <h3
                className="text-xl font-bold text-deep-brown mb-3"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                {step.title}
              </h3>
              <p className="text-warm-gray leading-relaxed text-[15px]">{step.desc}</p>

              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, ${step.accent}, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
