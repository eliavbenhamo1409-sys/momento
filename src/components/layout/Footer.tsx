import { Link } from 'react-router'

export default function Footer() {
  return (
    <footer className="py-16 bg-deep-brown text-white/60">
      <div className="max-w-7xl mx-auto px-8 md:px-16">
        <div className="flex flex-col md:flex-row-reverse justify-between items-start gap-12 mb-12">
          <div>
            <span
              className="text-2xl font-bold text-white block mb-3"
              style={{ fontFamily: 'var(--font-family-headline)' }}
            >
              Momento
            </span>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              אנחנו מאמינים שכל תמונה שווה יותר מאלף מילים.
              <br />
              היא שווה עמוד באלבום.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">מוצר</p>
              <div className="flex flex-col gap-2.5">
                <a href="#איך זה עובד" className="text-sm hover:text-white transition-colors">איך זה עובד</a>
                <a href="#מחירים" className="text-sm hover:text-white transition-colors">מחירים</a>
                <a href="#דוגמאות" className="text-sm hover:text-white transition-colors">דוגמאות</a>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">חוקי</p>
              <div className="flex flex-col gap-2.5">
                <Link to="/terms" className="text-sm hover:text-white transition-colors">תנאי שימוש</Link>
                <Link to="/privacy" className="text-sm hover:text-white transition-colors">פרטיות</Link>
                <Link to="/cookies" className="text-sm hover:text-white transition-colors">עוגיות</Link>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">צור קשר</p>
              <div className="flex flex-col gap-2.5">
                <a href="mailto:support@momentobook.com" className="text-sm hover:text-white transition-colors">support@momentobook.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mb-6" />
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Momento. כל הזכויות שמורות. נבנה עם אהבה לתמונות.
        </p>
      </div>
    </footer>
  )
}
