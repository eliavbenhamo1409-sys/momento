interface BrandLogoProps {
  /** `light` = רקע כהה (חתימה לבנה). `dark` = רקע בהיר (אינוורט לחתימה כהה). */
  tone?: 'dark' | 'light'
  className?: string
  /** גובה הלוגו (רוחב אוטומטי לפי היחס) */
  heightClass?: string
  onClick?: () => void
}

export default function BrandLogo({
  tone = 'dark',
  className = '',
  heightClass = 'h-8',
  onClick,
}: BrandLogoProps) {
  const cap = 'max-w-[min(94vw,520px)]'
  /** קובץ Momento: לבן על שחור — lighten מסיר שחור מעל רקע כהה; invert להצגה על רקע בהיר */
  const imgTone =
    tone === 'light'
      ? `${heightClass} w-auto ${cap} object-contain opacity-[0.95] mix-blend-lighten`
      : `${heightClass} w-auto ${cap} object-contain invert`

  const img = (
    <img
      src="/momento-logo.png"
      alt="Momento"
      width={200}
      height={48}
      className={imgTone}
      decoding="async"
    />
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center p-0 border-0 bg-transparent cursor-pointer ${className}`}
      >
        {img}
      </button>
    )
  }

  return <span className={`inline-flex items-center ${className}`}>{img}</span>
}
