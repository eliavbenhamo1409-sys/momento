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
    a: 'ברור. להזיז תמונות, להוסיף טקסט, לשנות כריכה — יש עורך drag & drop שמרגיש כמו משחק. לא כמו עבודה.',
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
    <section ref={ref} id="שאלות נפוצות" className="py-28 md:py-40 bg-surface">
      <div className="container mx-auto px-6 md:px-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 md:mb-20"
        >
          <p
            className="text-[11px] tracking-[0.4em] uppercase text-warm-gray/50 mb-5"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
          >
            Questions
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl text-deep-brown leading-tight"
            style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 300 }}
          >
            עדיין מהססים?
            <br />
            <span style={{ fontWeight: 600 }}>בואו נסגור את זה.</span>
          </h2>
        </motion.div>

        <div className="divide-y divide-muted-border/12">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex justify-between items-center py-7 text-right group"
                >
                  <span
                    className="text-[15px] md:text-base font-medium text-deep-brown group-hover:text-deep-brown/70 transition-colors duration-300"
                    style={{ fontFamily: 'var(--font-family-headline)', fontWeight: 500 }}
                  >
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="shrink-0 mr-6"
                  >
                    <Icon
                      name="add"
                      size={20}
                      className={`transition-colors duration-300 ${
                        isOpen ? 'text-deep-brown/60' : 'text-warm-gray/25'
                      }`}
                    />
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
                      <div className="pb-7 text-warm-gray/60 leading-relaxed text-[15px] max-w-xl">
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
