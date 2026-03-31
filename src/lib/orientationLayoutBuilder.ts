import type { Photo, PhotoOrientation, PhotoScore, SpreadPlan, PageGroup } from '../types'
import { detectOrientation } from './photoUtils'

type OrientedPhoto = {
  id: string
  orientation: PhotoOrientation
  quality: number
  date: Date
}

const TEMPLATES_BY_PATTERN: Record<string, string[]> = {
  '1-portrait':  ['single-portrait', 'full-spread'],
  '1-landscape': ['full-spread'],
  '1-square':    ['full-spread'],

  '2-landscape': ['panoramic', 'two-landscapes-stacked'],
  '2-portrait':  ['portrait-duo'],
  '2-mixed':     ['portrait-duo', 'panoramic'],
  '2-square':    ['portrait-duo', 'panoramic'],

  '3-landscape': ['hero-right-stack-left', 'portrait-hero-grid', 'mixed-top-bottom'],
  '3-portrait':  ['portrait-trio', 'portrait-hero-grid'],
  '3-mixed':     ['hero-right-stack-left', 'portrait-hero-grid', 'mixed-top-bottom'],
  '3-square':    ['hero-right-stack-left', 'portrait-hero-grid', 'mixed-top-bottom'],

  '4-landscape': ['grid-2x2', 'cross-diagonal', 'balanced-4'],
  '4-portrait':  ['portrait-grid-4', 'cross-diagonal', 'balanced-4'],
  '4-mixed':     ['cross-diagonal', 'grid-2x2', 'balanced-4'],
  '4-square':    ['grid-2x2', 'cross-diagonal', 'balanced-4'],
}

function classifyGroup(orientations: PhotoOrientation[]): string {
  const counts = { landscape: 0, portrait: 0, square: 0 }
  for (const o of orientations) counts[o]++

  const total = orientations.length
  const dominant = counts.portrait >= counts.landscape ? 'portrait' : 'landscape'

  if (counts.landscape === total) return 'landscape'
  if (counts.portrait === total) return 'portrait'
  if (counts.square === total) return 'square'

  if (counts[dominant] >= total * 0.7) return dominant
  return 'mixed'
}

function pickTemplate(
  count: number,
  orientations: PhotoOrientation[],
  usedRecently: string[],
): string {
  const classification = classifyGroup(orientations)
  const key = `${count}-${classification}`
  const candidates = TEMPLATES_BY_PATTERN[key] ?? TEMPLATES_BY_PATTERN[`${count}-mixed`] ?? ['grid-2x2']

  for (const c of candidates) {
    if (!usedRecently.includes(c)) return c
  }
  return candidates[0]
}

function groupPhotosIntoSpreads(photos: OrientedPhoto[], targetSpreads: number): OrientedPhoto[][] {
  if (photos.length === 0) return []
  if (photos.length <= 2) return [photos]

  const avgPerSpread = Math.max(1, Math.min(4, Math.round(photos.length / targetSpreads)))
  const groups: OrientedPhoto[][] = []
  let i = 0

  while (i < photos.length) {
    const remaining = photos.length - i
    const spreadsLeft = targetSpreads - groups.length
    if (spreadsLeft <= 0) {
      groups[groups.length - 1].push(...photos.slice(i))
      break
    }

    let groupSize: number
    if (spreadsLeft === 1) {
      groupSize = remaining
    } else {
      groupSize = Math.min(remaining, Math.max(1, Math.min(4, avgPerSpread)))

      if (remaining - groupSize < spreadsLeft - 1) {
        groupSize = Math.max(1, remaining - (spreadsLeft - 1))
      }
    }

    groupSize = Math.min(groupSize, 4)
    if (groupSize < 1) groupSize = 1

    groups.push(photos.slice(i, i + groupSize))
    i += groupSize
  }

  return groups
}

export async function buildOrientationSpreadPlans(
  photos: Photo[],
  scores: PhotoScore[],
  targetSpreads: number,
  dateLookup: Map<string, Date>,
): Promise<{ plans: SpreadPlan[]; groups: PageGroup[] }> {
  const scoreMap = new Map(scores.map(s => [s.photoId, s]))

  const orientedPhotos: OrientedPhoto[] = photos.map(p => {
    const score = scoreMap.get(p.id)
    return {
      id: p.id,
      orientation: score?.recommendedDisplay ?? score?.orientation ?? detectOrientation(p.width, p.height),
      quality: score?.overallQuality ?? 5,
      date: dateLookup.get(p.id) ?? new Date(0),
    }
  })

  orientedPhotos.sort((a, b) => a.date.getTime() - b.date.getTime())

  const spreadGroups = groupPhotosIntoSpreads(orientedPhotos, targetSpreads)

  const usedRecently: string[] = []
  const plans: SpreadPlan[] = []
  const groups: PageGroup[] = []

  for (let idx = 0; idx < spreadGroups.length; idx++) {
    const group = spreadGroups[idx]
    const orientations = group.map(p => p.orientation)
    const photoIds = group.map(p => p.id)

    let templateId: string
    if (idx === 0) {
      templateId = 'cover-hero'
    } else if (idx === spreadGroups.length - 1 && spreadGroups.length > 2) {
      templateId = 'closing'
    } else {
      templateId = pickTemplate(group.length, orientations, usedRecently.slice(-3))
    }

    usedRecently.push(templateId)

    const orientationMix = { landscape: 0, portrait: 0, square: 0 }
    for (const o of orientations) orientationMix[o]++

    const bestPhoto = group.reduce((best, p) => p.quality > best.quality ? p : best, group[0])

    const pageGroup: PageGroup = {
      groupId: `group-${idx}`,
      photoIds,
      orientationMix,
      avgQuality: group.reduce((sum, p) => sum + p.quality, 0) / group.length,
      bestPhotoId: bestPhoto.id,
      bestPhotoQuality: bestPhoto.quality,
      theme: idx === 0 ? 'hero' : 'moments',
    }

    groups.push(pageGroup)
    plans.push({
      spreadIndex: idx,
      templateId,
      theme: pageGroup.theme,
      assignedPhotoIds: photoIds,
      quote: null,
    })
  }

  return { plans, groups }
}
