import type { LayoutTemplate, PageRules, SlotDefinition, TemplateCategory, DesignFamily, SpreadRole } from '../types'

// ─── Page Rules (print-safe defaults) ───────────────────────────────

export const PAGE_RULES: PageRules = {
  bleedMm: 3,
  safeMarginMm: 8,
  gutterMm: 0,
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

  // ── 13b. Showcase Single — one stunning photo across the entire spread
  {
    id: 'showcase-single',
    name: 'תמונה מרכזית',
    category: 'hero',
    minPhotos: 1,
    maxPhotos: 1,
    acceptsQuote: false,
    cannotRepeatWithin: 5,
    bestForMood: ['dramatic', 'serene', 'romantic', 'nostalgic', 'tender', 'joyful'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait', 'group', 'detail'],
    spanning: true,
    slots: [
      slot('showcase', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 8, accepts: ['any'], safeZone: SAFE_BLEED,
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

  // ═══════════════════════════════════════════════════════════════════
  // NEW TEMPLATES — Full-spread, 6-photo, spanning, and variety
  // All layouts assume continuous 60×30 cm print (no gutter)
  // ═══════════════════════════════════════════════════════════════════

  // ── 52. Full Bleed Single (reusable full-spread hero) ─────────────
  {
    id: 'full-bleed-single',
    name: 'תמונה מלאה על כל הדף',
    category: 'hero',
    minPhotos: 1,
    maxPhotos: 1,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'serene', 'romantic', 'nostalgic', 'tender'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait', 'group'],
    spanning: true,
    slots: [
      slot('full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 53. Full Spread + Bottom Strip (hero + 3 accents) ─────────────
  {
    id: 'full-spread-bottom-strip',
    name: 'פנורמה + רצועה תחתונה',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'dramatic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['span-hero'],
    slots: [
      slot('span-hero', 'left', 0, 0, 100, 65, {
        importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('strip-1', 'left', 0, 65, 50, 35, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('strip-2', 'left', 50, 65, 50, 35, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('strip-3', 'right', 0, 65, 100, 35, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 54. Full Spread + Corner Accents ──────────────────────────────
  {
    id: 'full-spread-corner-duo',
    name: 'פנורמה + אקסנטים בפינות',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 5,
    bestForMood: ['dramatic', 'romantic', 'serene', 'tender'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait'],
    spanning: true,
    slots: [
      slot('bg-span', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('corner-bl', 'left', 5, 70, 25, 25, {
        importance: 'accent', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('corner-tr', 'right', 70, 5, 25, 25, {
        importance: 'accent', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 55. Cinematic Bars (letterbox hero + side strips) ─────────────
  {
    id: 'cinematic-bars',
    name: 'קולנועי',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 5,
    bestForMood: ['dramatic', 'serene', 'nostalgic', 'romantic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait', 'architecture'],
    spanning: true,
    spanningSlotIds: ['center-hero'],
    slots: [
      slot('top-strip', 'left', 0, 0, 100, 20, {
        importance: 'accent', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('center-hero', 'left', 0, 20, 100, 60, {
        importance: 'hero', minQuality: 7, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-strip', 'right', 0, 80, 100, 20, {
        importance: 'accent', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 56. Duo Full (2 photos, each filling one page) ────────────────
  {
    id: 'duo-full',
    name: 'זוג עמודים מלאים',
    category: 'balanced',
    minPhotos: 2,
    maxPhotos: 2,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'dramatic', 'serene', 'tender', 'joyful'],
    bestForScene: ['portrait', 'outdoor', 'landscape_scenic', 'group'],
    slots: [
      slot('left-full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-full', 'right', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 57. Grid 3×2 Spanning (6 equal cells across both pages) ───────
  {
    id: 'grid-3x2-spanning',
    name: 'רשת 3×2 רציפה',
    category: 'grid',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'food', 'group', 'outdoor', 'indoor'],
    spanning: true,
    slots: [
      slot('tl', 'left', 0, 0, 50, 50, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('tc', 'left', 50, 0, 50, 50, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('tr', 'right', 0, 0, 100, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('bl', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('bc', 'left', 50, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('br', 'right', 0, 50, 100, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 58. Hero Span + 5 Bottom (spanning hero + bottom strip) ───────
  {
    id: 'hero-span-plus-5',
    name: 'ראשית רציפה + 5',
    category: 'hero',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'romantic', 'dramatic', 'nostalgic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['hero-top'],
    slots: [
      slot('hero-top', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('b1', 'left', 0, 55, 33.33, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('b2', 'left', 33.33, 55, 33.34, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('b3', 'left', 66.67, 55, 33.33, 45, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('b4', 'right', 0, 55, 50, 45, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('b5', 'right', 50, 55, 50, 45, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 59. Mosaic 6 Asymmetric (large + stacked + strip) ─────────────
  {
    id: 'mosaic-6-asymmetric',
    name: 'מוזאיקה 6 א-סימטרית',
    category: 'mosaic',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'romantic'],
    bestForScene: ['outdoor', 'group', 'portrait', 'detail'],
    slots: [
      slot('l-big', 'left', 0, 0, 60, 60, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-side-top', 'left', 60, 0, 40, 30, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-side-bot', 'left', 60, 30, 40, 30, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bottom', 'left', 0, 60, 100, 40, { importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('r-top', 'right', 0, 0, 100, 55, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom', 'right', 0, 55, 100, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 60. Editorial 6 Magazine (mirrored tall + stacked) ────────────
  {
    id: 'editorial-6-magazine',
    name: 'מגזין 6 אדיטוריאלי',
    category: 'balanced',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'romantic', 'joyful', 'energetic'],
    bestForScene: ['portrait', 'outdoor', 'group', 'indoor'],
    slots: [
      slot('l-tall', 'left', 0, 0, 40, 100, { importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
      slot('l-top-r', 'left', 40, 0, 60, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bot-r', 'left', 40, 50, 60, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-top-l', 'right', 0, 0, 60, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bot-l', 'right', 0, 50, 60, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tall', 'right', 60, 0, 40, 100, { importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 61. Six Equal Spanning (2 rows × 3 columns across center) ─────
  {
    id: 'six-equal-spanning',
    name: '6 שוות רציפות',
    category: 'grid',
    minPhotos: 6,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'neutral'],
    bestForScene: ['detail', 'food', 'group', 'outdoor', 'indoor'],
    spanning: true,
    slots: [
      slot('r1c1', 'left', 0, 0, 33.33, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r1c2', 'left', 33.33, 0, 33.34, 50, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r1c3', 'left', 66.67, 0, 33.33, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c1', 'right', 0, 50, 33.33, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c2', 'right', 33.33, 50, 33.34, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c3', 'right', 66.67, 50, 33.33, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 62. Hero Left + Five Right (1 hero + 5 grid) ──────────────────
  {
    id: 'hero-left-five-right',
    name: 'ראשית שמאל + 5 ימין',
    category: 'hero',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'detail'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('r-tl', 'right', 0, 0, 50, 33.33, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 33.33, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-ml', 'right', 0, 33.33, 50, 33.34, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-mr', 'right', 50, 33.33, 50, 33.34, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bottom', 'right', 0, 66.67, 100, 33.33, { importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 63. Center Hero + Wings (cross-center hero with side accents) ──
  {
    id: 'center-hero-wings',
    name: 'גיבור מרכזי + כנפיים',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'left-bottom',
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'romantic', 'serene', 'tender'],
    bestForScene: ['portrait', 'outdoor', 'landscape_scenic'],
    spanning: true,
    spanningSlotIds: ['center-span'],
    slots: [
      slot('wing-left', 'left', 0, 0, 20, 100, {
        importance: 'accent', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('center-span', 'left', 20, 0, 80, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('wing-right', 'right', 80, 0, 20, 100, {
        importance: 'accent', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 64. Panoramic Trio (3 horizontal bands spanning both pages) ────
  {
    id: 'panoramic-trio',
    name: 'שלישייה פנורמית',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['serene', 'dramatic', 'nostalgic', 'romantic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'architecture', 'group'],
    spanning: true,
    slots: [
      slot('top-band', 'left', 0, 0, 100, 33, {
        importance: 'primary', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('mid-band', 'left', 0, 33, 100, 34, {
        importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bot-band', 'left', 0, 67, 100, 33, {
        importance: 'secondary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 65. T-Shape Span (spanning top band + 2 tall photos below) ────
  {
    id: 't-shape-span',
    name: 'צורת T רציפה',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'left-bottom',
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'dramatic', 'serene', 'tender'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait', 'group'],
    spanning: true,
    spanningSlotIds: ['top-span'],
    slots: [
      slot('top-span', 'left', 0, 0, 100, 40, {
        importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left', 'left', 0, 40, 100, 60, {
        importance: 'primary', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-right', 'right', 0, 40, 100, 60, {
        importance: 'primary', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 66. Triptych Vertical (3 equal columns spanning both pages) ───
  {
    id: 'triptych-vertical',
    name: 'טריפטיך אנכי',
    category: 'grid',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'serene', 'romantic', 'nostalgic'],
    bestForScene: ['portrait', 'outdoor', 'landscape_scenic', 'architecture'],
    spanning: true,
    slots: [
      slot('col-left', 'left', 0, 0, 50, 100, {
        importance: 'primary', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('col-center', 'left', 50, 0, 50, 100, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('col-right', 'right', 0, 0, 100, 100, {
        importance: 'primary', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 67. Asymmetric Cascade (4 photos, large to small spanning) ────
  {
    id: 'asymmetric-cascade',
    name: 'מפל א-סימטרי',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'energetic', 'joyful', 'romantic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'action'],
    spanning: true,
    spanningSlotIds: ['cascade-hero'],
    slots: [
      slot('cascade-hero', 'left', 0, 0, 100, 55, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('cascade-mid', 'left', 0, 55, 40, 45, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('cascade-small-1', 'left', 40, 55, 60, 45, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('cascade-small-2', 'right', 0, 55, 100, 45, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 68. Filmstrip Horizontal (4-5 photos in a row spanning) ───────
  {
    id: 'filmstrip-horizontal',
    name: 'רצועת פילם',
    category: 'grid',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['nostalgic', 'joyful', 'energetic', 'romantic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'detail', 'action'],
    spanning: true,
    slots: [
      slot('f1', 'left', 0, 15, 50, 70, { importance: 'primary', minQuality: 4, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('f2', 'left', 50, 15, 50, 70, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('f3', 'right', 0, 15, 33.33, 70, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('f4', 'right', 33.33, 15, 33.34, 70, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('f5', 'right', 66.67, 15, 33.33, 70, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 69. Inverted T (2 tall photos top + spanning bottom band) ─────
  {
    id: 'inverted-t-span',
    name: 'T הפוך רציף',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['dramatic', 'romantic', 'serene', 'joyful'],
    bestForScene: ['portrait', 'outdoor', 'landscape_scenic', 'group'],
    spanning: true,
    spanningSlotIds: ['bottom-span'],
    slots: [
      slot('top-left', 'left', 0, 0, 100, 60, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('top-right', 'right', 0, 0, 100, 60, {
        importance: 'primary', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-span', 'left', 0, 60, 100, 40, {
        importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 70. Grid 2×4 (8 equal cells across both pages) ────────────────
  {
    id: 'grid-2x4',
    name: 'רשת 2×4',
    category: 'grid',
    minPhotos: 7,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic', 'neutral'],
    bestForScene: ['detail', 'food', 'group', 'outdoor', 'indoor'],
    spanning: true,
    slots: [
      slot('r1c1', 'left', 0, 0, 25, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r1c2', 'left', 25, 0, 25, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r1c3', 'left', 50, 0, 25, 50, { importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r1c4', 'left', 75, 0, 25, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c1', 'right', 0, 50, 25, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c2', 'right', 25, 50, 25, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c3', 'right', 50, 50, 25, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r2c4', 'right', 75, 50, 25, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 71. Hero Span + Quad Bottom (spanning hero + 4 below) ─────────
  {
    id: 'hero-span-quad',
    name: 'ראשית רציפה + 4',
    category: 'hero',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'romantic', 'dramatic', 'nostalgic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['hero-top'],
    slots: [
      slot('hero-top', 'left', 0, 0, 100, 60, {
        importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('q1', 'left', 0, 60, 50, 40, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('q2', 'left', 50, 60, 50, 40, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('q3', 'right', 0, 60, 50, 40, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('q4', 'right', 50, 60, 50, 40, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 72. Cross Grid 5 (L-shape spanning + accents) ─────────────────
  {
    id: 'cross-grid-5',
    name: 'רשת חוצה 5',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 5,
    acceptsQuote: true,
    quotePosition: 'right-bottom',
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'dramatic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'detail'],
    spanning: true,
    spanningSlotIds: ['span-top'],
    slots: [
      slot('span-top', 'left', 0, 0, 100, 45, {
        importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('mid-left', 'left', 0, 45, 60, 55, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('mid-right-top', 'left', 60, 45, 40, 27.5, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('mid-right-bot', 'left', 60, 72.5, 40, 27.5, {
        importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('r-full', 'right', 0, 45, 100, 55, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
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
  'full-bleed-single',
  'editorial-hero-mosaic',
  'duo-full',
  'hero-top-grid-bottom',
  'panoramic-trio',
  'editorial-grid-duo',
  'full-spread-bottom-strip',
  'dynamic-trio',
  'hero-span-plus-5',
  'portrait-hero-grid',
  't-shape-span',
  'editorial-magazine',
  'filmstrip-horizontal',
  'hero-left-grid-right',
  'triptych-vertical',
  'editorial-stagger-3',
  'center-hero-wings',
  'l-shape',
  'six-equal-spanning',
  'photo-over-photo',
  'editorial-6-magazine',
  'portrait-trio',
  'asymmetric-cascade',
  'mosaic-5',
  'hero-span-quad',
  'balanced-4',
  'inverted-t-span',
  'trio-left-hero-right',
  'grid-3x2-spanning',
  'editorial-grid-duo',
  'cross-grid-5',
  'detail-grid',
  'cinematic-bars',
  'hero-left-grid-right',
  'mosaic-6-asymmetric',
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
