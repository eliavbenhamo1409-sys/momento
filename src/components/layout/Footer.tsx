import { Link } from 'react-router'
import BrandLogo from '../shared/BrandLogo'

export default function Footer() {
  return (
    <footer className="py-20 md:py-24" style={{ background: '#1A1714' }}>
      <div className="max-w-6xl mx-auto px-8 md:px-16">
        {/* Top — English tagline + logo */}
        <div className="flex flex-col md:flex-row-reverse justify-between items-start gap-14 mb-16">
          <div>
            <div className="mb-5">
              <BrandLogo tone="light" heightClass="h-10 md:h-11" />
            </div>
            <p
              className="text-[12px] tracking-[0.35em] uppercase text-white/20 mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              The Art of Remembering
            </p>
            <p className="text-sm text-white/30 max-w-xs leading-relaxed">
              כל תמונה שווה יותר מאלף לייקים.
              <br />
              היא עמוד באלבום.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mb-5 font-medium">מוצר</p>
              <div className="flex flex-col gap-3">
                <a href="#איך זה עובד" className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300">איך זה עובד</a>
                <a href="#מחירים" className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300">מחירים</a>
                <a href="#שאלות נפוצות" className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300">שאלות נפוצות</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mb-5 font-medium">חוקי</p>
              <div className="flex flex-col gap-3">
                <Link to="/terms" className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300">תנאי שימוש</Link>
                <Link to="/privacy" className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300">פרטיות</Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/20 mb-5 font-medium">עזרה</p>
              <div className="flex flex-col gap-3">
                <a href="mailto:support@momentobook.com" className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300">support@momentobook.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.06] mb-6" />
        <p className="text-[11px] text-white/15 tracking-wide">
          © {new Date().getFullYear()} Momento. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  )
}
