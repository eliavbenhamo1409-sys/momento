import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'
import Icon from '../shared/Icon'

const faqs = [
  {
    q: 'רגע, ה-AI באמת מעצב את כל האלבום לבד?',
    a: 'כן. הוא מנתח כל תמונה — פנים, צבעים, קומפוזיציה — ומרכיב עמודים שנראים כאילו מעצב גרפי ישב עליהם שעות. אתם רק מאשרים. ויכולים לשנות כל דבר אם בא לכם.',
  },
  {
    q: 'כמה זמן עד שזה מגיע?',
    a: 'העיצוב — פחות מ-2 דקות. ההדפסה — 7-10 ימי עסקים. כן, הייתם רוצים יותר מהר. גם אנחנו. אבל הדפסה איכותית באמת לוקחת זמן.',
  },
  {
    q: 'מה אם התמונות שלי לא באיכות מספיק טובה?',
    a: 'נתריע מראש. תמונות מטלפון של 3 השנים האחרונות — עובדות מצוין. אם משהו מטושטש מדי, המערכת תגיד לכם ותציע חלופות.',
  },
  {
    q: 'אפשר לערוך אחרי שה-AI סיים?',
    a: 'ברור. להזיז תמונות, להחליף, להוסיף טקסט, לשנות כריכה — יש עורך drag & drop שמרגיש כמו משחק. לא כמו עבודה.',
  },
  {
    q: 'למה לא לעשות את זה לבד ב-Canva?',
    a: 'אפשר. אם יש לכם 4-6 שעות פנויות ועין לעיצוב. אנחנו לוקחים את ה-4-6 שעות האלה ומקצרים ל-2 דקות. וזה יוצא יותר טוב.',
  },
]

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} id="שאלות נפוצות" className="py-28 md:py-36 bg-surface">
      <div className="container mx-auto px-6 md:px-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="text-sage font-medium tracking-[0.2em] text-xs mb-4 uppercase">שאלות</p>
          <h2
            className="text-4xl md:text-5xl text-deep-brown leading-tight"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            עדיין מהססים?
            <br />
            <span className="font-bold">בואו נסגור את זה.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: isOpen ? 'white' : 'rgba(255,255,255,0.5)',
                  boxShadow: isOpen ? '0 8px 32px rgba(26,23,20,0.05)' : 'none',
                  border: '1px solid rgba(0,0,0,0.03)',
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-right group"
                >
                  <span
                    className="text-base font-semibold text-deep-brown group-hover:text-sage transition-colors"
                    style={{ fontFamily: 'var(--font-family-headline)' }}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="shrink-0 mr-4"
                  >
                    <Icon name="add" size={22} className={isOpen ? 'text-deep-brown' : 'text-warm-gray/40'} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.25, delay: 0.05 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-warm-gray leading-relaxed text-[15px]">
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
