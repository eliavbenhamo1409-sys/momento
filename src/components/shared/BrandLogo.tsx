interface BrandLogoProps {
  /** `light` = רקע כהה (לוגו לבן, ללא פילטר). `dark` = רקע בהיר (invert כדי שהלבן יהפוך לכהה). */
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
  const cap = 'max-w-[min(96vw,800px)]'
  /** קובץ: טקסט לבן על רקע שקוף — על בהיר משתמשים ב-invert לניגודיות */
  const imgTone =
    tone === 'light'
      ? `${heightClass} w-auto ${cap} object-contain`
      : `${heightClass} w-auto ${cap} object-contain invert`

  const img = (
    <img
      src="/momento-logo.png"
      alt="Momento"
      width={360}
      height={90}
      className={imgTone}
      decoding="async"
    />
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex cursor-pointer items-center border-0 bg-transparent p-0 ${className}`}
      >
        {img}
      </button>
    )
  }

  return <span className={`inline-flex items-center ${className}`}>{img}</span>
}
