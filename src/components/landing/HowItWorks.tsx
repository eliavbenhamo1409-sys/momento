import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import Icon from '../shared/Icon'

const steps = [
  {
    num: '01',
    icon: 'cloud_upload',
    title: 'מעלים את כל התמונות',
    desc: 'בלי למיין. בלי לדאוג. פשוט מעלים את כל התמונות מהגלריה.',
  },
  {
    num: '02',
    icon: 'auto_awesome',
    title: 'הקסם קורה',
    desc: 'ה-AI בוחר את התמונות הכי טובות, מסדר אותן בסיפור, ומעצב כל עמוד.',
  },
  {
    num: '03',
    icon: 'menu_book',
    title: 'מגיע הביתה',
    desc: 'אלבום מושלם בכריכה קשה, ישר לדלת. בלי לצאת מהבית.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="איך זה עובד" className="py-28 md:py-40 bg-surface relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-16 max-w-6xl" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-20 md:mb-28"
        >
          <p
            className="text-[11px] tracking-[0.4em] uppercase text-warm-gray/50 mb-5"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
          >
            How It Works
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-deep-brown leading-tight"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
          >
            שלושה צעדים.
            <br />
            <span style={{ fontWeight: 600 }}>אפס התעסקות.</span>
          </h2>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
        >
          {steps.map((step) => (
            <motion.div
              key={step.num}
              variants={cardVariants}
              className="group p-10 md:p-12 cursor-default relative"
            >
              <p
                className="text-[11px] tracking-[0.3em] text-warm-gray/50 mb-8 uppercase"
                style={{ fontFamily: 'var(--font-family-headline)' }}
              >
                Step {step.num}
              </p>

              <div className="w-11 h-11 rounded-full border border-deep-brown/15 flex items-center justify-center mb-7 group-hover:border-deep-brown/30 transition-colors duration-500">
                <Icon name={step.icon} size={20} className="text-deep-brown/70 group-hover:text-deep-brown transition-colors duration-500" />
              </div>

              <h3
                className="text-xl md:text-2xl text-deep-brown mb-4"
                style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 600 }}
              >
                {step.title}
              </h3>
              <p className="text-warm-gray leading-relaxed text-[15px]">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
