import Icon from '../shared/Icon'

const items = [
  { icon: 'verified', text: 'אלפי אלבומים כל חודש' },
  { icon: 'palette', text: 'עיצוב AI ברמה אחרת' },
  { icon: 'print', text: 'הדפסה על נייר 250 גרם' },
  { icon: 'local_shipping', text: 'משלוח חינם עד הבית' },
  { icon: 'lock', text: 'הפרטיות שלכם שמורה' },
  { icon: 'thumb_up', text: 'שביעות רצון מובטחת' },
]

const doubled = [...items, ...items]

export default function TrustStrip() {
  return (
    <section className="py-5 overflow-hidden border-y border-muted-border/10 bg-white/40">
      <div className="marquee-track flex items-center gap-12 whitespace-nowrap w-max">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2">
            <Icon name={item.icon} size={18} className="text-sage/70" />
            <span className="text-sm font-medium text-deep-brown/70 tracking-wide">{item.text}</span>
            <span className="text-muted-border/40 mx-4 text-xs">◆</span>
          </div>
        ))}
      </div>
    </section>
  )
}
