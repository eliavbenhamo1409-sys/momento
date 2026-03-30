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
    maxPhotos: 3,
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
      slot('right-bottom', 'right', 0, 55, 100, 45, {
        importance: 'accent', minQuality: 3, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 2. Hero Left + Grid Right ─────────────────────────────────────
  {
    id: 'hero-left-grid-right',
    name: 'תמונה ראשית + רשת',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 4,
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
      slot('right-bottom', 'right', 0, 50, 100, 50, {
        importance: 'secondary', minQuality: 3, accepts: ['landscape', 'any'],
      }),
    ],
  },

  // ── 3. Hero Right + Stack Left ────────────────────────────────────
  {
    id: 'hero-right-stack-left',
    name: 'תמונה ראשית ימין + שתיים שמאל',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['energetic', 'joyful', 'dramatic'],
    bestForScene: ['action', 'group', 'outdoor'],
    slots: [
      slot('left-top', 'left', 0, 0, 100, 50, {
        importance: 'primary', minQuality: 5, accepts: ['landscape', 'any'],
      }),
      slot('left-bottom', 'left', 0, 50, 100, 50, {
        importance: 'secondary', minQuality: 4, accepts: ['landscape', 'any'],
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
    maxPhotos: 4,
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
      slot('left-bottom', 'left', 0, 50, 100, 50, {
        importance: 'primary', minQuality: 4, accepts: ['landscape', 'any'],
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
    maxPhotos: 5,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'food', 'indoor', 'outdoor'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 65, {
        importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'],
      }),
      slot('left-accent', 'left', 0, 65, 100, 35, {
        importance: 'accent', minQuality: 3, accepts: ['landscape', 'any'],
      }),
      slot('right-top-left', 'right', 0, 0, 50, 50, {
        importance: 'primary', accepts: ['any'],
      }),
      slot('right-top-right', 'right', 50, 0, 50, 50, {
        importance: 'secondary', accepts: ['any'],
      }),
      slot('right-bottom', 'right', 0, 50, 100, 50, {
        importance: 'primary', minQuality: 4, accepts: ['landscape', 'any'],
      }),
    ],
  },

  // ── 6. Full Bleed Left + Quote Right ──────────────────────────────
  {
    id: 'full-bleed-quote',
    name: 'תמונה מלאה + ציטוט',
    category: 'text',
    minPhotos: 2,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 4,
    bestForMood: ['romantic', 'serene', 'nostalgic', 'dramatic'],
    bestForScene: ['landscape_scenic', 'portrait', 'outdoor'],
    slots: [
      slot('left-full', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top', 'right', 0, 0, 100, 50, {
        importance: 'primary', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom', 'right', 0, 50, 100, 50, {
        importance: 'accent', minQuality: 3, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 7. Panoramic (split across left + right pages) ────────────────
  {
    id: 'panoramic',
    name: 'פנורמה',
    category: 'hero',
    minPhotos: 2,
    maxPhotos: 3,
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
      slot('right-bottom', 'right', 0, 55, 100, 45, {
        importance: 'secondary', minQuality: 3, accepts: ['landscape', 'any'],
      }),
    ],
  },

  // ── 8. Trio Left + Hero Right ─────────────────────────────────────
  {
    id: 'trio-left-hero-right',
    name: 'שלישיה + ראשית',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: true,
    quotePosition: 'left-bottom',
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'tender', 'energetic'],
    bestForScene: ['group', 'detail', 'indoor'],
    slots: [
      slot('left-top', 'left', 0, 0, 100, 33, {
        importance: 'secondary', accepts: ['landscape', 'any'],
      }),
      slot('left-mid', 'left', 0, 33, 100, 34, {
        importance: 'primary', minQuality: 5, accepts: ['landscape', 'any'],
      }),
      slot('left-bottom', 'left', 0, 67, 100, 33, {
        importance: 'secondary', accepts: ['landscape', 'any'],
      }),
      slot('right-hero', 'right', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'],
      }),
    ],
  },

  // ── 9. Detail Grid (6 photos) ────────────────────────────────────
  {
    id: 'detail-grid',
    name: 'רשת פרטים',
    category: 'grid',
    minPhotos: 5,
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'nostalgic', 'neutral'],
    bestForScene: ['detail', 'food', 'indoor'],
    slots: [
      slot('left-top-l', 'left', 0, 0, 50, 50, { importance: 'secondary', accepts: ['any'] }),
      slot('left-top-r', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'] }),
      slot('left-bottom', 'left', 0, 50, 100, 50, { importance: 'primary', minQuality: 4, accepts: ['landscape', 'any'] }),
      slot('right-top', 'right', 0, 0, 100, 50, { importance: 'primary', minQuality: 4, accepts: ['landscape', 'any'] }),
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
    maxPhotos: 4,
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
      slot('right-bottom', 'right', 0, 50, 100, 50, {
        importance: 'accent', accepts: ['landscape', 'any'],
      }),
    ],
  },

  // ── 11. Text Heavy (chapter divider) ──────────────────────────────
  {
    id: 'text-heavy',
    name: 'חלוקת פרקים',
    category: 'text',
    minPhotos: 1,
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
    minPhotos: 1,
    maxPhotos: 3,
    acceptsQuote: true,
    quotePosition: 'right-center',
    cannotRepeatWithin: 999,
    bestForMood: ['romantic', 'serene', 'nostalgic', 'tender'],
    bestForScene: ['portrait', 'landscape_scenic', 'outdoor'],
    slots: [
      slot('closing-main', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-feature', 'right', 0, 0, 100, 60, {
        importance: 'primary', minQuality: 4, accepts: ['any'],
      }),
      slot('right-accent', 'right', 0, 60, 100, 40, {
        importance: 'accent', minQuality: 3, accepts: ['any'],
      }),
    ],
  },

  // ── 13. Full Spread (1 landscape photo across both pages) ──────
  {
    id: 'full-spread',
    name: 'פנורמה מלאה',
    category: 'hero',
    minPhotos: 1,
    maxPhotos: 1,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['dramatic', 'serene', 'romantic', 'nostalgic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'portrait'],
    spanning: true,
    slots: [
      slot('full-span', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 7, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 14. Three Rows (spread divided into 3 horizontal strips) ───
  {
    id: 'three-rows',
    name: 'שלושה פסים',
    category: 'grid',
    minPhotos: 3,
    maxPhotos: 3,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'landscape_scenic'],
    spanning: true,
    slots: [
      slot('row-top', 'left', 0, 0, 100, 33.33, {
        importance: 'primary', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('row-mid', 'left', 0, 33.33, 100, 33.34, {
        importance: 'hero', minQuality: 5, accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('row-bot', 'left', 0, 66.67, 100, 33.33, {
        importance: 'secondary', minQuality: 4, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
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
    maxPhotos: 6,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'food', 'indoor', 'outdoor'],
    slots: [
      slot('l-tl', 'left', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-b', 'left', 0, 50, 100, 50, { importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('r-t', 'right', 0, 0, 100, 50, { importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
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

  // ── 19. Portrait Hero + Grid (1 large portrait + 2-3 smaller) ──
  {
    id: 'portrait-hero-grid',
    name: 'אורכית ראשית + רשת',
    category: 'hero',
    minPhotos: 3,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'dramatic', 'tender', 'joyful'],
    bestForScene: ['portrait', 'outdoor', 'group'],
    slots: [
      slot('left-hero', 'left', 0, 0, 100, 100, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top', 'right', 0, 0, 50, 50, {
        importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-top-right', 'right', 50, 0, 50, 50, {
        importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED,
      }),
      slot('right-bottom', 'right', 0, 50, 100, 50, {
        importance: 'accent', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 20. Mixed Top-Bottom (landscape top + portraits bottom) ────
  {
    id: 'mixed-top-bottom',
    name: 'רוחבית למעלה + אורכיות למטה',
    category: 'balanced',
    minPhotos: 3,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['joyful', 'romantic', 'nostalgic', 'energetic'],
    bestForScene: ['outdoor', 'landscape_scenic', 'group', 'portrait'],
    spanning: true,
    spanningSlotIds: ['top-landscape'],
    slots: [
      slot('top-landscape', 'left', 0, 0, 100, 40, {
        importance: 'hero', minQuality: 5, accepts: ['landscape'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left', 'left', 0, 40, 50, 60, {
        importance: 'primary', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-left-right', 'left', 50, 40, 50, 60, {
        importance: 'secondary', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-right', 'right', 0, 40, 100, 60, {
        importance: 'accent', accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
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
    name: 'רשת 4+3',
    category: 'grid',
    minPhotos: 7,
    maxPhotos: 7,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'outdoor', 'indoor'],
    slots: [
      slot('l-tl', 'left', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-top', 'right', 0, 0, 100, 33.33, { importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('r-mid', 'right', 0, 33.33, 100, 33.34, { importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('r-bot', 'right', 0, 66.67, 100, 33.33, { importance: 'secondary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 25. Grid 4+4 (8 photos) ─────────────────────────────────────
  {
    id: 'grid-4-4',
    name: 'רשת 4+4',
    category: 'grid',
    minPhotos: 8,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 4,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['detail', 'group', 'outdoor', 'indoor', 'food'],
    slots: [
      slot('l-tl', 'left', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-tr', 'left', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
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
      slot('l-hero', 'left', 0, 0, 100, 60, { importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 60, 50, 40, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 50, 60, 50, 40, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tl', 'right', 0, 0, 50, 50, { importance: 'primary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-tr', 'right', 50, 0, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-bl', 'right', 0, 50, 50, 50, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('r-br', 'right', 50, 50, 50, 50, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
    ],
  },

  // ── 27. Hero + 7 Grid (8 photos with hero) ──────────────────────
  {
    id: 'hero-plus-7',
    name: 'ראשית + 7',
    category: 'hero',
    minPhotos: 8,
    maxPhotos: 8,
    acceptsQuote: false,
    cannotRepeatWithin: 5,
    bestForMood: ['joyful', 'energetic', 'nostalgic'],
    bestForScene: ['group', 'outdoor', 'detail', 'food'],
    slots: [
      slot('l-hero', 'left', 0, 0, 100, 55, { importance: 'hero', minQuality: 6, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED }),
      slot('l-bl', 'left', 0, 55, 33.33, 45, { importance: 'secondary', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-bm', 'left', 33.33, 55, 33.34, 45, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
      slot('l-br', 'left', 66.67, 55, 33.33, 45, { importance: 'accent', accepts: ['any'], safeZone: SAFE_BLEED }),
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
        importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
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
        importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 30. Cross Diagonal (small landscapes + tall rectangles) ────────
  {
    id: 'cross-diagonal',
    name: 'קרוס אלכסוני',
    category: 'balanced',
    minPhotos: 4,
    maxPhotos: 4,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['romantic', 'dramatic', 'energetic', 'nostalgic'],
    bestForScene: ['outdoor', 'portrait', 'group', 'landscape_scenic'],
    slots: [
      slot('tl-landscape', 'left', 0, 0, 55, 42, {
        importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('tr-tall', 'left', 55, 0, 45, 100, {
        importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bl-tall', 'right', 0, 0, 45, 100, {
        importance: 'hero', minQuality: 5, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('br-landscape', 'right', 45, 58, 55, 42, {
        importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
    ],
  },

  // ── 31. Single Portrait Full Page ──────────────────────────────────
  {
    id: 'single-portrait',
    name: 'תמונה אורכית מלאה',
    category: 'hero',
    minPhotos: 1,
    maxPhotos: 1,
    acceptsQuote: false,
    cannotRepeatWithin: 3,
    bestForMood: ['dramatic', 'romantic', 'tender', 'serene'],
    bestForScene: ['portrait', 'outdoor', 'indoor'],
    slots: [
      slot('portrait-full', 'left', 10, 0, 80, 100, {
        importance: 'hero', minQuality: 6, accepts: ['portrait', 'any'], safeZone: SAFE_BLEED,
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
    cannotRepeatWithin: 2,
    bestForMood: ['serene', 'nostalgic', 'romantic', 'dramatic'],
    bestForScene: ['landscape_scenic', 'outdoor', 'group'],
    spanning: true,
    spanningSlotIds: ['top-landscape', 'bottom-landscape'],
    slots: [
      slot('top-landscape', 'left', 0, 0, 100, 48, {
        importance: 'hero', minQuality: 5, accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
      }),
      slot('bottom-landscape', 'left', 0, 52, 100, 48, {
        importance: 'primary', accepts: ['landscape', 'any'], safeZone: SAFE_BLEED,
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
  'detail-grid',
  'portrait-grid-4',
  'hero-top-grid-bottom',
  'portrait-duo',
  'grid-3x2',
  'mosaic-5',
  'full-spread',
  'portrait-hero-grid',
  'hero-left-grid-right',
  'portrait-5',
  'detail-grid',
  'three-rows',
  'mixed-top-bottom',
  'portrait-trio',
  'grid-2x2',
  'hero-top-grid-bottom',
  'portrait-6',
  'trio-left-hero-right',
  'grid-3x2',
  'mosaic-5',
  'balanced-4',
  'portrait-grid-4',
  'detail-grid',
  'full-spread',
  'hero-left-grid-right',
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
