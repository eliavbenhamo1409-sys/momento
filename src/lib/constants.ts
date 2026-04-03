export const TIMING = {
  fadeUp: 400,
  crossfade: 200,
  slide: 300,
  popIn: 450,
  shimmer: 2000,
  breathe: 3000,
  chipSelect: 150,
  chipRipple: 400,
  autoAdvance: 600,
  hoverLift: 200,
  buttonPress: 100,
  accordionToggle: 300,
  toastStay: 2500,
  toastFade: 250,
  tooltipFade: 200,
  modalOverlay: 250,
  modalScale: 300,
  pageTransition: 300,
} as const

export const GENERATION_STAGES = [
  {
    id: 1,
    headline: 'ממיין את התמונות שלך',
    subtext: 'מזהה פנים, מקומות ורגעים מיוחדים',
    startPercent: 0,
    endPercent: 20,
    durationMs: 4000,
  },
  {
    id: 2,
    headline: 'מסנן כפילויות ותמונות חלשות',
    subtext: 'שומר רק את הרגעים הכי טובים',
    startPercent: 20,
    endPercent: 40,
    durationMs: 4000,
    notification: { text: 'הסרנו 12 תמונות כפולות', atPercent: 35 },
  },
  {
    id: 3,
    headline: 'מזהה את הרגעים החשובים',
    subtext: 'בונה רצף סיפורי מהתמונות שלך',
    startPercent: 40,
    endPercent: 60,
    durationMs: 5000,
  },
  {
    id: 4,
    headline: 'מעצב את העמודים',
    subtext: 'בוחר פריסות, חיתוכים ומיקומים',
    startPercent: 60,
    endPercent: 85,
    durationMs: 6000,
    notification: { text: 'יצרנו 24 עמודים', atPercent: 75 },
  },
  {
    id: 5,
    headline: 'שלמים אחרונים',
    subtext: 'מוודא שהכל מושלם',
    startPercent: 85,
    endPercent: 100,
    durationMs: 3000,
  },
] as const

export const SETUP_QUESTIONS = [
  {
    id: 'type',
    label: 'מה סוג האלבום?',
    multiSelect: false,
    options: [
      { id: 'wedding', label: 'חתונה', icon: 'favorite' },
      { id: 'family', label: 'משפחה', icon: 'family_restroom' },
      { id: 'baby', label: 'תינוק/ת', icon: 'child_care' },
      { id: 'travel', label: 'טיול', icon: 'flight' },
      { id: 'event', label: 'אירוע', icon: 'celebration' },
    ],
  },
  {
    id: 'style',
    label: 'איזה סגנון עיצוב מדבר אליך?',
    multiSelect: false,
    options: [
      { id: 'classic', label: 'קלאסי' },
      { id: 'modern', label: 'מודרני' },
      { id: 'warm', label: 'חם' },
      { id: 'minimal', label: 'מינימליסטי' },
    ],
  },
  {
    id: 'mood',
    label: 'מה האווירה שאתה רוצה?',
    multiSelect: false,
    options: [
      { id: 'romantic', label: 'רומנטית', icon: 'favorite' },
      { id: 'exciting', label: 'מרגשת', icon: 'auto_awesome' },
      { id: 'fun', label: 'כיפית', icon: 'mood' },
      { id: 'nostalgic', label: 'נוסטלגית', icon: 'filter_hdr' },
    ],
  },
  {
    id: 'people',
    label: 'מי במרכז האלבום?',
    multiSelect: true,
    options: [
      { id: 'couple', label: 'בני זוג' },
      { id: 'family', label: 'משפחה' },
      { id: 'friends', label: 'חברים' },
      { id: 'kids', label: 'ילדים' },
    ],
  },
  {
    id: 'automation',
    label: 'כמה חופש לתת ל-AI?',
    multiSelect: false,
    options: [
      { id: 'guided', label: 'אני רוצה לאשר כל שלב' },
      { id: 'balanced', label: 'תן ל-AI להוביל, אני אתקן' },
      { id: 'full', label: 'תן ל-AI להחליט הכל' },
    ],
  },
] as const

export const PREDEFINED_BG_COLORS: { label: string; value: string; gradient: string }[] = [
  { label: 'לבן', value: '#ffffff', gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f0eb 100%)' },
  { label: 'קרם', value: '#f5f0eb', gradient: 'linear-gradient(135deg, #faf7f2 0%, #ede5d8 100%)' },
  { label: 'בז׳', value: '#e8dfd3', gradient: 'linear-gradient(135deg, #efe8de 0%, #d9cfc0 100%)' },
  { label: 'מרווה', value: '#c5cfc0', gradient: 'linear-gradient(135deg, #d4dccf 0%, #b0bfa8 100%)' },
  { label: 'אפרסק', value: '#f0d9c8', gradient: 'linear-gradient(135deg, #f7e5d7 0%, #e4c4a8 100%)' },
  { label: 'תכלת רך', value: '#d4dfe8', gradient: 'linear-gradient(135deg, #e0e9f0 0%, #c0d0de 100%)' },
  { label: 'לבנדר', value: '#ddd4e8', gradient: 'linear-gradient(135deg, #e8e0f0 0%, #ccc0de 100%)' },
  { label: 'ורוד רך', value: '#edd6d8', gradient: 'linear-gradient(135deg, #f5e0e2 0%, #e0c4c8 100%)' },
  { label: 'חול', value: '#d4c8b0', gradient: 'linear-gradient(135deg, #e0d4bc 0%, #c0b498 100%)' },
  { label: 'אפור רך', value: '#e0ddd8', gradient: 'linear-gradient(135deg, #eae8e4 0%, #d0cdc8 100%)' },
  { label: 'שמפניה', value: '#f0e8d0', gradient: 'linear-gradient(135deg, #f8f0db 0%, #e5d8b8 100%)' },
  { label: 'שחור', value: '#2d2824', gradient: 'linear-gradient(135deg, #3a3530 0%, #1e1a16 100%)' },
]

export const SAMPLE_PHOTOS = Array.from({ length: 24 }, (_, i) => ({
  id: `photo-${i + 1}`,
  thumbnailUrl: `https://picsum.photos/seed/momento${i + 1}/200/200`,
  fullUrl: `https://picsum.photos/seed/momento${i + 1}/1200/800`,
  width: 1200,
  height: 800,
  selected: true,
}))

export const EDITOR_SPREADS = [
  {
    id: 'spread-1',
    templateId: 'hero-left-grid-right',
    leftPhotos: ['https://picsum.photos/seed/album-l1/600/400'],
    rightPhotos: [
      'https://picsum.photos/seed/album-r1a/300/400',
      'https://picsum.photos/seed/album-r1b/300/200',
      'https://picsum.photos/seed/album-r1c/300/200',
    ],
    quote: '"רגעים של אושר בין סמטאות עתיקות ונוף משכר"',
  },
  {
    id: 'spread-2',
    templateId: 'hero-right-stack-left',
    leftPhotos: [
      'https://picsum.photos/seed/album-l2a/300/200',
      'https://picsum.photos/seed/album-l2b/300/200',
    ],
    rightPhotos: ['https://picsum.photos/seed/album-r2/600/400'],
    quote: null,
  },
  {
    id: 'spread-3',
    templateId: 'grid-2x2',
    leftPhotos: ['https://picsum.photos/seed/album-l3/600/400'],
    rightPhotos: [
      'https://picsum.photos/seed/album-r3a/200/200',
      'https://picsum.photos/seed/album-r3b/200/200',
      'https://picsum.photos/seed/album-r3c/200/200',
      'https://picsum.photos/seed/album-r3d/200/200',
    ],
    quote: null,
  },
] as const

export const ALBUM_SIZES = [
  {
    id: '30x30',
    label: '30×30 ס"מ',
    closedDimensions: '30×30',
    openDimensions: '60×30',
    closedW: 30,
    closedH: 30,
    openW: 60,
    openH: 30,
  },
  {
    id: '60x60',
    label: '60×60 ס"מ',
    closedDimensions: '60×60',
    openDimensions: '120×60',
    closedW: 60,
    closedH: 60,
    openW: 120,
    openH: 60,
  },
] as const

export const PAGE_OPTIONS = [20, 30, 40, 50] as const

export const PRICE_PER_EXTRA_SPREAD = 25

export const ALBUM_BASE_PRICES: Record<string, Record<number, number>> = {
  '30x30': {
    20: 289,
    30: 389,
    40: 489,
    50: 589,
  },
  '60x60': {
    20: 489,
    30: 619,
    40: 749,
    50: 879,
  },
}

export function calcAlbumPrice(sizeId: string, pages: number): number {
  const sizePrices = ALBUM_BASE_PRICES[sizeId]
  if (!sizePrices) return 0

  const presetPages = PAGE_OPTIONS as readonly number[]
  const nearest = [...presetPages].reverse().find((p) => p <= pages) ?? presetPages[0]
  const base = sizePrices[nearest] ?? sizePrices[20]
  const extraSpreads = Math.max(0, Math.floor((pages - nearest) / 2))
  return base + extraSpreads * PRICE_PER_EXTRA_SPREAD
}

export const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'החתונה של דנה ואיתי',
    coverUrl: 'https://picsum.photos/seed/proj1/400/300',
    size: '30x30',
    pages: 30,
    photosCount: 142,
    lastEdited: '2026-03-22',
    progress: 75,
  },
  {
    id: 'proj-2',
    title: 'טיול משפחתי ליוון',
    coverUrl: 'https://picsum.photos/seed/proj2/400/300',
    size: '60x60',
    pages: 40,
    photosCount: 86,
    lastEdited: '2026-03-18',
    progress: 40,
  },
  {
    id: 'proj-3',
    title: 'השנה הראשונה של עומר',
    coverUrl: 'https://picsum.photos/seed/proj3/400/300',
    size: '30x30',
    pages: 20,
    photosCount: 65,
    lastEdited: '2026-03-10',
    progress: 15,
  },
] as const

export const MOCK_ORDERS = [
  {
    id: 'ord-1',
    orderNumber: 'MOM-2026-0847',
    title: 'חתונה — הגרסה הסופית',
    coverUrl: 'https://picsum.photos/seed/ord1/400/300',
    status: 'shipped' as const,
    size: '30x30',
    pages: 30,
    price: 389,
    orderedAt: '2026-02-14',
    estimatedDelivery: '2026-03-28',
  },
  {
    id: 'ord-2',
    orderNumber: 'MOM-2026-0621',
    title: 'טיול איטליה 2025',
    coverUrl: 'https://picsum.photos/seed/ord2/400/300',
    status: 'delivered' as const,
    size: '60x60',
    pages: 40,
    price: 749,
    orderedAt: '2026-01-05',
  },
] as const

export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'טיוטה', color: 'text-warm-gray', bg: 'bg-surface-container-high' },
  processing: { label: 'בעיבוד', color: 'text-primary', bg: 'bg-primary-fixed/40' },
  printing: { label: 'בהדפסה', color: 'text-sage', bg: 'bg-sage/10' },
  shipped: { label: 'נשלח', color: 'text-sage', bg: 'bg-sage/10' },
  delivered: { label: 'נמסר', color: 'text-sage', bg: 'bg-sage/15' },
}

export const PRICING = [
  {
    id: 'basic',
    name: 'בסיסי',
    pages: 20,
    size: '30x30',
    price: 289,
    recommended: false,
    features: ['20 עמודים', 'כריכה קשה', 'עיצוב AI', 'משלוח חינם'],
  },
  {
    id: 'premium',
    name: 'פרימיום',
    pages: 30,
    size: '30x30',
    price: 389,
    recommended: true,
    features: ['30 עמודים', 'כריכה קשה', 'עיצוב AI מתקדם', 'שיפור תמונות', 'משלוח חינם'],
  },
  {
    id: 'deluxe',
    name: 'דלוקס',
    pages: 40,
    size: '60x60',
    price: 749,
    recommended: false,
    features: ['40 עמודים', 'פורמט גדול 60×60', 'כריכה קשה פרימיום', 'עיצוב AI מתקדם', 'שיפור תמונות', 'משלוח אקספרס'],
  },
] as const
