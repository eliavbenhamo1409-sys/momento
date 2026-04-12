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
  //  SOFT PERSONAL
  // ══════════════════════════════════════════════════════════════════════

  {
    familyId: 'soft-personal',
    templateId: 'hero-left-grid-right',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 22,
      captionPlacement: 'none',
    },
  },
  {
    familyId: 'soft-personal',
    templateId: 'hero-right-stack-left',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 22,
    },
  },
  {
    familyId: 'soft-personal',
    templateId: 'balanced-4',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 24,
    },
  },
  {
    familyId: 'soft-personal',
    templateId: 'full-bleed-quote',
    adjustments: {
      scalePhotos: 1.0,
      quotePlacement: 'center',
    },
  },
  {
    familyId: 'soft-personal',
    templateId: 'panoramic',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 20,
    },
  },
  {
    familyId: 'soft-personal',
    templateId: 'portrait-trio',
    adjustments: {
      scalePhotos: 1.0,
      gapOverride: 22,
    },
  },
  {
    familyId: 'soft-personal',
    templateId: 'cover-hero',
    adjustments: {
      scalePhotos: 1.0,
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
