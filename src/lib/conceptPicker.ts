import type {
  PhotoScore,
  AlbumConfig,
  SpreadSequenceSlot,
  EditorSpread,
  MoodConceptId,
  EmotionType,
  SceneType,
  SpreadRole,
} from '../types'
import type { MoodPack } from './moodPacks'
import { getMoodPack, ALL_MOOD_IDS } from './moodPacks'

// ─── Concept Picker ──────────────────────────────────────────────────
//
// Assigns a mood concept to each spread based on the dominant emotion/scene
// of its photos, the album-level mood, the spread's role in the rhythm plan,
// and variation rules (no two adjacent spreads share a concept).

interface SpreadConceptAssignment {
  spreadIndex: number
  conceptId: MoodConceptId
  pack: MoodPack
}

// Mapping: emotion × scene → preferred mood concepts (ordered by priority)
const EMOTION_SCENE_MAP: Partial<Record<EmotionType, Partial<Record<SceneType, MoodConceptId[]>>>> = {
  serene: {
    landscape_scenic: ['ocean', 'golden-hour', 'garden-fresh'],
    outdoor: ['ocean', 'garden-fresh', 'golden-hour'],
    indoor: ['coffee-candle', 'minimal-clean'],
    portrait: ['minimal-clean', 'soft-romantic'],
    detail: ['coffee-candle', 'minimal-clean'],
    food: ['coffee-candle', 'garden-fresh'],
    architecture: ['modern-luxury', 'minimal-clean'],
    group: ['garden-fresh', 'minimal-clean'],
    action: ['ocean', 'golden-hour'],
  },
  romantic: {
    landscape_scenic: ['golden-hour', 'soft-romantic', 'ocean'],
    outdoor: ['soft-romantic', 'golden-hour', 'garden-fresh'],
    indoor: ['soft-romantic', 'coffee-candle'],
    portrait: ['soft-romantic', 'modern-luxury'],
    detail: ['soft-romantic', 'coffee-candle'],
    food: ['coffee-candle', 'soft-romantic'],
    architecture: ['modern-luxury', 'soft-romantic'],
    group: ['soft-romantic', 'garden-fresh'],
    action: ['golden-hour', 'soft-romantic'],
  },
  joyful: {
    landscape_scenic: ['golden-hour', 'ocean', 'garden-fresh'],
    outdoor: ['garden-fresh', 'golden-hour', 'ocean'],
    indoor: ['coffee-candle', 'modern-luxury'],
    portrait: ['golden-hour', 'soft-romantic'],
    detail: ['garden-fresh', 'coffee-candle'],
    food: ['coffee-candle', 'garden-fresh'],
    architecture: ['modern-luxury', 'golden-hour'],
    group: ['golden-hour', 'garden-fresh'],
    action: ['golden-hour', 'ocean'],
  },
  tender: {
    landscape_scenic: ['soft-romantic', 'golden-hour'],
    outdoor: ['soft-romantic', 'garden-fresh'],
    indoor: ['coffee-candle', 'soft-romantic'],
    portrait: ['soft-romantic', 'coffee-candle'],
    detail: ['coffee-candle', 'soft-romantic'],
    food: ['coffee-candle', 'soft-romantic'],
    architecture: ['minimal-clean', 'modern-luxury'],
    group: ['soft-romantic', 'garden-fresh'],
    action: ['golden-hour', 'soft-romantic'],
  },
  dramatic: {
    landscape_scenic: ['modern-luxury', 'golden-hour'],
    outdoor: ['golden-hour', 'modern-luxury'],
    indoor: ['modern-luxury', 'coffee-candle'],
    portrait: ['modern-luxury', 'minimal-clean'],
    detail: ['modern-luxury', 'coffee-candle'],
    food: ['coffee-candle', 'modern-luxury'],
    architecture: ['modern-luxury', 'minimal-clean'],
    group: ['modern-luxury', 'golden-hour'],
    action: ['modern-luxury', 'golden-hour'],
  },
  nostalgic: {
    landscape_scenic: ['golden-hour', 'ocean'],
    outdoor: ['golden-hour', 'garden-fresh'],
    indoor: ['coffee-candle', 'soft-romantic'],
    portrait: ['coffee-candle', 'soft-romantic'],
    detail: ['coffee-candle', 'golden-hour'],
    food: ['coffee-candle', 'golden-hour'],
    architecture: ['modern-luxury', 'coffee-candle'],
    group: ['golden-hour', 'soft-romantic'],
    action: ['golden-hour', 'ocean'],
  },
  energetic: {
    landscape_scenic: ['ocean', 'golden-hour'],
    outdoor: ['ocean', 'garden-fresh', 'golden-hour'],
    indoor: ['modern-luxury', 'coffee-candle'],
    portrait: ['golden-hour', 'modern-luxury'],
    detail: ['garden-fresh', 'modern-luxury'],
    food: ['coffee-candle', 'garden-fresh'],
    architecture: ['modern-luxury', 'golden-hour'],
    group: ['golden-hour', 'ocean'],
    action: ['ocean', 'golden-hour'],
  },
  neutral: {
    landscape_scenic: ['minimal-clean', 'ocean'],
    outdoor: ['minimal-clean', 'garden-fresh'],
    indoor: ['minimal-clean', 'coffee-candle'],
    portrait: ['minimal-clean', 'modern-luxury'],
    detail: ['minimal-clean', 'coffee-candle'],
    food: ['coffee-candle', 'minimal-clean'],
    architecture: ['minimal-clean', 'modern-luxury'],
    group: ['minimal-clean', 'garden-fresh'],
    action: ['minimal-clean', 'golden-hour'],
  },
}

const ALBUM_MOOD_BIAS: Record<string, MoodConceptId[]> = {
  romantic: ['soft-romantic', 'golden-hour', 'coffee-candle'],
  elegant: ['modern-luxury', 'minimal-clean'],
  warm: ['coffee-candle', 'golden-hour', 'soft-romantic'],
  fresh: ['garden-fresh', 'ocean', 'minimal-clean'],
  dramatic: ['modern-luxury', 'golden-hour'],
  playful: ['golden-hour', 'ocean', 'garden-fresh'],
  nostalgic: ['golden-hour', 'coffee-candle', 'soft-romantic'],
  minimal: ['minimal-clean', 'modern-luxury'],
  calm: ['ocean', 'minimal-clean', 'garden-fresh'],
  luxurious: ['modern-luxury', 'coffee-candle'],
}

const ROLE_CONCEPT_MAP: Partial<Record<SpreadRole, MoodConceptId[]>> = {
  breathing: ['minimal-clean', 'ocean', 'garden-fresh'],
  closing: ['soft-romantic', 'golden-hour', 'minimal-clean'],
  cover: ['modern-luxury', 'golden-hour', 'soft-romantic'],
  opening: ['golden-hour', 'modern-luxury', 'ocean'],
  text: ['minimal-clean', 'coffee-candle'],
}

function getDominantTraits(
  scores: PhotoScore[],
): { emotion: EmotionType; scene: SceneType } {
  if (scores.length === 0) return { emotion: 'neutral', scene: 'outdoor' }

  const emotionCounts: Partial<Record<EmotionType, number>> = {}
  const sceneCounts: Partial<Record<SceneType, number>> = {}

  for (const s of scores) {
    emotionCounts[s.emotion] = (emotionCounts[s.emotion] ?? 0) + 1
    sceneCounts[s.scene] = (sceneCounts[s.scene] ?? 0) + 1
  }

  const emotion = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as EmotionType ?? 'neutral'

  const scene = Object.entries(sceneCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as SceneType ?? 'outdoor'

  return { emotion, scene }
}

function getCandidates(
  emotion: EmotionType,
  scene: SceneType,
  albumMood: string | null,
  role: SpreadRole,
): MoodConceptId[] {
  const fromEmotionScene = EMOTION_SCENE_MAP[emotion]?.[scene] ?? ['minimal-clean']
  const fromRole = ROLE_CONCEPT_MAP[role] ?? []
  const fromMood = albumMood ? (ALBUM_MOOD_BIAS[albumMood.toLowerCase()] ?? []) : []

  const scored = new Map<MoodConceptId, number>()
  for (const id of ALL_MOOD_IDS) scored.set(id, 0)

  fromEmotionScene.forEach((id, i) => scored.set(id, (scored.get(id) ?? 0) + (3 - i * 0.5)))
  fromRole.forEach((id, i) => scored.set(id, (scored.get(id) ?? 0) + (2 - i * 0.5)))
  fromMood.forEach((id, i) => scored.set(id, (scored.get(id) ?? 0) + (1.5 - i * 0.3)))

  return [...scored.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id)
}

function hashSpreadSeed(spreadId: string): number {
  let h = 0
  for (let i = 0; i < spreadId.length; i++) {
    h = ((h << 5) - h + spreadId.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Assigns a mood concept to each spread, ensuring:
 * 1. Concept matches the photos' dominant emotion + scene
 * 2. Album mood biases the selection
 * 3. Spread role influences the pick
 * 4. No two adjacent spreads share the same concept
 * 5. AI-suggested concepts (from SpreadPlan) take priority when available
 */
export function assignMoodConcepts(
  spreads: EditorSpread[],
  allScores: PhotoScore[],
  config: AlbumConfig,
  sequencePlan: SpreadSequenceSlot[],
  aiSuggestions?: (MoodConceptId | undefined)[],
): SpreadConceptAssignment[] {
  const scoreMap = new Map(allScores.map((s) => [s.photoId, s]))
  const assignments: SpreadConceptAssignment[] = []
  let prevConcept: MoodConceptId | null = null

  for (let i = 0; i < spreads.length; i++) {
    const spread = spreads[i]
    const seqSlot = sequencePlan[i]
    const role = seqSlot?.role ?? spread.role ?? 'standard'

    const aiSuggested = aiSuggestions?.[i]
    if (aiSuggested && (aiSuggested !== prevConcept || spreads.length <= 2)) {
      assignments.push({
        spreadIndex: i,
        conceptId: aiSuggested,
        pack: getMoodPack(aiSuggested),
      })
      prevConcept = aiSuggested
      continue
    }

    const photoIds = [
      ...spread.leftPhotos.filter(Boolean),
      ...spread.rightPhotos.filter(Boolean),
    ] as string[]
    const spreadScores = photoIds
      .map((id) => scoreMap.get(id))
      .filter((s): s is PhotoScore => !!s)

    const { emotion, scene } = getDominantTraits(spreadScores)
    const candidates = getCandidates(emotion, scene, config.mood, role)

    let chosen = candidates[0]
    if (chosen === prevConcept && candidates.length > 1) {
      chosen = candidates[1]
    }
    if (chosen === prevConcept && candidates.length > 2) {
      chosen = candidates[2]
    }

    if (chosen === prevConcept && candidates.length > 3) {
      const seed = hashSpreadSeed(spread.id)
      const remaining = candidates.filter((c) => c !== prevConcept)
      chosen = remaining[seed % remaining.length] ?? candidates[0]
    }

    assignments.push({
      spreadIndex: i,
      conceptId: chosen,
      pack: getMoodPack(chosen),
    })
    prevConcept = chosen
  }

  return assignments
}
