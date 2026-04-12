import Icon from '../shared/Icon'

const items = [
  { icon: 'verified', text: '500+ אלבומים נוצרו' },
  { icon: 'palette', text: 'עיצוב AI ברמה אחרת' },
  { icon: 'print', text: 'הדפסה על נייר 250 גרם' },
  { icon: 'local_shipping', text: 'משלוח חינם עד הבית' },
  { icon: 'lock', text: 'הפרטיות שלכם שמורה' },
  { icon: 'thumb_up', text: 'שביעות רצון מובטחת' },
]

function ItemSet() {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 px-6 shrink-0">
          <Icon name={item.icon} size={18} className="text-sage/70" />
          <span className="text-sm font-medium text-deep-brown/70 tracking-wide whitespace-nowrap">
            {item.text}
          </span>
          <span className="text-muted-border/40 mr-6 text-xs">◆</span>
        </div>
      ))}
    </>
  )
}

export default function TrustStrip() {
  return (
    <section className="py-5 overflow-hidden border-y border-muted-border/10 bg-white/40">
      <div className="marquee-track flex items-center w-max">
        <ItemSet />
        <ItemSet />
        <ItemSet />
        <ItemSet />
      </div>
    </section>
  )
}
