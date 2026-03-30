import type { PageGroup, PhotoScore, LayoutTemplate, SlotDefinition, SpreadPlan } from '../types'
import {
  LAYOUT_TEMPLATES,
  getTemplate,
  isTemplateAllowedAtPosition,
  getFallbackTemplate,
} from './layoutGrammar'

// ─── Orientation scoring ─────────────────────────────────────────────

function slotPreference(slot: SlotDefinition): 'landscape' | 'portrait' | 'square' {
  const aspect = slot.width / slot.height
  if (aspect > 1.3) return 'landscape'
  if (aspect < 0.77) return 'portrait'
  return 'square'
}

function orientationFitScore(
  slot: SlotDefinition,
  photoOrientation: 'landscape' | 'portrait' | 'square',
): number {
  if (slot.accepts.includes(photoOrientation)) return 1.0

  const pref = slotPreference(slot)

  if (photoOrientation === 'portrait' && pref === 'landscape') return -0.5
  if (photoOrientation === 'landscape' && pref === 'portrait') return -0.3

  if (pref === photoOrientation) return 0.9
  if (pref === 'square') return 0.7
  if (slot.accepts.includes('any')) return 0.4

  return 0.1
}

// ─── Template scoring against a group ────────────────────────────────

const PORTRAIT_TEMPLATES = [
  'portrait-duo', 'portrait-trio', 'portrait-hero-grid',
  'portrait-grid-4', 'portrait-5', 'portrait-6',
  'single-portrait',
]
const LANDSCAPE_TEMPLATES = [
  'three-rows', 'full-spread', 'grid-3x2', 'detail-grid',
  'landscape-top-2sq', '2sq-top-landscape', 'two-landscapes-stacked',
]
const MIXED_TEMPLATES = [
  'mixed-top-bottom', 'hero-top-grid-bottom', 'mosaic-5',
  'hero-left-grid-right', 'balanced-4', 'grid-2x2',
  'cross-diagonal',
]

function scoreTemplateForGroup(
  template: LayoutTemplate,
  group: PageGroup,
  scores: Map<string, PhotoScore>,
  previousTemplateIds: string[],
): number {
  const { orientationMix } = group
  const total = group.photoIds.length
  if (total < template.minPhotos || total > template.maxPhotos) return -1

  const groupPhotos = group.photoIds
    .map((id) => scores.get(id))
    .filter(Boolean) as PhotoScore[]
  groupPhotos.sort((a, b) => b.overallQuality - a.overallQuality)

  const slots = template.slots.filter((s) => !s.id.endsWith('-mirror'))
  const usedSlots = slots.slice(0, Math.min(slots.length, total))

  let fitScore = 0
  for (let i = 0; i < usedSlots.length && i < groupPhotos.length; i++) {
    fitScore += orientationFitScore(usedSlots[i], groupPhotos[i].orientation)
  }
  fitScore /= Math.max(usedSlots.length, 1)

  const portraitRatio = orientationMix.portrait / total
  const landscapeRatio = orientationMix.landscape / total

  let orientationBonus = 0
  const tid = template.id

  if (portraitRatio >= 0.75) {
    if (PORTRAIT_TEMPLATES.includes(tid)) orientationBonus += 0.5
    else if (LANDSCAPE_TEMPLATES.includes(tid)) orientationBonus -= 0.4
  } else if (portraitRatio > 0.5) {
    if (PORTRAIT_TEMPLATES.includes(tid)) orientationBonus += 0.35
    else if (MIXED_TEMPLATES.includes(tid)) orientationBonus += 0.1
    else if (LANDSCAPE_TEMPLATES.includes(tid)) orientationBonus -= 0.2
  }

  if (landscapeRatio >= 0.75) {
    if (LANDSCAPE_TEMPLATES.includes(tid)) orientationBonus += 0.4
    else if (PORTRAIT_TEMPLATES.includes(tid)) orientationBonus -= 0.3
  } else if (landscapeRatio > 0.5) {
    if (LANDSCAPE_TEMPLATES.includes(tid)) orientationBonus += 0.25
    else if (MIXED_TEMPLATES.includes(tid)) orientationBonus += 0.1
  }

  if (portraitRatio > 0 && landscapeRatio > 0 && portraitRatio <= 0.5 && landscapeRatio <= 0.5) {
    if (MIXED_TEMPLATES.includes(tid)) orientationBonus += 0.2
  }

  let heroBonus = 0
  if (group.bestPhotoQuality >= 8) {
    const bestPhoto = scores.get(group.bestPhotoId)
    if (bestPhoto) {
      if (bestPhoto.orientation === 'landscape' && tid === 'full-spread') heroBonus += 0.5
      if (bestPhoto.orientation === 'portrait' && (tid === 'single-portrait' || tid === 'full-spread')) heroBonus += 0.5
      if (bestPhoto.orientation === 'portrait' && PORTRAIT_TEMPLATES.includes(tid)) heroBonus += 0.4
      const heroSlot = template.slots.find((s) => s.importance === 'hero')
      if (heroSlot) heroBonus += 0.1
      if (group.bestPhotoQuality >= 9) heroBonus += 0.15
    }
  }

  const photoCountMatch = 1 - Math.abs(total - (template.minPhotos + template.maxPhotos) / 2)
    / Math.max(template.maxPhotos - template.minPhotos, 1) * 0.1

  const realSlotCount = slots.length
  const emptySlots = realSlotCount - total

  let slotFitScore: number
  if (emptySlots === 0) {
    slotFitScore = 0.4
  } else if (emptySlots === 1) {
    slotFitScore = -0.15
  } else if (emptySlots > 1) {
    return -1
  } else {
    slotFitScore = 0
  }

  // Diversity: reward templates not used recently
  let diversityBonus = 0
  const recentWindow = previousTemplateIds.slice(-6)
  if (!recentWindow.includes(tid)) {
    diversityBonus += 0.35
    if (!previousTemplateIds.includes(tid)) diversityBonus += 0.25
  }
  const recentCategories = recentWindow.map((id) => {
    const t = LAYOUT_TEMPLATES.find((lt) => lt.id === id)
    return t?.category
  })
  if (!recentCategories.includes(template.category)) diversityBonus += 0.15

  return fitScore + orientationBonus + heroBonus + photoCountMatch + slotFitScore + diversityBonus
}

// ─── Main picker ─────────────────────────────────────────────────────

export function pickBestTemplate(
  group: PageGroup,
  scores: Map<string, PhotoScore>,
  previousTemplateIds: string[],
  position: number,
  totalSpreads: number,
): LayoutTemplate {
  if (position === 0) return getTemplate('cover-hero')!
  if (position === totalSpreads - 1) return getTemplate('closing')!

  const photoCount = group.photoIds.length
  const portraitRatio = group.orientationMix.portrait / photoCount
  const effectiveMax = portraitRatio >= 0.6
    ? Math.min(photoCount, 4)
    : photoCount

  // Allow templates that need up to 1 extra photo (scored with penalty instead of rejected)
  const candidates = LAYOUT_TEMPLATES
    .filter((t) => t.category !== 'cover' && t.category !== 'closing')
    .filter((t) => {
      const slotCount = t.slots.filter((s) => !s.id.endsWith('-mirror')).length
      const shortage = slotCount - effectiveMax
      return effectiveMax >= t.minPhotos && shortage <= 1
    })
    .filter((t) => isTemplateAllowedAtPosition(t.id, position, previousTemplateIds))

  if (candidates.length === 0) {
    return getFallbackTemplate(position, totalSpreads)
  }

  let bestTemplate = candidates[0]
  let bestScore = -Infinity

  for (const template of candidates) {
    const score = scoreTemplateForGroup(template, group, scores, previousTemplateIds)
    if (score > bestScore) {
      bestScore = score
      bestTemplate = template
    }
  }

  return bestTemplate
}

// ─── Build spread plans from page groups ─────────────────────────────

const CLOSING_MIN_PHOTOS = 3

export function buildSmartSpreadPlans(
  groups: PageGroup[],
  scores: Map<string, PhotoScore>,
  totalSpreads: number,
): SpreadPlan[] {
  const plans: SpreadPlan[] = []
  const previousTemplateIds: string[] = []
  const mutableGroups = groups.map((g) => ({ ...g, photoIds: [...g.photoIds] }))

  // Ensure the closing spread (last) has enough photos to fill both pages.
  // The closing template has 3 slots (1 left hero + 2 right).
  // If the last group is too small, borrow photos from the previous group.
  const lastIdx = Math.min(mutableGroups.length, totalSpreads) - 1
  if (lastIdx > 0) {
    const lastGroup = mutableGroups[lastIdx]
    if (lastGroup && lastGroup.photoIds.length < CLOSING_MIN_PHOTOS) {
      const deficit = CLOSING_MIN_PHOTOS - lastGroup.photoIds.length

      for (let donor = lastIdx - 1; donor >= 0 && lastGroup.photoIds.length < CLOSING_MIN_PHOTOS; donor--) {
        const donorGroup = mutableGroups[donor]
        const donorMinKeep = 2
        const canGive = Math.max(0, donorGroup.photoIds.length - donorMinKeep)
        const toTake = Math.min(canGive, deficit)

        if (toTake > 0) {
          const donorScores = donorGroup.photoIds
            .map((id) => scores.get(id))
            .filter(Boolean) as PhotoScore[]
          donorScores.sort((a, b) => a.overallQuality - b.overallQuality)

          for (let t = 0; t < toTake; t++) {
            const photo = donorScores[t]
            if (!photo) break
            donorGroup.photoIds = donorGroup.photoIds.filter((id) => id !== photo.photoId)
            lastGroup.photoIds.push(photo.photoId)
          }
        }
      }

      console.log(`[אלבום חכם] עמוד סיום: הושלם ל-${lastGroup.photoIds.length} תמונות (הושאלו מעמודים קודמים)`)
    }
  }

  for (let i = 0; i < mutableGroups.length && i < totalSpreads; i++) {
    const group = mutableGroups[i]
    const template = pickBestTemplate(group, scores, previousTemplateIds, i, totalSpreads)

    previousTemplateIds.push(template.id)

    plans.push({
      spreadIndex: i,
      templateId: template.id,
      theme: group.theme,
      assignedPhotoIds: group.photoIds,
      quote: null,
    })
  }

  return plans
}
