import type { PhotoScore, CuratedPhotoSet, RankedPhoto, AlbumConfig, PhotoRole, PageGroup } from '../types'

// ─── Similarity Detection ───────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 1),
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let intersection = 0
  for (const w of a) if (b.has(w)) intersection++
  return intersection / (a.size + b.size - intersection)
}

function clusterBySimilarity(scores: PhotoScore[]): Map<string, string> {
  const clusters = new Map<string, string>()
  const tokenized = scores.map((s) => ({
    id: s.photoId,
    tokens: tokenize(s.description),
    scene: s.scene,
    people: s.peopleCount,
  }))

  let clusterCount = 0
  const assigned = new Set<string>()

  for (let i = 0; i < tokenized.length; i++) {
    if (assigned.has(tokenized[i].id)) continue

    const clusterId = `cluster-${++clusterCount}`
    clusters.set(tokenized[i].id, clusterId)
    assigned.add(tokenized[i].id)

    for (let j = i + 1; j < tokenized.length; j++) {
      if (assigned.has(tokenized[j].id)) continue

      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens)
      const sameScene = tokenized[i].scene === tokenized[j].scene
      const samePeople = tokenized[i].people === tokenized[j].people

      if (sim > 0.55 && sameScene && samePeople) {
        clusters.set(tokenized[j].id, clusterId)
        assigned.add(tokenized[j].id)
      }
    }
  }

  return clusters
}

// ─── Duplicate Removal ──────────────────────────────────────────────

function deduplicateByCluster(
  scores: PhotoScore[],
  clusters: Map<string, string>,
): { kept: PhotoScore[]; removed: { photoId: string; reason: string }[] } {
  const byCluster = new Map<string, PhotoScore[]>()
  for (const score of scores) {
    const c = clusters.get(score.photoId) ?? score.photoId
    const arr = byCluster.get(c) ?? []
    arr.push(score)
    byCluster.set(c, arr)
  }

  const kept: PhotoScore[] = []
  const removed: { photoId: string; reason: string }[] = []

  for (const [, members] of byCluster) {
    members.sort((a, b) => b.overallQuality - a.overallQuality)
    kept.push(members[0])
    for (let i = 1; i < members.length; i++) {
      removed.push({ photoId: members[i].photoId, reason: 'כפילות — נשמרה הגרסה הטובה יותר' })
    }
  }

  return { kept, removed }
}

// ─── Quality Filter ─────────────────────────────────────────────────

const MIN_QUALITY = 3

function filterLowQuality(
  scores: PhotoScore[],
): { passed: PhotoScore[]; removed: { photoId: string; reason: string }[] } {
  const passed: PhotoScore[] = []
  const removed: { photoId: string; reason: string }[] = []

  for (const s of scores) {
    if (s.overallQuality < MIN_QUALITY) {
      removed.push({ photoId: s.photoId, reason: `איכות נמוכה (${s.overallQuality}/10)` })
    } else if (s.sharpness <= 2) {
      removed.push({ photoId: s.photoId, reason: 'תמונה מטושטשת' })
    } else if (s.exposure <= 2) {
      removed.push({ photoId: s.photoId, reason: 'חשופה/כהה מדי' })
    } else {
      passed.push(s)
    }
  }

  return { passed, removed }
}

// ─── Composite Ranking ──────────────────────────────────────────────

function computeCompositeScore(score: PhotoScore, config: AlbumConfig): number {
  let composite =
    score.overallQuality * 0.35 +
    score.composition * 0.25 +
    score.sharpness * 0.15 +
    score.exposure * 0.1

  if (score.isHighlight) composite += 1.5
  if (score.isCoverCandidate) composite += 0.5
  if (score.isHeroCandidate) composite += 0.5

  if (config.mood && score.emotion === config.mood) composite += 0.8
  if (config.type === 'wedding' && score.scene === 'portrait') composite += 0.3
  if (config.type === 'travel' && score.scene === 'landscape_scenic') composite += 0.3

  return composite
}

function assignRole(score: PhotoScore, rank: number, totalBudget: number): PhotoRole {
  if (rank === 0 && score.isCoverCandidate) return 'cover'
  if (score.isHeroCandidate && rank < totalBudget * 0.2) return 'hero'
  if (rank < totalBudget * 0.7) return 'standard'
  return 'filler'
}

// ─── Main Curation Pipeline ─────────────────────────────────────────

export function curatePhotos(
  rawScores: PhotoScore[],
  config: AlbumConfig,
): CuratedPhotoSet {
  const totalOriginal = rawScores.length

  // 1. Cluster by similarity
  const clusters = clusterBySimilarity(rawScores)
  rawScores.forEach((s) => {
    s.similarityCluster = clusters.get(s.photoId)
  })

  // 2. Deduplicate
  const deduped = deduplicateByCluster(rawScores, clusters)
  const allRemoved = [...deduped.removed]

  // 3. Quality filter
  const filtered = filterLowQuality(deduped.kept)
  allRemoved.push(...filtered.removed)

  // 4. Rank
  const ranked = filtered.passed
    .map((s) => ({ score: s, composite: computeCompositeScore(s, config) }))
    .sort((a, b) => b.composite - a.composite)

  // 5. Budget: how many photos we need
  const spreadsNeeded = Math.max(3, Math.floor(config.pages / 2))
  const avgPhotosPerSpread = 2.8
  const photoBudget = Math.min(ranked.length, Math.ceil(spreadsNeeded * avgPhotosPerSpread))

  const selected: RankedPhoto[] = ranked.slice(0, photoBudget).map((item, i) => ({
    photoId: item.score.photoId,
    score: item.score,
    rank: i,
    role: assignRole(item.score, i, photoBudget),
  }))

  // Tag candidates
  const coverCandidates = selected
    .filter((r) => r.score.isCoverCandidate && r.score.overallQuality >= 7)
    .slice(0, 3)
    .map((r) => r.photoId)

  const heroCandidates = selected
    .filter((r) => r.score.isHeroCandidate && r.score.overallQuality >= 6)
    .map((r) => r.photoId)

  if (coverCandidates.length === 0 && selected.length > 0) {
    coverCandidates.push(selected[0].photoId)
  }

  return {
    selected,
    removed: allRemoved,
    coverCandidates,
    heroCandidates,
    totalOriginal,
    totalSelected: selected.length,
  }
}

// ─── Page Group Builder ────────────────────────────────────────────

function buildOrientationMix(photos: PhotoScore[]): PageGroup['orientationMix'] {
  const mix = { landscape: 0, portrait: 0, square: 0 }
  for (const p of photos) mix[p.recommendedDisplay ?? p.orientation]++
  return mix
}

function buildGroupMeta(groupId: string, photos: PhotoScore[], theme: string): PageGroup {
  const mix = buildOrientationMix(photos)
  let bestId = photos[0].photoId
  let bestQ = photos[0].overallQuality
  let totalQ = 0
  for (const p of photos) {
    totalQ += p.overallQuality
    if (p.overallQuality > bestQ) { bestQ = p.overallQuality; bestId = p.photoId }
  }
  return {
    groupId,
    photoIds: photos.map((p) => p.photoId),
    orientationMix: mix,
    avgQuality: totalQ / photos.length,
    bestPhotoId: bestId,
    bestPhotoQuality: bestQ,
    theme,
  }
}

/**
 * Greedy agglomerative clustering using multi-signal affinity.
 * Returns array of photo groups.
 */
function settingsMatch(a: PhotoScore, b: PhotoScore): boolean {
  if (!a.setting || !b.setting) return false
  return a.setting.toLowerCase() === b.setting.toLowerCase()
}

function groupDominantSetting(group: PhotoScore[]): string | undefined {
  const counts: Record<string, number> = {}
  for (const p of group) {
    if (p.setting) counts[p.setting.toLowerCase()] = (counts[p.setting.toLowerCase()] || 0) + 1
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : undefined
}

function multiSignalCluster(
  scores: PhotoScore[],
  dateLookup?: Map<string, Date>,
  maxGroup = 6,
): PhotoScore[][] {
  if (!dateLookup || dateLookup.size === 0) {
    const groups: PhotoScore[][] = []
    for (let i = 0; i < scores.length; i += maxGroup) {
      groups.push(scores.slice(i, i + maxGroup))
    }
    return groups
  }

  const sorted = [...scores].sort((a, b) => {
    const dA = dateLookup.get(a.photoId)?.getTime() ?? 0
    const dB = dateLookup.get(b.photoId)?.getTime() ?? 0
    return dA - dB
  })

  const groups: PhotoScore[][] = []
  let current: PhotoScore[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const photo = sorted[i]
    const prevDate = dateLookup.get(current[current.length - 1].photoId)?.getTime() ?? 0
    const curDate = dateLookup.get(photo.photoId)?.getTime() ?? 0
    const gapMin = Math.abs(curDate - prevDate) / 60_000

    const hasSameSetting = current.some(m => settingsMatch(m, photo))
    const dominantSetting = groupDominantSetting(current)
    const photoSetting = photo.setting?.toLowerCase()
    const settingConflict = dominantSetting && photoSetting && dominantSetting !== photoSetting

    const shouldGroup =
      !settingConflict &&
      current.length < maxGroup &&
      (hasSameSetting || (gapMin <= 30 && current.some(m => m.scene === photo.scene)))

    if (shouldGroup) {
      current.push(photo)
    } else {
      groups.push(current)
      current = [photo]
    }
  }
  if (current.length > 0) groups.push(current)

  return groups
}

/**
 * Clusters scored photos into page-sized groups ready for spread assignment.
 *
 * Uses multi-signal clustering: time proximity, scene type, setting tag,
 * people count, and description similarity. Groups are sorted chronologically
 * when date data is available.
 */
export function buildPageGroups(
  scores: PhotoScore[],
  targetSpreads: number,
  dateLookup?: Map<string, Date>,
): PageGroup[] {
  if (scores.length === 0) return []

  const MAX_GROUP = 6
  const MIN_GROUP = 2

  const chronoScores = dateLookup && dateLookup.size > 0
    ? [...scores].sort((a, b) => {
        const dA = dateLookup.get(a.photoId)?.getTime() ?? 0
        const dB = dateLookup.get(b.photoId)?.getTime() ?? 0
        return dA - dB
      })
    : scores

  const rawGroups = multiSignalCluster(chronoScores, dateLookup, MAX_GROUP)

  // Sort each group internally by date (chronological order within a spread)
  if (dateLookup && dateLookup.size > 0) {
    for (const g of rawGroups) {
      g.sort((a, b) => {
        const dA = dateLookup.get(a.photoId)?.getTime() ?? 0
        const dB = dateLookup.get(b.photoId)?.getTime() ?? 0
        return dA - dB
      })
    }
  } else {
    for (const g of rawGroups) g.sort((a, b) => b.overallQuality - a.overallQuality)
  }

  // Extract hero photos into standalone 1-photo groups for full-page treatment
  const heroGroups: PageGroup[] = []
  const normalGroups: PhotoScore[][] = []

  for (const group of rawGroups) {
    const heroPhoto = group.find((p) =>
      (p.overallQuality >= 9 && (p.isHeroCandidate || p.isHighlight)) ||
      (p.overallQuality >= 8 && p.isHeroCandidate && p.isCoverCandidate)
    )
    if (heroPhoto && group.length > 1) {
      heroGroups.push(buildGroupMeta(`hero-${heroPhoto.photoId}`, [heroPhoto], 'hero'))
      const rest = group.filter((p) => p.photoId !== heroPhoto.photoId)
      if (rest.length > 0) normalGroups.push(rest)
    } else {
      normalGroups.push(group)
    }
  }

  // Split portrait-heavy groups (>60% portrait) that exceed 4 photos
  const splitGroups: PhotoScore[][] = []
  for (const group of normalGroups) {
    const portraitCount = group.filter((p) => p.orientation === 'portrait').length
    const portraitRatio = portraitCount / group.length
    if (portraitRatio >= 0.6 && group.length > 4) {
      const mid = Math.ceil(group.length / 2)
      splitGroups.push(group.slice(0, mid), group.slice(mid))
    } else {
      splitGroups.push(group)
    }
  }
  const normalGroupsFinal = splitGroups

  // Merge tiny groups (< MIN_GROUP) with neighbours
  let merged: PhotoScore[][] = []
  let pending: PhotoScore[] = []

  for (const group of normalGroupsFinal) {
    if (group.length >= MIN_GROUP) {
      if (pending.length > 0) {
        merged.push([...pending])
        pending = []
      }
      merged.push(group)
    } else {
      pending.push(...group)
      if (pending.length >= MIN_GROUP) {
        merged.push([...pending])
        pending = []
      }
    }
  }
  if (pending.length > 0) {
    if (merged.length > 0 && merged[merged.length - 1].length + pending.length <= MAX_GROUP) {
      merged[merged.length - 1].push(...pending)
    } else {
      merged.push(pending)
    }
  }

  // Reduce groups if too many for target spread count
  if (merged.length + heroGroups.length > targetSpreads) {
    while (merged.length + heroGroups.length > targetSpreads && merged.length > 1) {
      const smallest = merged.reduce((minI, g, i, arr) =>
        g.length < arr[minI].length ? i : minI, 0)
      const removed = merged.splice(smallest, 1)[0]
      const target = merged.reduce((minI, g, i, arr) =>
        g.length < arr[minI].length ? i : minI, 0)
      merged[target].push(...removed)
      if (merged[target].length > MAX_GROUP) {
        const over = merged[target]
        merged.splice(target, 1)
        for (let i = 0; i < over.length; i += MAX_GROUP) {
          merged.push(over.slice(i, i + MAX_GROUP))
        }
      }
    }
  }

  // Split groups if we need more spreads
  while (merged.length + heroGroups.length < targetSpreads && merged.some((g) => g.length > MIN_GROUP)) {
    const largest = merged.reduce((maxI, g, i, arr) =>
      g.length > arr[maxI].length ? i : maxI, 0)
    if (merged[largest].length <= MIN_GROUP) break
    const group = merged.splice(largest, 1)[0]
    const mid = Math.ceil(group.length / 2)
    merged.push(group.slice(0, mid), group.slice(mid))
  }

  // Build final PageGroup objects with eventId from dominant setting
  const result: PageGroup[] = [...heroGroups]
  let groupIdx = 0
  for (const group of merged) {
    const settingCounts: Record<string, number> = {}
    for (const p of group) {
      if (p.setting) settingCounts[p.setting] = (settingCounts[p.setting] || 0) + 1
    }
    const dominantSetting = Object.entries(settingCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    const dominantScene = group.reduce((acc, p) => {
      acc[p.scene] = (acc[p.scene] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const sceneFallback = Object.entries(dominantScene).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

    const groupTheme = dominantSetting || sceneFallback
    const pg = buildGroupMeta(`group-${++groupIdx}`, group, groupTheme)
    pg.eventId = dominantSetting?.toLowerCase()
    result.push(pg)
  }

  // Sort chronologically by earliest photo date when available
  if (dateLookup && dateLookup.size > 0) {
    const earliestDate = (pg: PageGroup): number => {
      let min = Infinity
      for (const pid of pg.photoIds) {
        const d = dateLookup.get(pid)
        if (d) min = Math.min(min, d.getTime())
      }
      return min === Infinity ? 0 : min
    }
    // Keep hero groups at their natural position but sort normal groups chronologically
    const heroes = result.filter((g) => g.groupId.startsWith('hero-'))
    const normals = result.filter((g) => !g.groupId.startsWith('hero-'))
    normals.sort((a, b) => earliestDate(a) - earliestDate(b))

    // Interleave heroes back near their chronological position
    const sorted: PageGroup[] = []
    let ni = 0
    for (const hero of heroes) {
      const heroDate = earliestDate(hero)
      while (ni < normals.length && earliestDate(normals[ni]) <= heroDate) {
        sorted.push(normals[ni++])
      }
      sorted.push(hero)
    }
    while (ni < normals.length) sorted.push(normals[ni++])

    return sorted
  }

  return result
}
