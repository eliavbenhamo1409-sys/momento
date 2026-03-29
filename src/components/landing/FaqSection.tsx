import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Icon from '../shared/Icon'

const faqs = [
  {
    q: 'כמה זמן לוקח לעצב אלבום?',
    a: 'תהליך העיצוב האוטומטי שלנו לוקח פחות מ-2 דקות. לאחר מכן, תוכלו לבצע שינויים קלים במידת הצורך ולשלוח להדפסה באופן מיידי.',
  },
  {
    q: 'מהי איכות ההדפסה?',
    a: 'אנו משתמשים בנייר פרימיום עבה (200-250 גרם) ובטכנולוגיית הדפסה מתקדמת המבטיחה צבעים חיים ועמידות לאורך שנים רבות.',
  },
  {
    q: 'האם ניתן לערוך את האלבום אחרי שה-AI סיים?',
    a: 'בוודאי. המערכת שלנו נותנת לכם שליטה מלאה — תוכלו להחליף תמונות, לשנות מיקומים, להוסיף טקסט ולבחור כריכות שונות.',
  },
  {
    q: 'איך עובד המשלוח?',
    a: 'האלבום מגיע עם שליח עד הבית תוך 7-10 ימי עסקים מרגע האישור הסופי שלכם.',
  },
]

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} id="שאלות נפוצות" className="py-32 bg-surface">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          className="text-4xl font-light text-center mb-16"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          שאלות נפוצות
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-low rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-right"
                >
                  <span className="text-lg font-medium" style={{ fontFamily: 'var(--font-family-headline)' }}>
                    {faq.q}
                  </span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <Icon name="expand_more" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-secondary leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
