import type { DesignFamily } from '../types'

// ─── 1. Contemporary Luxury Studio ──────────────────────────────────

const contemporaryLuxury: DesignFamily = {
  id: 'contemporary-luxury',
  name: 'Contemporary Luxury',
  nameHe: 'יוקרה מודרנית',
  description: 'Clean lines, generous whitespace, premium feel. Studio-quality with confident restraint.',
  descriptionHe: 'קווים נקיים, רווח נדיב, תחושת פרימיום. איכות סטודיו עם ריסון בטוח.',

  bestForType: ['wedding', 'portrait', 'family', 'newborn'],
  bestForMood: ['romantic', 'serene', 'dramatic', 'tender'],
  bestForStyle: ['modern', 'minimal', 'elegant'],

  spacing: {
    pageMarginPercent: 8,
    photoGapPx: 12,
    whiteSpaceRatio: 0.35,
    breathingRoom: 'generous',
    asymmetric: false,
  },

  typography: {
    quoteFont: 'Great Vibes',
    quoteWeight: 400,
    quoteSizeClass: 'text-xl',
    quoteItalic: false,
    quoteLineHeight: 1.6,
    quoteLetterSpacing: '0.01em',
    quoteAlign: 'center',
    captionFont: 'Plus Jakarta Sans',
    captionWeight: 400,
    captionSizeClass: 'text-[10px]',
  },

  composition: {
    symmetry: 'balanced',
    density: 'moderate',
    preferredTemplates: [
      'hero-left-grid-right',
      'hero-right-stack-left',
      'balanced-4',
      'full-bleed-quote',
      'panoramic',
      'portrait-trio',
      'portrait-hero-grid',
      'three-rows',
      'hero-top-grid-bottom',
      'mixed-top-bottom',
      'trio-left-hero-right',
      'full-spread',
    ],
    avoidedTemplates: [],
    maxPhotosPerSpread: 5,
    heroFrequency: 3,
  },

  photoFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 2,
    shadow: '0 2px 12px rgba(45,40,35,0.08)',
    rotationRange: [0, 0],
    innerPadding: 6,
  },

  slotFrameOverrides: {
    hero: {
      shadow: '0 4px 20px rgba(45,40,35,0.12)',
      borderRadius: 3,
      innerPadding: 10,
    },
    primary: {
      shadow: '0 2px 10px rgba(45,40,35,0.07)',
      innerPadding: 6,
    },
    accent: {
      borderRadius: 4,
      shadow: '0 1px 6px rgba(45,40,35,0.05)',
      innerPadding: 4,
    },
  },

  background: {
    color: '#F5EDE4',
    allowPhotoBlur: true,
    photoBlurOpacity: 0.06,
    photoBlurPx: 60,
    allowTexture: true,
    textureType: 'paper',
    textureOpacity: 0.015,
  },

  decorative: {
    philosophy: 'minimal',
    quoteMarks: 'simple',
    dividers: 'thin-line',
    cornerOrnaments: false,
    scriptOverlays: {
      words: ['Moments', 'Love', 'Forever', 'Cherish', 'Together'],
      font: 'Great Vibes',
      weight: 400,
      sizeRange: [28, 58],
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover', 'opening', 'grid', 'collage'],
      placements: ['corner', 'behind-photo'],
      color: '#C8C0B4',
      opacity: 0.25,
      italic: false,
    },
    accentLines: true,
    accentLineColor: 'rgba(180,175,165,0.25)',
    gradientWash: {
      type: 'radial',
      color: '#E8E4DD',
      opacity: 0.35,
      position: 'top-right',
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover'],
    },
    flourishes: true,
    flourishColor: 'rgba(200,192,180,0.38)',
  },

  palette: {
    background: '#F5EDE4',
    surface: '#FAF4ED',
    accent: '#9E9686',
    text: '#2D2823',
    textMuted: '#A09A92',
    border: 'rgba(45,40,35,0.06)',
  },

  rhythm: {
    pace: 'medium',
    quoteEveryN: 3,
    breathingSpreadEveryN: 4,
    fullBleedEveryN: 5,
  },

  layoutBehavior: {
    canOffsetPhotos: false,
    canOverlapPhotos: false,
    canRotatePhotos: false,
    canBreakGrid: false,
    preferredQuotePlacement: ['center', 'sidebar'],
  },

  textBehavior: {
    showCaptions: false,
    showDates: false,
    showLocationLabels: false,
    quoteMaxLength: 80,
    textDensity: 'low',
  },

  spreadRoles: {
    cover: {
      backgroundOverride: {
        allowPhotoBlur: true,
        photoBlurOpacity: 0.04,
        photoBlurPx: 80,
      },
      frameOverride: {
        shadow: 'none',
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 15,
        whiteSpaceRatio: 0.55,
      },
      frameOverride: {
        shadow: '0 6px 28px rgba(45,40,35,0.10)',
      },
    },
    closing: {
      spacingOverride: {
        pageMarginPercent: 12,
      },
      typographyOverride: {
        quoteSizeClass: 'text-xl',
        quoteWeight: 300,
      },
    },
  },

  constraints: {
    forbidDarkBackgrounds: true,
    maxPhotosHardLimit: 5,
    requireSymmetryOnCover: true,
    avoidFaceNearGutter: true,
    minPhotoQualityForHero: 6,
  },
}

// ─── 2. Japanese Airy Minimal ───────────────────────────────────────

const japaneseAiry: DesignFamily = {
  id: 'japanese-airy',
  name: 'Japanese Airy Minimal',
  nameHe: 'מינימל יפני',
  description: 'Ma (negative space) as a design element. Asymmetric, airy, intentionally sparse.',
  descriptionHe: 'שטח ריק כאלמנט עיצובי. א-סימטרי, אוורירי, דליל במכוון.',

  bestForType: ['travel', 'portrait', 'art', 'nature'],
  bestForMood: ['serene', 'nostalgic', 'tender'],
  bestForStyle: ['minimal', 'artistic', 'zen'],

  spacing: {
    pageMarginPercent: 14,
    photoGapPx: 20,
    whiteSpaceRatio: 0.50,
    breathingRoom: 'airy',
    asymmetric: true,
  },

  typography: {
    quoteFont: 'Dancing Script',
    quoteWeight: 400,
    quoteSizeClass: 'text-lg',
    quoteItalic: false,
    quoteLineHeight: 1.7,
    quoteLetterSpacing: '0.02em',
    quoteAlign: 'center',
    captionFont: 'Plus Jakarta Sans',
    captionWeight: 300,
    captionSizeClass: 'text-[9px]',
  },

  composition: {
    symmetry: 'asymmetric',
    density: 'sparse',
    preferredTemplates: [
      'panoramic',
      'full-bleed-quote',
      'hero-left-grid-right',
      'hero-right-stack-left',
      'balanced-4',
      'portrait-trio',
      'full-spread',
      'three-rows',
      'trio-left-hero-right',
    ],
    avoidedTemplates: ['detail-grid', 'mosaic-5'],
    maxPhotosPerSpread: 4,
    heroFrequency: 2,
  },

  photoFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    shadow: 'none',
    rotationRange: [0, 0],
    innerPadding: 8,
  },

  slotFrameOverrides: {
    hero: {
      shadow: 'none',
      innerPadding: 12,
    },
    secondary: {
      borderWidth: 0.5,
      borderColor: 'rgba(160,155,145,0.15)',
      innerPadding: 6,
    },
    accent: {
      innerPadding: 4,
    },
  },

  background: {
    color: '#F0EDE8',
    allowPhotoBlur: false,
    photoBlurOpacity: 0,
    photoBlurPx: 0,
    allowTexture: true,
    textureType: 'paper',
    textureOpacity: 0.03,
  },

  decorative: {
    philosophy: 'none',
    quoteMarks: 'none',
    dividers: 'none',
    cornerOrnaments: false,
    scriptOverlays: {
      words: ['Breathe', 'Still', 'Light', 'Silence'],
      font: 'Dancing Script',
      weight: 400,
      sizeRange: [22, 46],
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover', 'opening', 'grid', 'collage'],
      placements: ['page-edge'],
      color: '#D0CCC5',
      opacity: 0.25,
      italic: false,
    },
    accentLines: true,
    accentLineColor: 'rgba(180,175,168,0.25)',
    gradientWash: {
      type: 'radial',
      color: '#E5DDD4',
      opacity: 0.25,
      position: 'top-right',
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover'],
    },
    flourishes: false,
  },

  palette: {
    background: '#F0EDE8',
    surface: '#F6F4F0',
    accent: '#B5AFA5',
    text: '#3A3530',
    textMuted: '#C0BBB3',
    border: 'rgba(160,155,145,0.08)',
  },

  rhythm: {
    pace: 'slow',
    quoteEveryN: 4,
    breathingSpreadEveryN: 3,
    fullBleedEveryN: 4,
  },

  layoutBehavior: {
    canOffsetPhotos: true,
    canOverlapPhotos: false,
    canRotatePhotos: false,
    canBreakGrid: true,
    preferredQuotePlacement: ['corner', 'floating'],
  },

  textBehavior: {
    showCaptions: false,
    showDates: false,
    showLocationLabels: false,
    quoteMaxLength: 50,
    textDensity: 'low',
  },

  spreadRoles: {
    cover: {
      spacingOverride: {
        pageMarginPercent: 20,
        whiteSpaceRatio: 0.6,
      },
      frameOverride: {
        shadow: 'none',
        borderWidth: 0,
      },
    },
    opening: {
      spacingOverride: {
        pageMarginPercent: 18,
        whiteSpaceRatio: 0.55,
        breathingRoom: 'airy',
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 22,
        whiteSpaceRatio: 0.65,
      },
    },
    hero: {
      spacingOverride: {
        pageMarginPercent: 10,
      },
    },
    closing: {
      spacingOverride: {
        pageMarginPercent: 20,
        whiteSpaceRatio: 0.6,
      },
      typographyOverride: {
        quoteLetterSpacing: '0.08em',
      },
    },
  },

  constraints: {
    forbidDarkBackgrounds: true,
    maxPhotosHardLimit: 3,
    requireSymmetryOnCover: false,
    avoidFaceNearGutter: true,
    minPhotoQualityForHero: 7,
  },
}

// ─── 3. Parisian Editorial Romance ──────────────────────────────────

const parisianEditorial: DesignFamily = {
  id: 'parisian-editorial',
  name: 'Parisian Editorial Romance',
  nameHe: 'רומנטיקה אדיטוריאלית',
  description: 'Magazine-editorial energy. Slight rotations, overlaps, bold captions, cinematic drama.',
  descriptionHe: 'אנרגיה של מגזין יוקרה. סיבובים עדינים, חפיפות, כותרות נועזות, דרמה קולנועית.',

  bestForType: ['wedding', 'couple', 'event', 'fashion'],
  bestForMood: ['romantic', 'dramatic', 'energetic', 'joyful'],
  bestForStyle: ['editorial', 'romantic', 'cinematic'],

  spacing: {
    pageMarginPercent: 5,
    photoGapPx: 6,
    whiteSpaceRatio: 0.20,
    breathingRoom: 'tight',
    asymmetric: true,
  },

  typography: {
    quoteFont: 'Great Vibes',
    quoteWeight: 400,
    quoteSizeClass: 'text-2xl',
    quoteItalic: false,
    quoteLineHeight: 1.5,
    quoteLetterSpacing: '0.01em',
    quoteAlign: 'center',
    captionFont: 'Plus Jakarta Sans',
    captionWeight: 500,
    captionSizeClass: 'text-[11px]',
  },

  composition: {
    symmetry: 'dynamic',
    density: 'dense',
    preferredTemplates: [
      'hero-left-grid-right',
      'hero-right-stack-left',
      'mosaic-5',
      'trio-left-hero-right',
      'detail-grid',
      'full-bleed-quote',
      'hero-top-grid-bottom',
      'grid-3x2',
      'mixed-top-bottom',
      'portrait-hero-grid',
      'portrait-trio',
      'three-rows',
      'grid-2x2',
      'balanced-4',
      'portrait-grid-4',
    ],
    avoidedTemplates: [],
    maxPhotosPerSpread: 6,
    heroFrequency: 3,
  },

  photoFrame: {
    borderWidth: 1,
    borderColor: 'rgba(180,170,155,0.25)',
    borderRadius: 2,
    shadow: '0 2px 8px rgba(0,0,0,0.08)',
    rotationRange: [-1.5, 1.5],
    innerPadding: 5,
  },

  slotFrameOverrides: {
    hero: {
      borderWidth: 0,
      shadow: 'none',
      borderRadius: 0,
      rotationRange: [0, 0],
      innerPadding: 10,
    },
    primary: {
      borderWidth: 1,
      borderColor: '#D4C9BE',
      borderRadius: 2,
      innerPadding: 6,
    },
    secondary: {
      innerPadding: 8,
      shadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderColor: '#E8E2D8',
      rotationRange: [-1, 1.5],
    },
    accent: {
      borderWidth: 0,
      borderRadius: 6,
      shadow: '0 1px 4px rgba(0,0,0,0.06)',
      innerPadding: 4,
    },
  },

  background: {
    color: '#F2E8DF',
    allowPhotoBlur: true,
    photoBlurOpacity: 0.10,
    photoBlurPx: 40,
    allowTexture: true,
    textureType: 'linen',
    textureOpacity: 0.04,
  },

  decorative: {
    philosophy: 'subtle',
    quoteMarks: 'elegant',
    dividers: 'thin-line',
    cornerOrnaments: false,
    scriptOverlays: {
      words: ['Amour', 'Rêve', 'Belle', 'Toujours', 'Mon Coeur', 'La Vie'],
      font: 'Great Vibes',
      weight: 400,
      sizeRange: [32, 66],
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover', 'opening', 'grid', 'collage'],
      placements: ['behind-photo', 'corner', 'page-edge', 'centered'],
      color: '#D4C5B5',
      opacity: 0.25,
      italic: false,
    },
    accentLines: true,
    accentLineColor: 'rgba(200,185,168,0.25)',
    gradientWash: {
      type: 'radial',
      color: '#EDE4D8',
      opacity: 0.4,
      position: 'bottom-right',
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover'],
    },
    flourishes: true,
    flourishColor: 'rgba(212,197,181,0.38)',
  },

  palette: {
    background: '#F2E8DF',
    surface: '#F7F1EA',
    accent: '#C4AD9A',
    text: '#2A2420',
    textMuted: '#9A8E82',
    border: 'rgba(196,173,154,0.16)',
  },

  rhythm: {
    pace: 'fast',
    quoteEveryN: 3,
    breathingSpreadEveryN: 5,
    fullBleedEveryN: 4,
  },

  layoutBehavior: {
    canOffsetPhotos: true,
    canOverlapPhotos: true,
    canRotatePhotos: true,
    canBreakGrid: true,
    preferredQuotePlacement: ['sidebar', 'floating', 'corner'],
  },

  textBehavior: {
    showCaptions: true,
    showDates: true,
    showLocationLabels: false,
    quoteMaxLength: 120,
    textDensity: 'medium',
  },

  spreadRoles: {
    cover: {
      backgroundOverride: {
        allowPhotoBlur: true,
        photoBlurOpacity: 0.08,
      },
      frameOverride: {
        borderWidth: 0,
        shadow: 'none',
        rotationRange: [0, 0],
      },
      typographyOverride: {
        quoteSizeClass: 'text-2xl',
        quoteWeight: 700,
      },
    },
    hero: {
      frameOverride: {
        borderWidth: 0,
        shadow: 'none',
        borderRadius: 0,
      },
    },
    collage: {
      spacingOverride: {
        photoGapPx: 4,
      },
      frameOverride: {
        rotationRange: [-2, 2],
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 12,
        whiteSpaceRatio: 0.45,
      },
      decorativeOverride: {
        dividers: 'ornamental',
      },
    },
    closing: {
      typographyOverride: {
        quoteSizeClass: 'text-2xl',
        quoteItalic: true,
        quoteWeight: 300,
      },
    },
  },

  constraints: {
    forbidDarkBackgrounds: false,
    maxPhotosHardLimit: 6,
    requireSymmetryOnCover: false,
    avoidFaceNearGutter: true,
    minPhotoQualityForHero: 6,
  },
}

// ─── 4. Timeless Classic Wedding ────────────────────────────────────

const timelessClassic: DesignFamily = {
  id: 'timeless-classic',
  name: 'Timeless Classic',
  nameHe: 'קלאסי נצחי',
  description: 'Formal symmetry, elegant frames, traditional album craft. Never goes out of style.',
  descriptionHe: 'סימטריה רשמית, מסגרות אלגנטיות, עבודת אלבום מסורתית. לא יוצא מהאופנה.',

  bestForType: ['wedding', 'bar_mitzvah', 'family', 'memorial'],
  bestForMood: ['romantic', 'tender', 'nostalgic', 'serene'],
  bestForStyle: ['classic', 'traditional', 'elegant'],

  spacing: {
    pageMarginPercent: 10,
    photoGapPx: 14,
    whiteSpaceRatio: 0.30,
    breathingRoom: 'normal',
    asymmetric: false,
  },

  typography: {
    quoteFont: 'Great Vibes',
    quoteWeight: 400,
    quoteSizeClass: 'text-xl',
    quoteItalic: false,
    quoteLineHeight: 1.6,
    quoteLetterSpacing: '0.02em',
    quoteAlign: 'center',
    captionFont: 'Plus Jakarta Sans',
    captionWeight: 400,
    captionSizeClass: 'text-[10px]',
  },

  composition: {
    symmetry: 'strict',
    density: 'moderate',
    preferredTemplates: [
      'balanced-4',
      'hero-left-grid-right',
      'hero-right-stack-left',
      'grid-2x2',
      'trio-left-hero-right',
      'full-bleed-quote',
      'text-heavy',
      'panoramic',
      'portrait-trio',
      'portrait-hero-grid',
      'hero-top-grid-bottom',
      'three-rows',
      'mixed-top-bottom',
      'full-spread',
    ],
    avoidedTemplates: [],
    maxPhotosPerSpread: 5,
    heroFrequency: 3,
  },

  photoFrame: {
    borderWidth: 1,
    borderColor: 'rgba(180,175,165,0.30)',
    borderRadius: 3,
    shadow: '0 1px 6px rgba(45,40,35,0.06)',
    rotationRange: [0, 0],
    innerPadding: 8,
  },

  slotFrameOverrides: {
    hero: {
      borderWidth: 2,
      borderColor: 'rgba(180,175,165,0.35)',
      shadow: '0 3px 14px rgba(45,40,35,0.10)',
      innerPadding: 12,
    },
    primary: {
      borderWidth: 1,
      innerPadding: 8,
    },
    secondary: {
      innerPadding: 6,
    },
    accent: {
      borderRadius: 4,
      innerPadding: 4,
    },
  },

  background: {
    color: '#EDE6DC',
    allowPhotoBlur: true,
    photoBlurOpacity: 0.04,
    photoBlurPx: 70,
    allowTexture: true,
    textureType: 'linen',
    textureOpacity: 0.025,
  },

  decorative: {
    philosophy: 'subtle',
    quoteMarks: 'serif-large',
    dividers: 'ornamental',
    cornerOrnaments: true,
    scriptOverlays: {
      words: ['Forever', 'Beloved', 'Eternal', 'Devotion', 'Our Story'],
      font: 'Great Vibes',
      weight: 400,
      sizeRange: [26, 54],
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover', 'opening', 'grid', 'collage'],
      placements: ['centered', 'corner'],
      color: '#C8BBA8',
      opacity: 0.25,
      italic: false,
    },
    accentLines: true,
    accentLineColor: 'rgba(180,175,165,0.25)',
    gradientWash: {
      type: 'radial',
      color: '#F0E8DD',
      opacity: 0.3,
      position: 'center',
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover'],
    },
    flourishes: true,
    flourishColor: 'rgba(200,187,168,0.38)',
  },

  palette: {
    background: '#EDE6DC',
    surface: '#F3EEE8',
    accent: '#BFB09E',
    text: '#2D2823',
    textMuted: '#A09788',
    border: 'rgba(191,176,158,0.20)',
  },

  rhythm: {
    pace: 'medium',
    quoteEveryN: 3,
    breathingSpreadEveryN: 4,
    fullBleedEveryN: 5,
  },

  layoutBehavior: {
    canOffsetPhotos: false,
    canOverlapPhotos: false,
    canRotatePhotos: false,
    canBreakGrid: false,
    preferredQuotePlacement: ['center'],
  },

  textBehavior: {
    showCaptions: true,
    showDates: true,
    showLocationLabels: true,
    quoteMaxLength: 100,
    textDensity: 'medium',
  },

  spreadRoles: {
    cover: {
      spacingOverride: {
        pageMarginPercent: 12,
      },
      frameOverride: {
        borderWidth: 3,
        borderColor: 'rgba(180,175,165,0.30)',
        innerPadding: 8,
        shadow: '0 4px 18px rgba(45,40,35,0.10)',
      },
      decorativeOverride: {
        cornerOrnaments: true,
      },
    },
    hero: {
      frameOverride: {
        borderWidth: 2,
        innerPadding: 6,
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 16,
        whiteSpaceRatio: 0.50,
      },
    },
    closing: {
      decorativeOverride: {
        cornerOrnaments: true,
        dividers: 'ornamental',
      },
      typographyOverride: {
        quoteSizeClass: 'text-lg',
        quoteItalic: true,
      },
    },
  },

  constraints: {
    forbidDarkBackgrounds: true,
    maxPhotosHardLimit: 5,
    requireSymmetryOnCover: true,
    avoidFaceNearGutter: true,
    minPhotoQualityForHero: 6,
  },
}

// ─── 5. Soft Personal (Rounded, Airy, Scrapbook-Modern) ─────────────

const softPersonal: DesignFamily = {
  id: 'soft-personal',
  name: 'Soft Personal',
  nameHe: 'רך ואישי',
  description: 'Generous whitespace, rounded photo corners, mat-style framing. Feels handcrafted and intimate — room to breathe and room to write.',
  descriptionHe: 'מרווח נדיב, פינות מעוגלות, מסגור סטייל מט. מרגיש אישי ואינטימי — מקום לנשום ומקום לכתוב.',

  bestForType: ['wedding', 'family', 'newborn', 'travel', 'portrait', 'couple', 'general'],
  bestForMood: ['tender', 'serene', 'nostalgic', 'romantic', 'joyful'],
  bestForStyle: ['personal', 'cozy', 'modern', 'minimal', 'scrapbook'],

  spacing: {
    pageMarginPercent: 14,
    photoGapPx: 18,
    whiteSpaceRatio: 0.48,
    breathingRoom: 'airy',
    asymmetric: false,
  },

  typography: {
    quoteFont: 'Dancing Script',
    quoteWeight: 400,
    quoteSizeClass: 'text-lg',
    quoteItalic: false,
    quoteLineHeight: 1.7,
    quoteLetterSpacing: '0.015em',
    quoteAlign: 'center',
    captionFont: 'Plus Jakarta Sans',
    captionWeight: 400,
    captionSizeClass: 'text-[10px]',
  },

  composition: {
    symmetry: 'balanced',
    density: 'sparse',
    preferredTemplates: [
      'hero-left-grid-right',
      'hero-right-stack-left',
      'balanced-4',
      'panoramic',
      'full-bleed-quote',
      'portrait-trio',
      'portrait-hero-grid',
      'full-spread',
      'three-rows',
      'hero-top-grid-bottom',
      'trio-left-hero-right',
      'mixed-top-bottom',
    ],
    avoidedTemplates: ['detail-grid', 'mosaic-5'],
    maxPhotosPerSpread: 5,
    heroFrequency: 3,
  },

  photoFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 14,
    shadow: '0 2px 16px rgba(45,40,35,0.07)',
    rotationRange: [0, 0],
    innerPadding: 10,
  },

  slotFrameOverrides: {
    hero: {
      borderRadius: 16,
      shadow: '0 4px 24px rgba(45,40,35,0.09)',
      innerPadding: 14,
    },
    primary: {
      borderRadius: 14,
      shadow: '0 2px 14px rgba(45,40,35,0.06)',
      innerPadding: 10,
    },
    secondary: {
      borderRadius: 12,
      shadow: '0 2px 10px rgba(45,40,35,0.05)',
      innerPadding: 8,
    },
    accent: {
      borderRadius: 10,
      shadow: '0 1px 8px rgba(45,40,35,0.04)',
      innerPadding: 6,
    },
  },

  background: {
    color: '#F6F1EB',
    allowPhotoBlur: true,
    photoBlurOpacity: 0.04,
    photoBlurPx: 70,
    allowTexture: true,
    textureType: 'paper',
    textureOpacity: 0.018,
  },

  decorative: {
    philosophy: 'minimal',
    quoteMarks: 'simple',
    dividers: 'thin-line',
    cornerOrnaments: false,
    scriptOverlays: {
      words: ['Memories', 'Love', 'Ours', 'Moments', 'Home'],
      font: 'Dancing Script',
      weight: 400,
      sizeRange: [24, 48],
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover', 'opening'],
      placements: ['corner', 'page-edge'],
      color: '#D5CEC4',
      opacity: 0.2,
      italic: false,
    },
    accentLines: true,
    accentLineColor: 'rgba(190,182,172,0.2)',
    gradientWash: {
      type: 'radial',
      color: '#EDE7DF',
      opacity: 0.28,
      position: 'top-right',
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover'],
    },
    flourishes: false,
  },

  palette: {
    background: '#F6F1EB',
    surface: '#FBF7F2',
    accent: '#A89E92',
    text: '#3A3530',
    textMuted: '#B5ADA3',
    border: 'rgba(45,40,35,0.05)',
  },

  rhythm: {
    pace: 'slow',
    quoteEveryN: 3,
    breathingSpreadEveryN: 3,
    fullBleedEveryN: 5,
  },

  layoutBehavior: {
    canOffsetPhotos: false,
    canOverlapPhotos: false,
    canRotatePhotos: false,
    canBreakGrid: false,
    preferredQuotePlacement: ['center', 'corner'],
  },

  textBehavior: {
    showCaptions: true,
    showDates: false,
    showLocationLabels: false,
    quoteMaxLength: 90,
    textDensity: 'low',
  },

  spreadRoles: {
    cover: {
      spacingOverride: {
        pageMarginPercent: 18,
        whiteSpaceRatio: 0.55,
      },
      frameOverride: {
        borderRadius: 18,
        shadow: '0 6px 30px rgba(45,40,35,0.10)',
        innerPadding: 16,
      },
    },
    opening: {
      spacingOverride: {
        pageMarginPercent: 16,
        whiteSpaceRatio: 0.52,
      },
    },
    hero: {
      frameOverride: {
        borderRadius: 16,
        shadow: '0 4px 24px rgba(45,40,35,0.09)',
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 20,
        whiteSpaceRatio: 0.60,
      },
      frameOverride: {
        borderRadius: 18,
        shadow: '0 6px 28px rgba(45,40,35,0.08)',
        innerPadding: 16,
      },
    },
    closing: {
      spacingOverride: {
        pageMarginPercent: 18,
        whiteSpaceRatio: 0.55,
      },
      frameOverride: {
        borderRadius: 18,
        innerPadding: 14,
      },
      typographyOverride: {
        quoteSizeClass: 'text-lg',
        quoteWeight: 300,
        quoteLetterSpacing: '0.03em',
      },
    },
  },

  constraints: {
    forbidDarkBackgrounds: true,
    maxPhotosHardLimit: 4,
    requireSymmetryOnCover: true,
    avoidFaceNearGutter: true,
    minPhotoQualityForHero: 6,
  },
}

// ─── Registry ────────────────────────────────────────────────────────

export const DESIGN_FAMILIES: DesignFamily[] = [
  contemporaryLuxury,
  japaneseAiry,
  softPersonal,
  parisianEditorial,
  timelessClassic,
]

const familyMap = new Map(DESIGN_FAMILIES.map((f) => [f.id, f]))

export function getDesignFamily(id: string | null): DesignFamily {
  if (id && familyMap.has(id)) return familyMap.get(id)!
  return contemporaryLuxury
}

export function getFamiliesForConfig(
  type: string | null,
  mood: string | null,
  style: string | null,
): DesignFamily[] {
  const scored = DESIGN_FAMILIES.map((f) => {
    let score = 0
    if (type && f.bestForType.includes(type)) score += 3
    if (mood && f.bestForMood.includes(mood)) score += 2
    if (style && f.bestForStyle.includes(style)) score += 2
    return { family: f, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.family)
}
