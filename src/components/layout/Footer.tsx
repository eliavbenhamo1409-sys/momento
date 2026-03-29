export default function Footer() {
  return (
    <footer className="w-full py-10 bg-deep-brown text-sage">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse justify-between items-center px-12 gap-6">
        <span
          className="text-xl font-bold text-soft-cream"
          style={{ fontFamily: 'var(--font-family-headline)' }}
        >
          Momento
        </span>
        <div className="flex gap-8 text-sm">
          <a href="#" className="hover:text-soft-cream transition-colors">תנאי שימוש</a>
          <a href="#" className="hover:text-soft-cream transition-colors">מדיניות פרטיות</a>
          <a href="#" className="hover:text-soft-cream transition-colors">צור קשר</a>
        </div>
        <p className="text-warm-gray text-xs">© {new Date().getFullYear()} Momento. כל הזכויות שמורות.</p>
      </div>
    </footer>
  )
}
