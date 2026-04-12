import { useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
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

  const durationSec = stripW > 0 ? Math.max(14, stripW / 52) : 20

  if (reduceMotion) {
    return (
      <section className="py-4 overflow-hidden border-y border-muted-border/10 bg-white/40">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 py-1 px-4">
          <ItemRow />
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 overflow-hidden border-y border-muted-border/10 bg-white/40">
      <div className="relative overflow-hidden" dir="ltr">
        <div
          className={`trust-marquee-track flex w-max will-change-transform ${stripW > 0 ? 'trust-marquee-running' : ''}`}
          style={
            {
              '--trust-strip-px': `${stripW}px`,
              '--trust-marquee-sec': `${durationSec}s`,
            } as React.CSSProperties
          }
        >
          <div ref={stripRef} className="flex shrink-0 items-center">
            <ItemRow />
          </div>
          <div className="flex shrink-0 items-center" aria-hidden>
            <ItemRow keyPrefix="b-" />
          </div>
        </div>
      </div>
    </section>
  )
}
