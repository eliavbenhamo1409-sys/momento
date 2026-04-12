interface BrandLogoProps {
  /** על רקע כהה — הופך את הלוגו לבהיר */
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
  const imgTone =
    tone === 'light'
      ? `${heightClass} w-auto ${cap} object-contain brightness-0 invert opacity-90`
      : `${heightClass} w-auto ${cap} object-contain`

  const img = (
    <img
      src="/momento-logo.png"
      alt="Momento"
      width={220}
      height={56}
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
