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

function Strip() {
  return (
    <div className="marquee-half flex items-center shrink-0" aria-hidden="true">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 shrink-0 mx-8">
          <Icon name={item.icon} size={16} className="text-sage/60" />
          <span className="text-sm font-medium text-deep-brown/60 tracking-wide whitespace-nowrap">
            {item.text}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TrustStrip() {
  return (
    <section className="py-4 overflow-hidden border-y border-muted-border/10 bg-white/40">
      <div className="marquee-wrapper flex">
        <Strip />
        <Strip />
      </div>
    </section>
  )
}
