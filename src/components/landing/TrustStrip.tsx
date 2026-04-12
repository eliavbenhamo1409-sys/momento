import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Icon from '../shared/Icon'

const items = [
  { icon: 'verified', text: '500+ אלבומים נוצרו' },
  { icon: 'palette', text: 'עיצוב AI ברמה אחרת' },
  { icon: 'print', text: 'הדפסה על נייר 250 גרם' },
  { icon: 'local_shipping', text: 'משלוח חינם עד הבית' },
  { icon: 'lock', text: 'הפרטיות שלכם שמורה' },
  { icon: 'thumb_up', text: 'שביעות רצון מובטחת' },
  { icon: 'schedule', text: 'מוכן תוך 2 דקות' },
  { icon: 'star', text: 'דירוג 4.9 מלקוחות' },
]

function ItemRow({ keyPrefix = '' }: { keyPrefix?: string }) {
  return (
    <>
      {items.map((item, i) => (
        <div key={`${keyPrefix}${i}`} className="flex items-center gap-2 shrink-0 px-10">
          <Icon name={item.icon} size={16} className="text-sage/60" />
          <span className="text-sm font-medium text-deep-brown/60 tracking-wide whitespace-nowrap">
            {item.text}
          </span>
        </div>
      ))}
    </>
  )
}

export default function TrustStrip() {
  const stripRef = useRef<HTMLDivElement>(null)
  const [stripW, setStripW] = useState(0)
  const reduceMotion = useReducedMotion()

  useLayoutEffect(() => {
    const el = stripRef.current
    if (!el) return
    const measure = () => setStripW(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const duration = stripW > 0 ? Math.max(18, stripW / 45) : 0

  return (
    <section className="py-4 overflow-hidden border-y border-muted-border/10 bg-white/40">
      {/* dir=ltr: מדידת רוחב ו-transform עקביים, בלי היפוך flex של RTL ששובר לולאה */}
      <div className="relative" dir="ltr">
        {stripW > 0 && !reduceMotion ? (
          <motion.div
            className="flex w-max will-change-transform"
            initial={false}
            animate={{ x: [0, -stripW] }}
            transition={{
              duration,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 0,
            }}
          >
            <div ref={stripRef} className="flex shrink-0 items-center">
              <ItemRow />
            </div>
            <div className="flex shrink-0 items-center" aria-hidden>
              <ItemRow keyPrefix="b-" />
            </div>
          </motion.div>
        ) : (
          <div ref={stripRef} className="flex w-max shrink-0 items-center justify-center gap-4 flex-wrap py-1">
            <ItemRow />
          </div>
        )}
      </div>
    </section>
  )
}
