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
  const pref = slotPreference(slot)

  if (slot.accepts.includes(photoOrientation)) return 1.0
  if (pref === photoOrientation) return 0.9
  if (pref === 'square') return 0.7
  if (slot.accepts.includes('any')) return 0.5

  if (photoOrientation === 'portrait' && pref === 'landscape') return 0.1
  if (photoOrientation === 'landscape' && pref === 'portrait') return 0.15

  return 0.3
}

// ─── Template scoring against a group ────────────────────────────────

const PORTRAIT_TEMPLATES = [
  'portrait-duo', 'portrait-trio', 'portrait-hero-grid',
  'portrait-grid-4', 'portrait-5', 'portrait-6',
  'single-portrait',
]
const LANDSCAPE_TEMPLATES = [
  'full-spread',
  'landscape-top-2sq', '2sq-top-landscape', 'two-landscapes-stacked',
]
const MIXED_TEMPLATES = [
  'mixed-top-bottom', 'hero-top-grid-bottom', 'mosaic-5',
  'hero-left-grid-right', 'balanced-4', 'grid-2x2',
  'grid-3x2', 'detail-grid', 'cross-diagonal', 'three-rows',
  'asymmetric-hero-steps', 'l-shape', 'dynamic-trio', 'staggered-grid',
  'photo-over-photo', 'photo-over-photo-right',
  'editorial-grid-duo', 'editorial-hero-mosaic', 'editorial-stagger-3',
  'editorial-magazine', 'editorial-cinematic',
  'mini-collage-12', 'mini-collage-9',
  'hero-caption-left', 'hero-caption-right', 'hero-trio-bottom',
  'story-spread', 'editorial-asymmetric', 'mosaic-hero-accent', 'cinematic-caption',
]

const CAPTION_TEMPLATES = new Set([
  'hero-caption-left', 'hero-caption-right', 'cinematic-caption', 'story-spread',
])

const STORY_TEMPLATES = new Set([
  'story-spread', 'hero-caption-left', 'hero-caption-right',
  'cinematic-caption', 'editorial-cinematic',
])

const EXTREME_ORIENTATION_TEMPLATES = new Set([
  'portrait-duo', 'portrait-trio', 'portrait-grid-4',
  'portrait-5', 'portrait-6',
  'single-portrait',
  'two-landscapes-stacked', 'landscape-top-2sq', '2sq-top-landscape',
])
const MAX_EXTREME_PAGES = 2

const OVERLAY_TEMPLATE_IDS = new Set(['photo-over-photo', 'photo-over-photo-right'])

function scoreTemplateForGroup(
  template: LayoutTemplate,
  group: PageGroup,
  scores: Map<string, PhotoScore>,
  previousTemplateIds: string[],
): number {
  const { orientationMix } = group
  const total = group.photoIds.length
  if (total < template.minPhotos || total > template.maxPhotos) return -1

  if (OVERLAY_TEMPLATE_IDS.has(template.id)) {
    const groupPhotos = group.photoIds.map(id => scores.get(id)).filter(Boolean) as PhotoScore[]
    const settings = groupPhotos.map(p => p.setting?.toLowerCase()).filter(Boolean)
    const uniqueSettings = new Set(settings)
    if (uniqueSettings.size > 1) return -1
  }

  const groupPhotos = group.photoIds
    .map((id) => scores.get(id))
    .filter(Boolean) as PhotoScore[]
  groupPhotos.sort((a, b) => b.overallQuality - a.overallQuality)

  const slots = template.slots.filter((s) => !s.id.endsWith('-mirror'))
  const usedSlots = slots.slice(0, Math.min(slots.length, total))

  let fitScore = 0
  for (let i = 0; i < usedSlots.length && i < groupPhotos.length; i++) {
    fitScore += orientationFitScore(usedSlots[i], groupPhotos[i].recommendedDisplay ?? groupPhotos[i].orientation)
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
      const bestDisplay = bestPhoto.recommendedDisplay ?? bestPhoto.orientation
      if (bestDisplay === 'landscape' && tid === 'full-spread') heroBonus += 0.5
      if (bestDisplay === 'portrait' && (tid === 'single-portrait' || tid === 'full-spread')) heroBonus += 0.5
      if (bestDisplay === 'portrait' && PORTRAIT_TEMPLATES.includes(tid)) heroBonus += 0.4
      const heroSlot = template.slots.find((s) => s.importance === 'hero')
      if (heroSlot) heroBonus += 0.1
      if (group.bestPhotoQuality >= 9) heroBonus += 0.15
    }
  }

  const photoCountMatch = 1 - Math.abs(total - (template.minPhotos + template.maxPhotos) / 2)
    / Math.max(template.maxPhotos - template.minPhotos, 1) * 0.1

  // Iron rule: both pages must have at least 1 slot (unless spanning)
  if (!template.spanning) {
    const leftSlotCount = template.slots.filter(s => s.page === 'left').length
    const rightSlotCount = template.slots.filter(s => s.page === 'right').length
    if (leftSlotCount === 0 || rightSlotCount === 0) return -1
  }

  const realSlotCount = slots.length
  const emptySlots = realSlotCount - total

  if (emptySlots > 0) return -1

  const slotFitScore = emptySlots === 0 ? 0.4 : 0

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

  const symmetry = computeSymmetryScore(template)

  // Collage bonus: low-quality large groups strongly prefer collage/mosaic templates
  let collageBonus = 0
  if (total >= 7 && group.avgQuality < 6) {
    const isCollageTemplate = tid.startsWith('mini-collage') || template.category === 'mosaic'
    collageBonus = isCollageTemplate ? 1.5 : -0.3
  }

  // Caption/story bonus: high-quality hero groups prefer templates with text zones
  let captionBonus = 0
  if (group.bestPhotoQuality >= 8) {
    if (CAPTION_TEMPLATES.has(tid)) captionBonus += 0.6
    if (STORY_TEMPLATES.has(tid)) captionBonus += 0.3
  }

  return fitScore + orientationBonus + heroBonus + photoCountMatch + slotFitScore + diversityBonus + symmetry * 0.3 + collageBonus + captionBonus
}

function computeSymmetryScore(template: LayoutTemplate): number {
  if (template.spanning) return 0.85

  const leftSlots = template.slots.filter(s => s.page === 'left')
  const rightSlots = template.slots.filter(s => s.page === 'right')
  const leftArea = leftSlots.reduce((sum, s) => sum + s.width * s.height, 0)
  const rightArea = rightSlots.reduce((sum, s) => sum + s.width * s.height, 0)
  const maxArea = Math.max(leftArea, rightArea, 1)

  if (Math.abs(leftArea - rightArea) / maxArea < 0.15) return 1.0

  const lightArea = Math.min(leftArea, rightArea)
  const pageArea = 100 * 100
  const whitespace = (pageArea - lightArea) / pageArea * 100

  if (whitespace >= 40) return 0.85
  if (whitespace >= 25) return 0.5
  return 0.2
}

// ─── Main picker ─────────────────────────────────────────────────────

export function pickBestTemplate(
  group: PageGroup,
  scores: Map<string, PhotoScore>,
  previousTemplateIds: string[],
  position: number,
  totalSpreads: number,
): LayoutTemplate {
  const photoCount = group.photoIds.length

  if (position === 0) return getTemplate('cover-hero')!
  if (position === totalSpreads - 1) {
    const closing = getTemplate('closing')!
    const closingSlots = closing.slots.filter(s => !s.id.endsWith('-mirror')).length
    if (photoCount >= closingSlots) return closing
  }

  const extremeUsedCount = previousTemplateIds.filter((id) => EXTREME_ORIENTATION_TEMPLATES.has(id)).length
  const extremeBudgetExhausted = extremeUsedCount >= MAX_EXTREME_PAGES

  const portraitRatio = group.orientationMix.portrait / photoCount
  const effectiveMax = portraitRatio >= 0.6
    ? Math.min(photoCount, 4)
    : photoCount

  const candidates = LAYOUT_TEMPLATES
    .filter((t) => t.category !== 'cover' && t.category !== 'closing')
    .filter((t) => {
      if (extremeBudgetExhausted && EXTREME_ORIENTATION_TEMPLATES.has(t.id)) return false
      const slotCount = t.slots.filter((s) => !s.id.endsWith('-mirror')).length
      return effectiveMax >= t.minPhotos && slotCount <= effectiveMax
    })
    .filter((t) => isTemplateAllowedAtPosition(t.id, position, previousTemplateIds))

  if (candidates.length === 0) {
    const fallback = getFallbackTemplate(position, totalSpreads)
    const fallbackSlots = fallback.slots.filter(s => !s.id.endsWith('-mirror')).length
    if (fallbackSlots <= photoCount) return fallback
    const safeMatch = LAYOUT_TEMPLATES.find(t =>
      t.category !== 'cover' && t.category !== 'closing' &&
      t.slots.filter(s => !s.id.endsWith('-mirror')).length <= photoCount &&
      photoCount >= t.minPhotos &&
      !t.spanning,
    )
    return safeMatch ?? getTemplate('editorial-cinematic')!
  }

  let bestTemplate = candidates[0]
  let bestScore = -Infinity

  for (const template of candidates) {
    let score = scoreTemplateForGroup(template, group, scores, previousTemplateIds)
    if (EXTREME_ORIENTATION_TEMPLATES.has(template.id)) score -= 0.6
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

      // If the last group still has < 2 photos, merge it into the previous group
      if (lastGroup.photoIds.length < 2 && lastIdx > 0) {
        const prevGroup = mutableGroups[lastIdx - 1]
        prevGroup.photoIds.push(...lastGroup.photoIds)
        mutableGroups.splice(lastIdx, 1)
      }
    }
  }

  const effectiveSpreads = Math.min(mutableGroups.length, totalSpreads)

  for (let i = 0; i < effectiveSpreads; i++) {
    const group = mutableGroups[i]
    const isLastSpread = i === effectiveSpreads - 1

    let template: LayoutTemplate
    if (isLastSpread && i > 0) {
      const closingTemplate = getTemplate('closing')!
      const closingSlotCount = closingTemplate.slots.filter(s => !s.id.endsWith('-mirror')).length
      if (group.photoIds.length >= closingSlotCount) {
        template = closingTemplate
      } else {
        template = pickBestTemplate(group, scores, previousTemplateIds, i, effectiveSpreads)
      }
    } else {
      template = pickBestTemplate(group, scores, previousTemplateIds, i, effectiveSpreads)
    }

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
