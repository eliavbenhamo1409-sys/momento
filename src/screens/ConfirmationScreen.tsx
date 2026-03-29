import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import PageTransition from '../components/shared/PageTransition'
import ProductLayout from '../components/layout/ProductLayout'
import Icon from '../components/shared/Icon'

export default function ConfirmationScreen() {
  const navigate = useNavigate()
  const orderNum = `AL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

  return (
    <PageTransition>
      <ProductLayout showSteps={false}>
        <div className="h-full flex items-center justify-center px-6 -mt-[3%]">
          <div className="max-w-md w-full flex flex-col items-center text-center gap-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275], delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-sage/10 flex items-center justify-center"
            >
              <Icon name="check_circle" filled size={48} className="text-sage" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-semibold"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              ההזמנה התקבלה!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-warm-gray leading-relaxed"
            >
              האלבום שלך בהכנה ובקרוב ייצא אליך.
              <br />
              שלחנו אישור למייל שלך.
            </motion.p>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="px-5 py-2 rounded-full bg-sage/10 text-sage text-sm font-medium"
            >
              מספר הזמנה: #{orderNum}
            </motion.span>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              className="text-sm text-warm-gray"
            >
              זמן משלוח משוער: 7–10 ימי עסקים
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex gap-4 mt-6"
            >
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-outline-variant/40 text-secondary rounded-xl font-medium hover:bg-surface-container transition-colors"
              >
                חזור לעמוד הראשי
              </button>
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                צור אלבום נוסף
              </button>
            </motion.div>
          </div>
        </div>
      </ProductLayout>
    </PageTransition>
  )
}
