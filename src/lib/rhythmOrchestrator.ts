import type {
  DesignFamily,
  SpreadSequenceSlot,
  SpreadRole,
  DensityLevel,
  CuratedPhotoSet,
} from '../types'

/**
 * Plans the full album sequence based on the design family's rhythm rules.
 * This runs BEFORE AI template selection, producing a structural skeleton
 * that the AI must respect.
 *
 * The sequence plan determines:
 * - Which spread index gets which role (cover, hero, breathing, etc.)
 * - Where quotes land
 * - Where breathing spreads appear
 * - Density hints that constrain how many photos per spread
 */
export function planAlbumSequence(
  family: DesignFamily,
  spreadCount: number,
  curated?: CuratedPhotoSet,
): SpreadSequenceSlot[] {
  const plan: SpreadSequenceSlot[] = []
  const { rhythm, composition, constraints } = family

  const densityForRole: Record<SpreadRole, DensityLevel> = {
    cover: 'sparse',
    opening: rhythm.pace === 'fast' ? 'moderate' : 'sparse',
    hero: 'moderate',
    standard: rhythm.pace === 'slow' ? 'sparse' : 'moderate',
    grid: 'dense',
    breathing: 'sparse',
    text: 'sparse',
    collage: 'dense',
    closing: 'sparse',
  }

  const maxPhotosForRole: Record<SpreadRole, number> = {
    cover: 1,
    opening: rhythm.pace === 'fast' ? 3 : 2,
    hero: 2,
    standard: Math.min(4, constraints.maxPhotosHardLimit),
    grid: Math.min(6, constraints.maxPhotosHardLimit),
    breathing: 1,
    text: 2,
    collage: Math.min(5, constraints.maxPhotosHardLimit),
    closing: 1,
  }

  const hasHeroCandidates = (curated?.heroCandidates.length ?? 0) > 0

  for (let i = 0; i < spreadCount; i++) {
    // Fixed positions
    if (i === 0) {
      plan.push({
        index: 0,
        role: 'cover',
        isQuoteSpread: false,
        isBreathingSpread: false,
        templateConstraint: 'cover-hero',
        densityHint: 'sparse',
        maxPhotos: 1,
      })
      continue
    }

    if (i === spreadCount - 1) {
      plan.push({
        index: i,
        role: 'closing',
        isQuoteSpread: true,
        isBreathingSpread: false,
        templateConstraint: 'closing',
        densityHint: 'sparse',
        maxPhotos: 1,
      })
      continue
    }

    if (i === 1) {
      plan.push({
        index: 1,
        role: 'opening',
        isQuoteSpread: false,
        isBreathingSpread: rhythm.pace === 'slow',
        densityHint: densityForRole.opening,
        maxPhotos: maxPhotosForRole.opening,
      })
      continue
    }

    // Rhythm-driven roles for inner spreads (index 2 to spreadCount-2)
    const innerIndex = i - 2
    const role = resolveRole(innerIndex, rhythm, composition, hasHeroCandidates)
    const isBreathing = role === 'breathing'
    const isQuote = shouldPlaceQuote(i, rhythm.quoteEveryN, plan)

    plan.push({
      index: i,
      role,
      isQuoteSpread: isQuote,
      isBreathingSpread: isBreathing,
      densityHint: densityForRole[role],
      maxPhotos: maxPhotosForRole[role],
    })
  }

  return plan
}

function resolveRole(
  innerIndex: number,
  rhythm: DesignFamily['rhythm'],
  composition: DesignFamily['composition'],
  hasHeroes: boolean,
): SpreadRole {
  const breathingN = rhythm.breathingSpreadEveryN
  const heroFreq = composition.heroFrequency
  const fullBleedN = rhythm.fullBleedEveryN

  if (breathingN > 0 && (innerIndex + 1) % breathingN === 0) {
    return 'breathing'
  }

  if (fullBleedN > 0 && (innerIndex + 1) % fullBleedN === 0) {
    return hasHeroes ? 'hero' : 'standard'
  }

  if (heroFreq > 0 && (innerIndex % heroFreq) === 0 && hasHeroes) {
    return 'hero'
  }

  return pickFillerRole(innerIndex, rhythm)
}

function pickFillerRole(innerIndex: number, rhythm: DesignFamily['rhythm']): SpreadRole {
  switch (rhythm.pace) {
    case 'slow': {
      const cycle: SpreadRole[] = ['standard', 'hero', 'standard']
      return cycle[innerIndex % cycle.length]
    }
    case 'medium': {
      const cycle: SpreadRole[] = ['standard', 'grid', 'standard', 'hero']
      return cycle[innerIndex % cycle.length]
    }
    case 'fast': {
      const cycle: SpreadRole[] = ['grid', 'standard', 'collage', 'hero', 'standard']
      return cycle[innerIndex % cycle.length]
    }
  }
}

function shouldPlaceQuote(
  currentIndex: number,
  quoteEveryN: number,
  existingPlan: SpreadSequenceSlot[],
): boolean {
  if (quoteEveryN <= 0) return false

  const lastQuoteIdx = findLastQuoteIndex(existingPlan)
  const distanceSinceQuote = lastQuoteIdx < 0
    ? currentIndex
    : currentIndex - lastQuoteIdx

  return distanceSinceQuote >= quoteEveryN
}

function findLastQuoteIndex(plan: SpreadSequenceSlot[]): number {
  for (let i = plan.length - 1; i >= 0; i--) {
    if (plan[i].isQuoteSpread) return plan[i].index
  }
  return -1
}

/**
 * Returns a human-readable sequence summary for debugging / AI prompt context.
 */
export function describeSequence(plan: SpreadSequenceSlot[]): string {
  return plan
    .map(
      (s) =>
        `[${s.index}] ${s.role}${s.isBreathingSpread ? ' (breathing)' : ''}${s.isQuoteSpread ? ' +quote' : ''} density=${s.densityHint}${s.maxPhotos ? ` max=${s.maxPhotos}` : ''}`,
    )
    .join('\n')
}
