import { motion } from 'motion/react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import Icon from '../shared/Icon'

const items = [
  { icon: 'verified', text: 'אלפי משתמשים מרוצים' },
  { icon: 'auto_awesome', text: 'תהליך פשוט ומהיר' },
  { icon: 'print', text: 'הדפסה באיכות פרימיום' },
  { icon: 'home_pin', text: 'משלוח עד הבית' },
]

export default function TrustStrip() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="py-10 bg-primary text-on-primary"
    >
      <div className="container mx-auto px-6 flex flex-wrap justify-around items-center gap-8 text-center">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-3">
            <Icon name={item.icon} />
            <span className="font-medium text-sm">{item.text}</span>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
