import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

const examples = [
  {
    title: 'החתונה של דנה ואיתי',
    style: 'קלאסי רומנטי',
    img: 'https://picsum.photos/seed/wedding-ex/600/750',
    rotate: '-2deg',
  },
  {
    title: 'השנה הראשונה של עידו',
    style: 'חמים ומשפחתי',
    img: 'https://picsum.photos/seed/family-ex/600/750',
    rotate: '1deg',
  },
  {
    title: 'חודש בדרום אמריקה',
    style: 'אדיטוריאלי',
    img: 'https://picsum.photos/seed/travel-ex/600/750',
    rotate: '-1.5deg',
  },
]

export default function ExampleAlbums() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section ref={ref} id="דוגמאות" className="py-28 md:py-36 bg-surface-container-low overflow-hidden">
      <div className="container mx-auto px-6 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16 max-w-xl"
        >
          <p className="text-sage font-medium tracking-widest text-sm mb-4 uppercase">
            השראה
          </p>
          <h2
            className="text-4xl md:text-5xl text-deep-brown leading-tight mb-4"
            style={{ fontFamily: 'var(--font-family-headline)' }}
          >
            אלבומים שנוצרו
            <br />
            <span className="font-bold">על ידי אנשים אמיתיים.</span>
          </h2>
          <p className="text-warm-gray text-lg leading-relaxed">
            לא מוקאפים. לא פוטושופ. אלבומים אמיתיים שהלקוחות שלנו יצרו תוך דקות.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.title}
              initial={{ opacity: 0, y: 50, rotate: 0 }}
              animate={isInView ? { opacity: 1, y: 0, rotate: parseFloat(ex.rotate) } : {}}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -12, rotate: 0, scale: 1.02, transition: { duration: 0.35 } }}
              className="tilt-card group cursor-pointer bg-white rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 8px 40px rgba(53,47,43,0.07)',
              }}
            >
              <div className="h-80 overflow-hidden relative">
                <img
                  src={ex.img}
                  alt={ex.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div
                  className="absolute bottom-4 right-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <span
                    className="inline-block px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-semibold text-deep-brown"
                    style={{ fontFamily: 'var(--font-family-headline)' }}
                  >
                    צפה באלבום
                  </span>
                </motion.div>
              </div>
              <div className="p-6">
                <h4
                  className="text-lg font-bold mb-1 text-deep-brown"
                  style={{ fontFamily: 'var(--font-family-headline)' }}
                >
                  {ex.title}
                </h4>
                <p className="text-sm text-warm-gray">
                  סגנון {ex.style}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
