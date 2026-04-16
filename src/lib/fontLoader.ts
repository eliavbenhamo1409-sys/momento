const DECORATIVE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Assistant:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Secular+One&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=Noto+Serif+Hebrew:wght@300;400;500;600;700&family=Pacifico&family=Satisfy&family=Sacramento&family=Alex+Brush&family=Quicksand:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Amatic+SC:wght@400;700&family=Karantina:wght@300;400;700&family=Varela+Round&family=Suez+One&display=swap'

let decorativeFontsPromise: Promise<void> | null = null

export function loadDecorativeFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (decorativeFontsPromise) return decorativeFontsPromise

  decorativeFontsPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[rel="stylesheet"][href="${DECORATIVE_FONTS_URL}"]`,
    )
    if (existing) {
      void document.fonts.ready.then(() => resolve())
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = DECORATIVE_FONTS_URL
    link.onload = () => resolve()
    link.onerror = () => resolve()
    document.head.appendChild(link)
  }).then(() => document.fonts.ready.then(() => undefined))

  return decorativeFontsPromise
}

