import { Link } from 'react-router'

export default function Footer() {
  return (
    <footer className="py-16" style={{ background: '#1A1714' }}>
      <div className="max-w-7xl mx-auto px-8 md:px-16">
        <div className="flex flex-col md:flex-row-reverse justify-between items-start gap-12 mb-12">
          <div>
            <span
              className="text-2xl font-bold text-white block mb-3"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              Momento
            </span>
            <p className="text-sm text-white/35 max-w-xs leading-relaxed">
              כל תמונה שווה יותר מאלף לייקים.
              <br />
              היא שווה עמוד באלבום.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-4 font-medium">מוצר</p>
              <div className="flex flex-col gap-2.5">
                <a href="#איך זה עובד" className="text-sm text-white/50 hover:text-white transition-colors">איך זה עובד</a>
                <a href="#מחירים" className="text-sm text-white/50 hover:text-white transition-colors">מחירים</a>
                <a href="#שאלות נפוצות" className="text-sm text-white/50 hover:text-white transition-colors">שאלות נפוצות</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-4 font-medium">חוקי</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/terms" className="text-sm text-white/50 hover:text-white transition-colors">תנאי שימוש</Link>
                <Link to="/privacy" className="text-sm text-white/50 hover:text-white transition-colors">פרטיות</Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 mb-4 font-medium">עזרה</p>
              <div className="flex flex-col gap-2.5">
                <a href="mailto:support@momentobook.com" className="text-sm text-white/50 hover:text-white transition-colors">support@momentobook.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/8 mb-6" />
        <p className="text-xs text-white/20">
          © {new Date().getFullYear()} Momento. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  )
}
