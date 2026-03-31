import type { LayoutTemplate, PageRules, SlotDefinition, TemplateCategory, DesignFamily, SpreadRole } from '../types'

// ─── Page Rules (print-safe defaults) ───────────────────────────────

export const PAGE_RULES: PageRules = {
  bleedMm: 3,
  safeMarginMm: 8,
  gutterMm: 12,
  firstSpreadTemplate: 'cover-hero',
  lastSpreadTemplate: 'closing',
  maxConsecutiveSameCategory: 2,
  quoteFrequency: { min: 2, max: 4 },
}

// Safe zone insets (% from edge) that keep faces away from trim/bleed
const SAFE_DEFAULT = { top: 8, bottom: 8, left: 8, right: 8 }
const SAFE_BLEED = { top: 5, bottom: 5, left: 5, right: 5 }
const SAFE_GUTTER = { top: 8, bottom: 8, left: 8, right: 15 }

// ─── Slot helpers ───────────────────────────────────────────────────

function slot(
  id: string,
  page: 'left' | 'right',
  x: number, y: number, w: number, h: number,
  opts: Partial<Pick<SlotDefinition, 'accepts' | 'importance' | 'minQuality' | 'safeZone'>> = {},
): SlotDefinition {
  return {
    id,
    page,
    x, y,
    width: w,
    height: h,
    accepts: opts.accepts ?? ['any'],
    importance: opts.importance ?? 'secondary',
    minQuality: opts.minQuality ?? 3,
    safeZone: opts.safeZone ?? SAFE_DEFAULT,
  }
}

// ─── Template Library ───────────────────────────────────────────────

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [

  // ── 1. Cover Hero ─────────────────────────────────────────────────
  {
    id: 'cover-hero',
    name: 'כריכה',
    category: 'cover',
    minPhotos: 1,
    maxPhotos: 4,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 999,
    bestForMood: ['romantic', 'dramatic', 'serene'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor'],
    slots: [
      slot('cover-main', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-left', 'right', 0, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 2. Hero Left + Grid Right ─────────────────────────────────────
  {
    id: 'hero-left-grid-right',
    name: 'תמונה ראשית + רשת',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 5,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'romantic', 'nostalgic'],
    bestForScene: ['outdoor', 'portrait', 'group'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_GUTTER,
      }),
      slot('right-top-left', 'right', 0, 0, 50, 50, {
        importance: 'primary', minQuality: 4, accepts: ['any'],
      }),
      slot('right-top-right', 'right', 50, 0, 50, 50, {
        importance: 'secondary', minQuality: 3, accepts: ['any'],
      }),
      slot('right-bottom-left', 'right', 0, 50, 50, 50, {
        importance: 'secondary', minQuality: 3, accepts: ['any'],
      }),
      slot('right-bottom-right', 'right', 50, 50, 50, 50, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
    ],
  },

  // ── 3. Hero Right + Grid Left ────────────────────────────────────
  {
    id: 'hero-right-stack-left',
    name: 'תמונה ראשית ימין + שתיים שמאל',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['energetic', 'joyful', 'dramatic'],
    bestForScene: ['action', 'group', 'outdoor'],
    slots: [
      slot('left-top-left', 'left', 0, 0, 50, 50, {
        importance: 'primary', minQuality: 5, accepts: ['any'],
      }),
      slot('left-top-right', 'left', 50, 0, 50, 50, {
        importance: 'secondary', minQuality: 4, accepts: ['any'],
      }),
      slot('left-bottom-left', 'left', 0, 50, 50, 50, {
        importance: 'secondary', minQuality: 4, accepts: ['any'],
      }),
      slot('left-bottom-right', 'left', 50, 50, 50, 50, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
      slot('right-hero', 'right', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: { ...SAFE_DEFAULT, left: 15 },
      }),
    ],
  },

  // ── 4. Grid 2x2 ──────────────────────────────────────────────────
  {
    id: 'grid-2x2',
    name: 'רשת 2×2',
    category: 'grid',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 2,
    bestForMood: ['joyful', 'energetic', 'neutral'],
    bestForScene: ['detail', 'food', 'group'],
    slots: [
      slot('left-top', 'left', 0, 0, 50, 50, {
        importance: 'primary', minQuality: 4, accepts: ['any'],
      }),
      slot('left-top-right', 'left', 50, 0, 50, 50, {
        importance: 'secondary', minQuality: 3, accepts: ['any'],
      }),
      slot('left-bottom-left', 'left', 0, 50, 50, 50, {
        importance: 'primary', minQuality: 4, accepts: ['any'],
      }),
      slot('left-bottom-right', 'left', 50, 50, 50, 50, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
      slot('right-full', 'right', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 4, accepts: ['any'],
      }),
    ],
  },

  // ── 5. Mosaic 5 ──────────────────────────────────────────────────
  {
    id: 'mosaic-5',
    name: 'מוזאיקה',
    category: 'mosaic',
    minPhotos: 4,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'food', 'indoor', 'outdoor'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 5, accepts: ['any'],
      }),
      slot('left-accent-left', 'left', 0, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
      slot('left-accent-right', 'left', 50, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
      slot('right-top-left', 'right', 0, 0, 50, 50, {
        importance: 'primary', accepts: ['any'],
      }),
      slot('right-top-right', 'right', 50, 0, 50, 50, {
        importance: 'secondary', accepts: ['any'],
      }),
      slot('right-bottom-left', 'right', 0, 50, 50, 50, {
        importance: 'primary', minQuality: 4, accepts: ['any'],
      }),
      slot('right-bottom-right', 'right', 50, 50, 50, 50, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
    ],
  },

  // ── 6. Full Bleed Left + Quote Right ──────────────────────────────
  {
    id: 'full-bleed-quote',
    name: 'תמונה מלאה + ציטוט',
    category: 'text',
    minPhotos: 2,
    maxPhotos: 4,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'serene', 'nostalgic', 'dramatic'],
    bestForScene: ['landscape_scenic', 'portrait', 'outdoor'],
    slots: [
      slot('left-full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-left', 'right', 0, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 7. Panoramic (split across left + right pages) ────────────────
  {
    id: 'panoramic',
    name: 'פנורמה',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 6,
    bestForMood: ['serene', 'dramatic', 'nostalgic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'architecture'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['landscape', 'any'], safeZone: SAFE_GUTTER,
      }),
      slot('right-top', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 5, accepts: ['landscape', 'any'],
      }),
      slot('right-bottom-left', 'right', 0, 55, 50, 45, {
        importance: 'secondary', minQuality: 3, accepts: ['any'],
      }),
      slot('right-bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'secondary', minQuality: 3, accepts: ['any'],
      }),
    ],
  },

  // ── 8. Grid Left + Hero Right ─────────────────────────────────────
  {
    id: 'trio-left-hero-right',
    name: 'רשת + ראשית',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: true,
    quotePosition: 'left-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'tender', 'energetic'],
    bestForScene: ['group', 'detail', 'indoor'],
    slots: [
      slot('left-top-left', 'left', 0, 0, 50, 50, {
        importance: 'secondary', accepts: ['any'],
      }),
      slot('left-top-right', 'left', 50, 0, 50, 50, {
        importance: 'primary', minQuality: 5, accepts: ['any'],
      }),
      slot('left-bottom-left', 'left', 0, 50, 50, 50, {
        importance: 'secondary', accepts: ['any'],
      }),
      slot('left-bottom-right', 'left', 50, 50, 50, 50, {
        importance: 'accent', accepts: ['any'],
      }),
      slot('right-hero', 'right', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'],
      }),
    ],
  },

  // ── 9. Detail Grid (8 photos) ────────────────────────────────────
  {
    id: 'detail-grid',
    name: 'רשת פרטים',
    category: 'grid',
    minPhotos: 5,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'nostalgic', 'neutral'],
    bestForScene: ['detail', 'food', 'indoor'],
    slots: [
      slot('left-top-l', 'left', 0, 0, 50, 50, { importance: 'secondary', accepts: ['any'] }),
      slot('left-top-r', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'] }),
      slot('left-bottom-l', 'left', 0, 50, 50, 50, { importance: 'primary', minQuality: 4, accepts: ['any'] }),
      slot('left-bottom-r', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'] }),
      slot('right-top-l', 'right', 0, 0, 50, 50, { importance: 'primary', minQuality: 4, accepts: ['any'] }),
      slot('right-top-r', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'] }),
      slot('right-bottom-l', 'right', 0, 50, 50, 50, { importance: 'accent', accepts: ['any'] }),
      slot('right-bottom-r', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'] }),
    ],
  },

  // ── 10. Balanced 4 ────────────────────────────────────────────────
  {
    id: 'balanced-4',
    name: 'מאוזן',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 5,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 2,
    bestForMood: ['neutral', 'serene', 'tender'],
    bestForScene: ['outdoor', 'indoor', 'portrait', 'group'],
    slots: [
      slot('left-main', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 5, accepts: ['any'],
      }),
      slot('right-top', 'right', 0, 0, 50, 50, {
        importance: 'primary', accepts: ['any'],
      }),
      slot('right-top-right', 'right', 50, 0, 50, 50, {
        importance: 'secondary', accepts: ['any'],
      }),
      slot('right-bottom-left', 'right', 0, 50, 50, 50, {
        importance: 'accent', accepts: ['any'],
      }),
      slot('right-bottom-right', 'right', 50, 50, 50, 50, {
        importance: 'accent', accepts: ['any'],
      }),
    ],
  },

  // ── 11. Text Heavy (chapter divider) ──────────────────────────────
  {
    id: 'text-heavy',
    name: 'חלוקת פרקים',
    category: 'text',
    minPhotos: 2,
    maxPhotos: 2,
    acceptsQuote: true,
    quotePosition: 'left-bottom',
    cannotRepeatWithin: 5,
    bestForMood: ['romantic', 'nostalgic', 'serene'],
    bestForScene: ['landscape_scenic', 'portrait', 'detail'],
    slots: [
      slot('left-photo', 'left', 0, 0, 100, 100, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-photo', 'right', 0, 0, 100, 100, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 12. Closing ───────────────────────────────────────────────────
  {
    id: 'closing',
    name: 'סיום',
    category: 'closing',
    minPhotos: 2,
    maxPhotos: 4,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 999,
    bestForMood: ['romantic', 'serene', 'nostalgic', 'tender'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor'],
    slots: [
      slot('closing-main', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-feature', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 4, accepts: ['any'],
      }),
      slot('right-bottom-left', 'right', 0, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
      slot('right-bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
    ],
  },

  // ── 13. Full Spread — requires 2+ photos to prevent single-photo waste
  {
    id: 'full-spread',
    name: 'פנורמה מלאה',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 999,
    bestForMood: ['dramatic', 'serene', 'romantic', 'nostalgic'],
    bestForScene: ['landscape_scenic', 'outdoor'],
    spanning: true,
    slots: [
      slot('full-span', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 7, accepts: ['landscape'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left', 'left', 0, 55, 50, 45, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'secondary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 14. Six Grid Spanning (2x3 grid across both pages) ───
  {
    id: 'three-rows',
    name: 'רשת שישייה',
    category: 'grid',
    minPhotos: 3,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'landscape_scenic'],
    spanning: true,
    slots: [
      slot('tl', 'left', 0, 0, 50, 50, {
        importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('tr', 'left', 50, 0, 50, 50, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('ml', 'left', 0, 50, 50, 50, {
        importance: 'secondary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('mr', 'left', 50, 50, 50, 50, {
        importance: 'secondary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bl', 'right', 0, 0, 50, 50, {
        importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('br', 'right', 50, 0, 50, 50, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 15. Hero Top + Grid Bottom (like reference image 2) ────────
  {
    id: 'hero-top-grid-bottom',
    name: 'ראשית למעלה + רשת למטה',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'tender'],
    bestForScene: ['portrait', 'group', 'outdoor', 'detail'],
    spanningSlotIds: ['hero-top'],
    slots: [
      slot('hero-top', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('grid-bl-tl', 'left', 0, 55, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('grid-bl-tr', 'left', 50, 55, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('grid-br-tl', 'right', 0, 55, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('grid-br-tr', 'right', 50, 55, 50, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 16. Grid 3x2 (6 photos filling the spread) ────────────────
  {
    id: 'grid-3x2',
    name: 'רשת 3×2',
    category: 'grid',
    minPhotos: 6,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'food', 'indoor', 'outdoor'],
    slots: [
      slot('l-tl', 'left', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 50, 50, 50, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 17. Portrait Duo (2 portrait photos, one per page) ─────────
  {
    id: 'portrait-duo',
    name: 'שתי אורכיות',
    category: 'balanced',
    minPhotos: 2,
    maxPhotos: 2,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'tender', 'serene', 'dramatic'],
    bestForScene: ['portrait', 'outdoor', 'indoor'],
    slots: [
      slot('left-portrait', 'left', 15, 0, 70, 100, {
        importance: 'primary', minQuality: 5, accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-portrait', 'right', 15, 0, 70, 100, {
        importance: 'primary', minQuality: 5, accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 18. Portrait Trio (hero portrait + 2 side-by-side portraits) ──
  {
    id: 'portrait-trio',
    name: 'שלוש אורכיות',
    category: 'grid',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['portrait', 'group', 'outdoor'],
    slots: [
      slot('left-full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('right-left', 'right', 0, 0, 50, 100, {
        importance: 'primary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-right', 'right', 50, 0, 50, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 19. Portrait Hero + Grid (1 large portrait + 3-4 smaller) ──
  {
    id: 'portrait-hero-grid',
    name: 'אורכית ראשית + רשת',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'dramatic', 'tender', 'joyful'],
    bestForScene: ['portrait', 'outdoor', 'group'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top-left', 'right', 0, 0, 50, 50, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top-right', 'right', 50, 0, 50, 50, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-left', 'right', 0, 50, 50, 50, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-right', 'right', 50, 50, 50, 50, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 20. Mixed Top-Bottom (hero top + squares bottom) ────
  {
    id: 'mixed-top-bottom',
    name: 'ראשית למעלה + ריבועיות למטה',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'landscape_scenic', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['top-hero'],
    slots: [
      slot('top-hero', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left', 'left', 0, 55, 50, 45, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left-right', 'left', 50, 55, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-right-left', 'right', 0, 55, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-right-right', 'right', 50, 55, 50, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 21. Portrait Grid 4 (2x2 portrait photos) ─────────────────
  {
    id: 'portrait-grid-4',
    name: 'רשת 4 אורכיות',
    category: 'grid',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'romantic'],
    bestForScene: ['portrait', 'group', 'outdoor', 'indoor'],
    slots: [
      slot('left-left', 'left', 0, 0, 50, 100, {
        importance: 'primary', minQuality: 5, accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('left-right', 'left', 50, 0, 50, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-left', 'right', 0, 0, 50, 100, {
        importance: 'primary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-right', 'right', 50, 0, 50, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 22. Portrait 5 (hero + 4 portraits in grid) ───────────────
  {
    id: 'portrait-5',
    name: '5 אורכיות',
    category: 'grid',
    minPhotos: 5,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['portrait', 'group', 'outdoor'],
    slots: [
      slot('left-hero', 'left', 0, 0, 55, 100, {
        importance: 'hero', minQuality: 5, accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('left-accent', 'left', 55, 0, 45, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-left', 'right', 0, 0, 33.33, 100, {
        importance: 'primary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-mid', 'right', 33.33, 0, 33.34, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('right-right', 'right', 66.67, 0, 33.33, 100, {
        importance: 'accent', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 23. Portrait 6 (6 portraits in 3+3 columns) ───────────────
  {
    id: 'portrait-6',
    name: '6 אורכיות',
    category: 'grid',
    minPhotos: 6,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['portrait', 'group', 'outdoor', 'indoor'],
    slots: [
      slot('l1', 'left', 0, 0, 33.33, 100, {
        importance: 'primary', minQuality: 5, accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('l2', 'left', 33.33, 0, 33.34, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('l3', 'left', 66.67, 0, 33.33, 100, {
        importance: 'accent', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('r1', 'right', 0, 0, 33.33, 100, {
        importance: 'primary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('r2', 'right', 33.33, 0, 33.34, 100, {
        importance: 'secondary', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
      slot('r3', 'right', 66.67, 0, 33.33, 100, {
        importance: 'accent', accepts: ['portrait'], safeZone: SAFE_BLEED,
      }),
    ],
  },
  // ── 24. Grid 4+3 (7 photos) ─────────────────────────────────────
  {
    id: 'grid-4-3',
    name: 'רשת 4+4',
    category: 'grid',
    minPhotos: 7,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'outdoor', 'indoor'],
    slots: [
      slot('l-tl', 'left', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 25. Editorial 4+4 (8 photos, asymmetric) ───────────────────
  {
    id: 'grid-4-4',
    name: 'אדיטוריאל 4+4',
    category: 'grid',
    minPhotos: 8,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 999,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'outdoor', 'indoor', 'food'],
    slots: [
      slot('l-hero', 'left', 0, 0, 60, 55, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 60, 0, 40, 40, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 55, 40, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 40, 55, 60, 45, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 45, 60, { importance: 'primary', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 45, 0, 55, 40, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 45, 40, 55, 60, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 0, 60, 45, 40, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 26. Hero + 6 Grid (7 photos with hero) ──────────────────────
  {
    id: 'hero-plus-6',
    name: 'ראשית + 6',
    category: 'hero',
    minPhotos: 7,
    maxPhotos: 7,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'romantic', 'nostalgic'],
    bestForScene: ['outdoor', 'portrait', 'group'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 55, { importance: 'hero', minQuality: 6, accepts: ['landscape'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 55, 50, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 55, 50, 45, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 27. Hero Portrait + Grid (7 photos with portrait hero) ──────
  {
    id: 'hero-plus-7',
    name: 'ראשית אורכית + רשת',
    category: 'hero',
    minPhotos: 5,
    maxPhotos: 7,
    acceptsQuote: false,
    cannotRepeatWithin: 5,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['group', 'outdoor', 'detail', 'food'],
    slots: [
      slot('l-tall', 'left', 0, 0, 45, 100, { importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('l-top-r', 'left', 45, 0, 55, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bot-r', 'left', 45, 50, 55, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 28. Landscape Top + 2 Squares Below ────────────────────────────
  {
    id: 'landscape-top-2sq',
    name: 'רוחבית + 2 ריבועיות',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 2,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'serene'],
    bestForScene: ['landscape_scenic', 'outdoor', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['top-wide'],
    slots: [
      slot('top-wide', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 5, accepts: ['landscape'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left', 'left', 0, 55, 50, 45, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 29. 2 Squares Top + Landscape Below ────────────────────────────
  {
    id: '2sq-top-landscape',
    name: '2 ריבועיות + רוחבית',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 2,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'serene'],
    bestForScene: ['landscape_scenic', 'outdoor', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['bottom-wide'],
    slots: [
      slot('top-left', 'left', 0, 0, 50, 45, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('top-right', 'right', 50, 0, 50, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-wide', 'left', 0, 45, 100, 55, {
        importance: 'hero', minQuality: 5, accepts: ['landscape'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 30. Cross Diagonal (big + small, mirrored on each page) ────────
  {
    id: 'cross-diagonal',
    name: 'צולב מאוזן',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'dramatic', 'energetic', 'nostalgic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'landscape_scenic'],
    slots: [
      slot('left-big', 'left', 0, 0, 65, 60, {
        importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('left-small', 'left', 35, 60, 65, 40, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-small', 'right', 0, 0, 65, 40, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-big', 'right', 0, 40, 65, 60, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 31. Single Portrait + Accent Right ──────────────────────────────
  {
    id: 'single-portrait',
    name: 'תמונה אורכית + אקסנט',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['dramatic', 'romantic', 'tender', 'serene'],
    bestForScene: ['portrait', 'outdoor', 'indoor'],
    slots: [
      slot('portrait-full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('right-main', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-accent', 'right', 0, 55, 100, 45, {
        importance: 'accent', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 32. Two Landscapes Stacked ─────────────────────────────────────
  {
    id: 'two-landscapes-stacked',
    name: 'שתי רוחביות אחת על השנייה',
    category: 'balanced',
    minPhotos: 2,
    maxPhotos: 2,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['serene', 'nostalgic', 'romantic', 'dramatic'],
    bestForScene: ['landscape_scenic', 'outdoor'],
    spanning: true,
    spanningSlotIds: ['top-landscape', 'bottom-landscape'],
    slots: [
      slot('top-landscape', 'left', 0, 0, 100, 48, {
        importance: 'hero', minQuality: 5, accepts: ['landscape'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-landscape', 'left', 0, 52, 100, 48, {
        importance: 'primary', accepts: ['landscape'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 33. Asymmetric Hero + Steps (break symmetry) ──────────────────
  {
    id: 'asymmetric-hero-steps',
    name: 'ראשית + מדרגות',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'detail'],
    slots: [
      slot('left-big', 'left', 0, 0, 100, 65, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('left-small', 'left', 0, 65, 55, 35, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-tall', 'right', 0, 0, 55, 65, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top-small', 'right', 55, 0, 45, 40, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom', 'right', 0, 65, 100, 35, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 34. L-Shape (big feature + small accents in corner) ──────────
  {
    id: 'l-shape',
    name: 'צורת L',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'dramatic', 'tender', 'serene'],
    bestForScene: ['portrait', 'outdoor', 'landscape_scenic', 'group'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_GUTTER,
      }),
      slot('right-feature', 'right', 0, 0, 65, 65, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom', 'right', 0, 65, 100, 35, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-side', 'right', 65, 0, 35, 65, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 35. Dynamic Trio (1 dominant + 2 offset) ─────────────────────
  {
    id: 'dynamic-trio',
    name: 'שלישיית דינמית',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'detail'],
    slots: [
      slot('left-full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-large', 'right', 0, 0, 100, 60, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-small', 'right', 0, 60, 100, 40, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 36. Staggered Grid (asymmetric 5-photo layout) ───────────────
  {
    id: 'staggered-grid',
    name: 'רשת משוחררת',
    category: 'grid',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'outdoor', 'food'],
    slots: [
      slot('left-big', 'left', 0, 0, 60, 55, {
        importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('left-top-right', 'left', 60, 0, 40, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('left-bottom', 'left', 0, 55, 100, 45, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-left', 'right', 0, 55, 45, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-right', 'right', 45, 55, 55, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 37. Photo Over Photo (background + overlay square) ───────────
  {
    id: 'photo-over-photo',
    name: 'תמונה על תמונה',
    category: 'hero',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'dramatic', 'serene', 'tender'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait'],
    slots: [
      slot('bg-photo', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('overlay-square', 'left', 55, 55, 40, 40, {
        importance: 'primary', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top', 'right', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-left', 'right', 0, 55, 50, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom-right', 'right', 50, 55, 50, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 38. Photo Over Photo (right page variant) ────────────────────
  {
    id: 'photo-over-photo-right',
    name: 'תמונה על תמונה ימין',
    category: 'hero',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'dramatic', 'serene', 'tender'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait'],
    slots: [
      slot('left-top', 'left', 0, 0, 100, 55, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('left-bottom-left', 'left', 0, 55, 50, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('left-bottom-right', 'left', 50, 55, 50, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('bg-photo', 'right', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('overlay-square', 'right', 5, 55, 40, 40, {
        importance: 'primary', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 39. Editorial: Left Grid + Right Duo (6 photos) ───────────────
  {
    id: 'editorial-grid-duo',
    name: 'רשת + זוג אורכיות',
    category: 'balanced',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'romantic'],
    bestForScene: ['group', 'outdoor', 'indoor', 'portrait'],
    slots: [
      slot('l-tl', 'left', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-left', 'right', 0, 0, 50, 100, { importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('r-right', 'right', 50, 0, 50, 100, { importance: 'primary', minQuality: 4, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 40. Editorial: Hero + Mosaic (5 photos) ───────────────────────
  {
    id: 'editorial-hero-mosaic',
    name: 'גיבור + פסיפס',
    category: 'hero',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['dramatic', 'romantic', 'serene', 'nostalgic'],
    bestForScene: ['outdoor', 'portrait', 'landscape_scenic'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 60, { importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('l-accent', 'left', 0, 60, 100, 40, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tall', 'right', 0, 0, 40, 100, { importance: 'primary', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('r-top-right', 'right', 40, 0, 60, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom-right', 'right', 40, 50, 60, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 41. Editorial: Stagger 3 (3 photos, asymmetric breathing) ─────
  {
    id: 'editorial-stagger-3',
    name: 'שלישייה אדיטוריאלית',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['serene', 'romantic', 'nostalgic', 'dramatic'],
    bestForScene: ['portrait', 'outdoor', 'landscape_scenic'],
    slots: [
      slot('l-tall', 'left', 0, 0, 45, 100, { importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('l-wide', 'left', 45, 0, 55, 100, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-main', 'right', 0, 0, 100, 100, { importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 42. Editorial: Magazine Spread (4 photos, editorial flow) ─────
  {
    id: 'editorial-magazine',
    name: 'מגזין',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['dramatic', 'energetic', 'joyful'],
    bestForScene: ['outdoor', 'group', 'action', 'portrait'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 60, { importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bottom', 'left', 0, 60, 100, 40, { importance: 'accent', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('r-top', 'right', 0, 0, 100, 45, { importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('r-bottom', 'right', 0, 45, 100, 55, { importance: 'secondary', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 43. Mini Collage (9-12 small photos across spread) ─────────────
  {
    id: 'mini-collage-12',
    name: 'קולאז׳ מיני',
    category: 'mosaic',
    minPhotos: 9,
    maxPhotos: 12,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'neutral'],
    bestForScene: ['detail', 'food', 'indoor', 'outdoor', 'group', 'action'],
    slots: [
      // Left page: 2 columns x 3 rows
      slot('l-tl', 'left', 0, 0, 50, 33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-ml', 'left', 0, 33, 50, 34, { importance: 'primary', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-mr', 'left', 50, 33, 50, 34, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 67, 50, 33, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 67, 50, 33, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      // Right page: 2 columns x 3 rows
      slot('r-tl', 'right', 0, 0, 50, 33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-ml', 'right', 0, 33, 50, 34, { importance: 'primary', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-mr', 'right', 50, 33, 50, 34, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 67, 50, 33, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 67, 50, 33, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 44. Mini Collage 9 (3x3 mixed grid) ───────────────────────────
  {
    id: 'mini-collage-9',
    name: 'קולאז׳ 9',
    category: 'mosaic',
    minPhotos: 7,
    maxPhotos: 9,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'neutral'],
    bestForScene: ['detail', 'food', 'indoor', 'outdoor', 'group', 'action'],
    slots: [
      // Left page: hero top + 2 bottom
      slot('l-top', 'left', 0, 0, 100, 50, { importance: 'primary', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      // Right page: 2x3 grid
      slot('r-tl', 'right', 0, 0, 50, 33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-ml', 'right', 0, 33, 50, 34, { importance: 'primary', minQuality: 3, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-mr', 'right', 50, 33, 50, 34, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 67, 50, 33, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 67, 50, 33, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 45. Editorial: Cinematic Duo (2 photos, big breathing room) ───
  {
    id: 'editorial-cinematic',
    name: 'קולנועי',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 2,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['dramatic', 'romantic', 'serene', 'nostalgic'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor'],
    slots: [
      slot('l-main', 'left', 5, 5, 90, 90, { importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-main', 'right', 5, 5, 90, 90, { importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 46. Hero + Caption Left ────────────────────────────────────────
  {
    id: 'hero-caption-left',
    name: 'גיבור + כיתוב שמאל',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 4,
    acceptsQuote: true,
    quotePosition: 'left-bottom',
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'dramatic', 'serene', 'tender', 'nostalgic'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 72, { importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-top', 'right', 0, 0, 100, 50, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom-l', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom-r', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 47. Hero + Caption Right ───────────────────────────────────────
  {
    id: 'hero-caption-right',
    name: 'גיבור + כיתוב ימין',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 4,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'dramatic', 'serene', 'tender', 'nostalgic'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor'],
    slots: [
      slot('l-top', 'left', 0, 0, 100, 50, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bottom-l', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bottom-r', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-hero', 'right', 0, 0, 100, 72, { importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 48. Hero Trio Bottom (spanning hero + 3 companions) ────────────
  {
    id: 'hero-trio-bottom',
    name: 'גיבור + שלישייה',
    category: 'hero',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'dramatic', 'nostalgic'],
    bestForScene: ['outdoor', 'group', 'landscape_scenic', 'action'],
    spanning: true,
    spanningSlotIds: ['top-hero'],
    slots: [
      slot('top-hero', 'left', 0, 0, 100, 62, { importance: 'hero', minQuality: 7, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('bottom-1', 'left', 0, 65, 50, 35, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('bottom-2', 'right', 0, 65, 50, 35, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('bottom-3', 'right', 50, 65, 50, 35, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 49. Story Spread (hero + text zone + companions) ───────────────
  {
    id: 'story-spread',
    name: 'עמוד סיפור',
    category: 'text',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-top',
    cannotRepeatWithin: 5,
    bestForMood: ['romantic', 'serene', 'nostalgic', 'tender'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor', 'detail'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 100, { importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom-l', 'right', 0, 55, 50, 45, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom-r', 'right', 50, 55, 50, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 50. Editorial Asymmetric ───────────────────────────────────────
  {
    id: 'editorial-asymmetric',
    name: 'אדיטוריאל א-סימטרי',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'energetic', 'joyful', 'nostalgic'],
    bestForScene: ['outdoor', 'portrait', 'indoor', 'group'],
    slots: [
      slot('l-hero', 'left', 0, 0, 70, 100, { importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('l-accent', 'left', 70, 60, 30, 40, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-top', 'right', 0, 0, 100, 55, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom', 'right', 0, 55, 50, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 51. Mosaic Hero Accent (hero + strip + grid) ───────────────────
  {
    id: 'mosaic-hero-accent',
    name: 'פסיפס גיבור',
    category: 'mosaic',
    minPhotos: 7,
    maxPhotos: 7,
    acceptsQuote: false,
    cannotRepeatWithin: 5,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['group', 'outdoor', 'indoor', 'detail', 'food'],
    slots: [
      slot('l-hero', 'left', 0, 0, 65, 65, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bottom', 'left', 0, 65, 65, 35, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-strip', 'left', 65, 0, 35, 100, { importance: 'secondary', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 52. Cinematic Caption (spanning hero + companion + text) ───────
  {
    id: 'cinematic-caption',
    name: 'קולנועי + כיתוב',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'romantic', 'serene', 'nostalgic', 'tender'],
    bestForScene: ['landscape_scenic', 'portrait', 'outdoor'],
    spanning: true,
    spanningSlotIds: ['top-hero'],
    slots: [
      slot('top-hero', 'left', 0, 0, 100, 58, { importance: 'hero', minQuality: 7, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('bottom-left', 'left', 0, 62, 50, 38, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('bottom-right-photo', 'right', 50, 62, 50, 38, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },
]

// ─── Template Lookup ────────────────────────────────────────────────

const templateMap = new Map(LAYOUT_TEMPLATES.map((t) => [t.id, t]))

export function getTemplate(id: string): LayoutTemplate | undefined {
  return templateMap.get(id)
}

export function getTemplatesByCategory(category: TemplateCategory): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter((t) => t.category === category)
}

/** Templates that can accept a given photo count */
export function getTemplatesForPhotoCount(count: number): LayoutTemplate[] {
  return LAYOUT_TEMPLATES.filter((t) => count >= t.minPhotos && count <= t.maxPhotos)
}

// ─── Sequence Validation ────────────────────────────────────────────

/** Check if using a template at the given position violates repeat rules */
export function isTemplateAllowedAtPosition(
  templateId: string,
  position: number,
  previousTemplateIds: string[],
): boolean {
  const template = getTemplate(templateId)
  if (!template) return false

  const lookback = template.cannotRepeatWithin
  const recentIds = previousTemplateIds.slice(Math.max(0, position - lookback), position)

  if (recentIds.includes(templateId)) return false

  // Check category repetition
  const recentCategories = recentIds
    .map((id) => getTemplate(id)?.category)
    .filter(Boolean) as TemplateCategory[]

  const tail = recentCategories.slice(-PAGE_RULES.maxConsecutiveSameCategory)
  if (tail.length >= PAGE_RULES.maxConsecutiveSameCategory && tail.every((c) => c === template.category)) {
    return false
  }

  return true
}

/** Deterministic fallback sequence when AI is unavailable */
export const FALLBACK_SEQUENCE: string[] = [
  'cover-hero',
  'editorial-hero-mosaic',
  'photo-over-photo',
  'hero-top-grid-bottom',
  'editorial-cinematic',
  'editorial-grid-duo',
  'dynamic-trio',
  'portrait-hero-grid',
  'editorial-magazine',
  'hero-left-grid-right',
  'editorial-stagger-3',
  'l-shape',
  'asymmetric-hero-steps',
  'photo-over-photo-right',
  'portrait-trio',
  'mosaic-5',
  'editorial-hero-mosaic',
  'balanced-4',
  'trio-left-hero-right',
  'grid-3x2',
  'editorial-grid-duo',
  'staggered-grid',
  'detail-grid',
  'hero-left-grid-right',
  'editorial-magazine',
]

/** Get a deterministic template for a given spread index (fallback mode) */
export function getFallbackTemplate(spreadIndex: number, totalSpreads: number): LayoutTemplate {
  if (spreadIndex === 0) return getTemplate('cover-hero')!
  if (spreadIndex === totalSpreads - 1) return getTemplate('closing')!

  const cycleIdx = (spreadIndex - 1) % (FALLBACK_SEQUENCE.length - 1)
  return getTemplate(FALLBACK_SEQUENCE[cycleIdx + 1]) ?? LAYOUT_TEMPLATES[1]
}

// ─── Family-Aware Template Filtering ─────────────────────────────────

const ROLE_TO_CATEGORIES: Record<SpreadRole, TemplateCategory[]> = {
  cover: ['cover'],
  opening: ['hero', 'balanced'],
  hero: ['hero', 'balanced'],
  standard: ['balanced', 'grid', 'hero'],
  grid: ['grid', 'mosaic'],
  breathing: ['text', 'hero'],
  text: ['text'],
  collage: ['mosaic', 'grid'],
  closing: ['closing'],
}

/**
 * Get templates allowed for a given family, optionally filtered by spread role.
 * Preferred templates get weight 2, others get weight 1, avoided get weight 0.
 */
export function getTemplatesForFamily(
  family: DesignFamily,
  role?: SpreadRole,
): { template: LayoutTemplate; weight: number }[] {
  const { preferredTemplates, avoidedTemplates, maxPhotosPerSpread } = family.composition
  const allowedCategories = role ? ROLE_TO_CATEGORIES[role] : undefined

  return LAYOUT_TEMPLATES
    .filter((t) => {
      if (avoidedTemplates.includes(t.id)) return false
      if (t.maxPhotos > maxPhotosPerSpread) return false
      if (t.maxPhotos > family.constraints.maxPhotosHardLimit) return false
      if (allowedCategories && !allowedCategories.includes(t.category)) return false
      return true
    })
    .map((t) => ({
      template: t,
      weight: preferredTemplates.includes(t.id) ? 2 : 1,
    }))
}

/**
 * Pick the best template for a given role and photo count within a family.
 * Used as a deterministic fallback when AI selection fails.
 */
export function pickTemplateForRole(
  family: DesignFamily,
  role: SpreadRole,
  photoCount: number,
  previousTemplateIds: string[],
  position: number,
): LayoutTemplate {
  const candidates = getTemplatesForFamily(family, role)
    .filter(({ template: t }) => photoCount >= t.minPhotos && photoCount <= t.maxPhotos)
    .filter(({ template: t }) => isTemplateAllowedAtPosition(t.id, position, previousTemplateIds))
    .sort((a, b) => b.weight - a.weight)

  if (candidates.length > 0) return candidates[0].template

  return getFallbackTemplate(position, position + 5)
}
