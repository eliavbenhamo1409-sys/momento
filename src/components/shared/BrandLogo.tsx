interface BrandLogoProps {
  /** `light` = טקסט בהיר על רקע כהה. `dark` = חום עמוק על רקע בהיר. */
  tone?: 'dark' | 'light'
  className?: string
  /**
   * קנה מידה — אותה מערכת גדלים כמו תמונת הלוגו הקודמת, או `landing` כמו כותרת דף הבית.
   */
  heightClass?: string
  onClick?: () => void
  /** כש־`onClick` מוגדר — תווית נגישות לכפתור */
  ariaLabel?: string
}

const HEIGHT_TO_TEXT: Record<string, string> = {
  landing: 'text-[1.5rem] sm:text-[1.7rem] md:text-[1.95rem] lg:text-[2.2rem]',
  'h-6': 'text-[1.05rem]',
  'h-7': 'text-[1.22rem]',
  'h-7 md:h-8': 'text-[1.22rem] md:text-[1.42rem]',
  'h-8': 'text-[1.35rem]',
  'h-9': 'text-[1.52rem] sm:text-[1.62rem]',
  'h-10 md:h-11': 'text-[1.72rem] md:text-[2.05rem]',
}

function textSizeClass(heightClass: string): string {
  return HEIGHT_TO_TEXT[heightClass] ?? HEIGHT_TO_TEXT['h-8']
}

export default function BrandLogo({
  tone = 'dark',
  className = '',
  /** אחיד עם דף הבית — responsive כמו `LandingHeader`. */
  heightClass = 'landing',
  onClick,
  ariaLabel = 'Momento — דף הבית',
}: BrandLogoProps) {
  const colorClass = tone === 'light' ? 'text-white' : 'text-deep-brown'
  const focusRingClass =
    tone === 'light'
      ? 'focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1714]'
      : 'focus-visible:ring-deep-brown/40 focus-visible:ring-offset-2'

  const wordmark = (
    <span
      lang="en"
      dir="ltr"
      translate="no"
      className={`block font-normal leading-none ${textSizeClass(heightClass)} ${colorClass}`}
      style={{ fontFamily: "'Allura', cursive" }}
    >
      Momento.
    </span>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`btn-press inline-flex cursor-pointer items-center border-0 bg-transparent p-0 leading-none focus-visible:outline-none focus-visible:ring-2 ${focusRingClass} ${className}`}
      >
        {wordmark}
      </button>
    )
  }

  return <span className={`inline-flex items-center leading-none ${className}`}>{wordmark}</span>
}
