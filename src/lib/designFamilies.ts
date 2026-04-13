import type { DesignFamily } from '../types'

// ─── 1. Contemporary Luxury Studio ──────────────────────────────────

const contemporaryLuxury: DesignFamily = {
  id: 'contemporary-luxury',
  name: 'Contemporary Luxury',
  nameHe: 'יוקרה מודרנית',
  description: 'Clean lines, generous whitespace, premium feel. Studio-quality with confident restraint.',
  descriptionHe: 'קווים נקיים, רווח נדיב, תחושת פרימיום. איכות סטודיו עם ריסון בטוח.',
  previewImageUrl : '/previews/img105846.jpg',

  bestForType: ['wedding', 'portrait', 'family', 'newborn'],
  bestForMood: ['romantic', 'serene', 'dramatic', 'tender'],
  bestForStyle: ['modern', 'elegant'],

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
      'showcase-single',
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

// ─── 2. Timeless Classic (Formal Heritage, Gold-Accented) ───────────

const timelessClassic: DesignFamily = {
  id: 'timeless-classic',
  name: 'Timeless Classic',
  nameHe: 'קלאסי נצחי',
  description: 'Formal symmetry, champagne-gold accents, visible photo mats, ornamental dividers. The album your grandparents would have treasured.',
  descriptionHe: 'סימטריה מושלמת, גוונים של שמפניה וזהב עתיק, מסגרות מט אלגנטיות, חוצצים עיטוריים. אלבום שגם הסבתא הייתה שומרת לנצח.',

  bestForType: ['wedding', 'bar_mitzvah', 'family', 'memorial', 'event'],
  bestForMood: ['romantic', 'tender', 'nostalgic', 'serene', 'dramatic'],
  bestForStyle: ['classic', 'traditional', 'elegant'],

  spacing: {
    pageMarginPercent: 10,
    photoGapPx: 16,
    whiteSpaceRatio: 0.32,
    breathingRoom: 'normal',
    asymmetric: false,
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
      'full-bleed-quote',
      'text-heavy',
      'panoramic',
      'portrait-trio',
      'portrait-hero-grid',
      'hero-top-grid-bottom',
      'three-rows',
      'mixed-top-bottom',
      'full-spread',
      'trio-left-hero-right',
      'showcase-single',
    ],
    avoidedTemplates: ['mosaic-5'],
    maxPhotosPerSpread: 5,
    heroFrequency: 3,
  },

  photoFrame: {
    borderWidth: 2,
    borderColor: 'rgba(195,175,140,0.35)',
    borderRadius: 2,
    shadow: '0 2px 10px rgba(60,50,35,0.10), 0 0 0 1px rgba(195,175,140,0.12)',
    rotationRange: [0, 0],
    innerPadding: 10,
  },

  slotFrameOverrides: {
    hero: {
      borderWidth: 3,
      borderColor: 'rgba(195,175,140,0.40)',
      shadow: '0 4px 18px rgba(60,50,35,0.12), 0 0 0 1px rgba(195,175,140,0.15)',
      innerPadding: 14,
    },
    primary: {
      borderWidth: 2,
      borderColor: 'rgba(195,175,140,0.30)',
      shadow: '0 2px 12px rgba(60,50,35,0.08)',
      innerPadding: 10,
    },
    secondary: {
      borderWidth: 1,
      borderColor: 'rgba(195,175,140,0.25)',
      innerPadding: 8,
    },
    accent: {
      borderWidth: 1,
      borderColor: 'rgba(195,175,140,0.20)',
      borderRadius: 2,
      innerPadding: 6,
    },
  },

  background: {
    color: '#F0E8DA',
    allowPhotoBlur: true,
    photoBlurOpacity: 0.04,
    photoBlurPx: 60,
    allowTexture: true,
    textureType: 'linen',
    textureOpacity: 0.035,
  },

  decorative: {
    philosophy: 'subtle',
    quoteMarks: 'serif-large',
    dividers: 'ornamental',
    cornerOrnaments: true,
    scriptOverlays: {
      words: ['לנצח', 'אהובים', 'הסיפור שלנו', 'נצחיות', 'מסורת'],
      font: 'Great Vibes',
      weight: 400,
      sizeRange: [28, 60],
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover', 'opening', 'grid', 'collage'],
      placements: ['centered', 'corner'],
      color: '#C8B898',
      opacity: 0.22,
      italic: false,
    },
    accentLines: true,
    accentLineColor: 'rgba(195,175,140,0.30)',
    gradientWash: {
      type: 'radial',
      color: '#EDE2D0',
      opacity: 0.35,
      position: 'center',
      roles: ['hero', 'standard', 'breathing', 'closing', 'text', 'cover'],
    },
    flourishes: true,
    flourishColor: 'rgba(195,175,140,0.35)',
  },

  palette: {
    background: '#F0E8DA',
    surface: '#F7F1E6',
    accent: '#B5A080',
    text: '#2A2418',
    textMuted: '#968A74',
    border: 'rgba(195,175,140,0.22)',
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
    quoteMaxLength: 110,
    textDensity: 'medium',
  },

  spreadRoles: {
    cover: {
      spacingOverride: {
        pageMarginPercent: 12,
      },
      frameOverride: {
        borderWidth: 4,
        borderColor: 'rgba(195,175,140,0.45)',
        innerPadding: 12,
        shadow: '0 6px 24px rgba(60,50,35,0.14), 0 0 0 2px rgba(195,175,140,0.18)',
      },
      decorativeOverride: {
        cornerOrnaments: true,
      },
    },
    hero: {
      frameOverride: {
        borderWidth: 3,
        borderColor: 'rgba(195,175,140,0.38)',
        innerPadding: 10,
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 16,
        whiteSpaceRatio: 0.50,
      },
      decorativeOverride: {
        cornerOrnaments: true,
      },
    },
    closing: {
      decorativeOverride: {
        cornerOrnaments: true,
        dividers: 'ornamental',
      },
      typographyOverride: {
        quoteSizeClass: 'text-2xl',
        quoteItalic: true,
        quoteWeight: 400,
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

// ─── 5. Soft Personal (Warm Blush, Rounded, Scrapbook-Modern) ────────

const softPersonal: DesignFamily = {
  id: 'soft-personal',
  name: 'Soft Personal',
  nameHe: 'רך ואישי',
  description: 'Warm blush tones, cloud-soft shadows, generous rounded corners. Like a handwritten letter — intimate, tactile, and full of heart.',
  descriptionHe: 'גוונים חמים של בלאש וורוד עתיק, צללים רכים כענן, פינות מעוגלות בנדיבות. כמו מכתב בכתב יד — אינטימי, מוחשי, מלא לב.',

  bestForType: ['wedding', 'family', 'newborn', 'baby', 'couple', 'general'],
  bestForMood: ['tender', 'romantic', 'nostalgic', 'joyful', 'serene'],
  bestForStyle: ['warm', 'personal', 'cozy', 'scrapbook'],

  spacing: {
    pageMarginPercent: 16,
    photoGapPx: 20,
    whiteSpaceRatio: 0.52,
    breathingRoom: 'airy',
    asymmetric: false,
  },

  typography: {
    quoteFont: 'Dancing Script',
    quoteWeight: 500,
    quoteSizeClass: 'text-lg',
    quoteItalic: false,
    quoteLineHeight: 1.8,
    quoteLetterSpacing: '0.02em',
    quoteAlign: 'center',
    captionFont: 'Plus Jakarta Sans',
    captionWeight: 300,
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
      'full-spread',
      'showcase-single',
      'hero-top-grid-bottom',
      'trio-left-hero-right',
    ],
    avoidedTemplates: ['detail-grid', 'mosaic-5', 'grid-3x2'],
    maxPhotosPerSpread: 4,
    heroFrequency: 2,
  },

  photoFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 18,
    shadow: '0 4px 20px rgba(180,140,130,0.12), 0 1px 4px rgba(180,140,130,0.08)',
    rotationRange: [0, 0],
    innerPadding: 12,
  },

  slotFrameOverrides: {
    hero: {
      borderRadius: 22,
      shadow: '0 8px 32px rgba(180,140,130,0.14), 0 2px 8px rgba(180,140,130,0.08)',
      innerPadding: 16,
    },
    primary: {
      borderRadius: 18,
      shadow: '0 4px 20px rgba(180,140,130,0.10), 0 1px 4px rgba(180,140,130,0.06)',
      innerPadding: 12,
    },
    secondary: {
      borderRadius: 14,
      shadow: '0 3px 14px rgba(180,140,130,0.09)',
      innerPadding: 10,
    },
    accent: {
      borderRadius: 12,
      shadow: '0 2px 10px rgba(180,140,130,0.07)',
      innerPadding: 8,
    },
  },

  background: {
    color: '#FBF4F0',
    allowPhotoBlur: true,
    photoBlurOpacity: 0.05,
    photoBlurPx: 80,
    allowTexture: true,
    textureType: 'paper',
    textureOpacity: 0.025,
  },

  decorative: {
    philosophy: 'minimal',
    quoteMarks: 'simple',
    dividers: 'none',
    cornerOrnaments: false,
    scriptOverlays: {
      words: ['זכרונות', 'אהבה', 'שלנו', 'רגעים', 'בית', 'ביחד'],
      font: 'Dancing Script',
      weight: 400,
      sizeRange: [22, 44],
      roles: ['hero', 'breathing', 'closing', 'text', 'cover', 'opening'],
      placements: ['corner', 'page-edge'],
      color: '#DBBFB8',
      opacity: 0.18,
      italic: false,
    },
    accentLines: false,
    accentLineColor: 'transparent',
    gradientWash: {
      type: 'radial',
      color: '#F0DDD8',
      opacity: 0.30,
      position: 'top-right',
      roles: ['hero', 'breathing', 'closing', 'cover'],
    },
    flourishes: false,
  },

  palette: {
    background: '#FBF4F0',
    surface: '#FFF8F5',
    accent: '#C4A39B',
    text: '#4A3F3A',
    textMuted: '#C0AEA6',
    border: 'rgba(196,163,155,0.10)',
  },

  rhythm: {
    pace: 'slow',
    quoteEveryN: 3,
    breathingSpreadEveryN: 3,
    fullBleedEveryN: 4,
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
    quoteMaxLength: 80,
    textDensity: 'low',
  },

  spreadRoles: {
    cover: {
      spacingOverride: {
        pageMarginPercent: 20,
        whiteSpaceRatio: 0.58,
      },
      frameOverride: {
        borderRadius: 24,
        shadow: '0 10px 40px rgba(180,140,130,0.14), 0 3px 10px rgba(180,140,130,0.08)',
        innerPadding: 18,
      },
    },
    opening: {
      spacingOverride: {
        pageMarginPercent: 18,
        whiteSpaceRatio: 0.55,
      },
    },
    hero: {
      frameOverride: {
        borderRadius: 22,
        shadow: '0 8px 32px rgba(180,140,130,0.12)',
      },
    },
    breathing: {
      spacingOverride: {
        pageMarginPercent: 22,
        whiteSpaceRatio: 0.62,
      },
      frameOverride: {
        borderRadius: 24,
        shadow: '0 8px 36px rgba(180,140,130,0.10)',
        innerPadding: 18,
      },
    },
    closing: {
      spacingOverride: {
        pageMarginPercent: 20,
        whiteSpaceRatio: 0.58,
      },
      frameOverride: {
        borderRadius: 24,
        innerPadding: 16,
      },
      typographyOverride: {
        quoteSizeClass: 'text-xl',
        quoteWeight: 500,
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
  softPersonal,
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
