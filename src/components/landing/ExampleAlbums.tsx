import { motion } from 'motion/react'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const examples = [
  {
    title: 'החתונה שלנו',
    style: 'נקי וקלאסי',
    img: 'https://picsum.photos/seed/wedding-ex/600/400',
  },
  {
    title: 'זכרונות משפחתיים',
    style: 'חם ואורגני',
    img: 'https://picsum.photos/seed/family-ex/600/400',
  },
  {
    title: 'מסעות בעולם',
    style: 'אדיטוריאלי מודרני',
    img: 'https://picsum.photos/seed/travel-ex/600/400',
  },
]

export default function ExampleAlbums() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} id="דוגמאות" className="py-32 bg-surface-container-low">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="max-w-xl">
            <h2 className="text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-family-headline)' }}>
              השראה לעיצובים
            </h2>
            <p className="text-secondary italic">
              גלו איך הלקוחות שלנו מנציחים את הרגעים היפים שלהם
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-surface-container-lowest rounded-2xl overflow-hidden editorial-shadow group cursor-pointer"
            >
              <div className="h-72 overflow-hidden">
                <img
                  src={ex.img}
                  alt={ex.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <h4 className="text-xl font-semibold mb-1" style={{ fontFamily: 'var(--font-family-headline)' }}>
                  {ex.title}
                </h4>
                <p className="text-sm text-outline mb-4">סגנון: {ex.style}</p>
                <button className="w-full py-3 border border-outline-variant/30 rounded-xl text-sm font-medium hover:bg-surface-container transition-colors">
                  צפייה בדוגמה
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
