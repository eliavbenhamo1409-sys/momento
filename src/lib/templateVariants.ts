import type { TemplateVariant, TemplateVariantAdjustments } from '../types'

// ─── Variant Definitions ─────────────────────────────────────────────
//
// Each entry describes how a specific family "warps" a specific template.
// If no variant exists for a (family, template) pair, family defaults apply.

const VARIANTS: TemplateVariant[] = [

  // ══════════════════════════════════════════════════════════════════════
  //  CONTEMPORARY LUXURY
  // ══════════════════════════════════════════════════════════════════════

  {
    familyId: 'contemporary-luxury',
    templateId: 'hero-left-grid-right',
    adjustments: {
      scalePhotos: 1.0,
      marginBias: 'right',
      captionPlacement: 'none',
      quotePlacement: 'sidebar',
    },
  },
  {
    familyId: 'contemporary-luxury',
    templateId: 'hero-right-stack-left',
    adjustments: {
      scalePhotos: 1.0,
      marginBias: 'left',
    },
  },
  {
    familyId: 'contemporary-luxury',
    templateId: 'balanced-4',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 16,
    },
  },
  {
    familyId: 'contemporary-luxury',
    templateId: 'full-bleed-quote',
    adjustments: {
      scalePhotos: 1.0,
      quotePlacement: 'center',
    },
  },
  {
    familyId: 'contemporary-luxury',
    templateId: 'panoramic',
    adjustments: {
      scalePhotos: 1.0,
      marginBias: 'top',
    },
  },
  {
    familyId: 'contemporary-luxury',
    templateId: 'grid-2x2',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 18,
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  JAPANESE AIRY MINIMAL
  // ══════════════════════════════════════════════════════════════════════

  {
    familyId: 'japanese-airy',
    templateId: 'hero-left-grid-right',
    adjustments: {
      scalePhotos: 1.0,
      offsetPrimaryPhoto: { x: -3, y: 2 },
      enforceAsymmetry: true,
      captionPlacement: 'none',
    },
  },
  {
    familyId: 'japanese-airy',
    templateId: 'hero-right-stack-left',
    adjustments: {
      scalePhotos: 1.0,
      offsetPrimaryPhoto: { x: 4, y: -1 },
      enforceAsymmetry: true,
    },
  },
  {
    familyId: 'japanese-airy',
    templateId: 'balanced-4',
    adjustments: {
      scalePhotos: 1.0,
      enforceAsymmetry: true,
      gapOverride: 28,
    },
  },
  {
    familyId: 'japanese-airy',
    templateId: 'full-bleed-quote',
    adjustments: {
      scalePhotos: 1.0,
      quotePlacement: 'floating',
      marginBias: 'bottom',
    },
  },
  {
    familyId: 'japanese-airy',
    templateId: 'panoramic',
    adjustments: {
      scalePhotos: 1.0,
      offsetPrimaryPhoto: { x: 0, y: 5 },
    },
  },
  {
    familyId: 'japanese-airy',
    templateId: 'cover-hero',
    adjustments: {
      scalePhotos: 1.0,
      marginBias: 'bottom',
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  PARISIAN EDITORIAL ROMANCE
  // ══════════════════════════════════════════════════════════════════════

  {
    familyId: 'parisian-editorial',
    templateId: 'hero-left-grid-right',
    adjustments: {
      scalePhotos: 1.0,
      allowOverlap: true,
      overlapAmount: 12,
      captionPlacement: 'beside',
      photoRotation: [-1.5, 1.5],
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'hero-right-stack-left',
    adjustments: {
      allowOverlap: true,
      overlapAmount: 8,
      photoRotation: [-1, 1],
      captionPlacement: 'below',
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'mosaic-5',
    adjustments: {
      gapOverride: 4,
      photoRotation: [-2, 2],
      allowOverlap: true,
      overlapAmount: 6,
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'detail-grid',
    adjustments: {
      gapOverride: 3,
      photoRotation: [-1.5, 1.5],
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'trio-left-hero-right',
    adjustments: {
      allowOverlap: true,
      overlapAmount: 10,
      captionPlacement: 'floating',
      photoRotation: [-1, 1],
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'full-bleed-quote',
    adjustments: {
      quotePlacement: 'sidebar',
      scalePhotos: 1.0,
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'balanced-4',
    adjustments: {
      photoRotation: [-1, 1],
      captionPlacement: 'below',
    },
  },
  {
    familyId: 'parisian-editorial',
    templateId: 'grid-2x2',
    adjustments: {
      gapOverride: 5,
      photoRotation: [-1, 1],
    },
  },

  // ══════════════════════════════════════════════════════════════════════
  //  TIMELESS CLASSIC
  // ══════════════════════════════════════════════════════════════════════

  {
    familyId: 'timeless-classic',
    templateId: 'hero-left-grid-right',
    adjustments: {
      scalePhotos: 1.0,
      captionPlacement: 'below',
      quotePlacement: 'center',
    },
  },
  {
    familyId: 'timeless-classic',
    templateId: 'hero-right-stack-left',
    adjustments: {
      scalePhotos: 1.0,
      captionPlacement: 'below',
    },
  },
  {
    familyId: 'timeless-classic',
    templateId: 'balanced-4',
    adjustments: {
      scalePhotos: 1.0,
      captionPlacement: 'below',
      gapOverride: 16,
    },
  },
  {
    familyId: 'timeless-classic',
    templateId: 'grid-2x2',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 16,
      captionPlacement: 'below',
    },
  },
  {
    familyId: 'timeless-classic',
    templateId: 'full-bleed-quote',
    adjustments: {
      scalePhotos: 1.0,
      quotePlacement: 'center',
    },
  },
  {
    familyId: 'timeless-classic',
    templateId: 'text-heavy',
    adjustments: {
      scalePhotos: 1.0,
      quotePlacement: 'center',
    },
  },
  {
    familyId: 'timeless-classic',
    templateId: 'trio-left-hero-right',
    adjustments: {
      scalePhotos: 1.0,
      captionPlacement: 'below',
    },
  },
]

// ─── Lookup ──────────────────────────────────────────────────────────

const variantMap = new Map<string, TemplateVariant>()
for (const v of VARIANTS) {
  variantMap.set(`${v.familyId}::${v.templateId}`, v)
}

export function getVariant(
  familyId: string,
  templateId: string,
): TemplateVariant | null {
  return variantMap.get(`${familyId}::${templateId}`) ?? null
}

export function getVariantsForFamily(familyId: string): TemplateVariant[] {
  return VARIANTS.filter((v) => v.familyId === familyId)
}

const DEFAULT_ADJUSTMENTS: TemplateVariantAdjustments = {
  scalePhotos: 1.0,
}

export function getEffectiveAdjustments(
  familyId: string,
  templateId: string,
): TemplateVariantAdjustments {
  const variant = getVariant(familyId, templateId)
  return variant?.adjustments ?? DEFAULT_ADJUSTMENTS
}
