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

// ─── Scene-to-Background Mapping ──────────────────────────────────────

interface SceneBackgroundConfig {
  prompt: string
  gradient: string
  palette: string
}

const SCENE_BACKGROUNDS: Record<string, SceneBackgroundConfig> = {
  'ski': {
    prompt: 'snowy mountain peaks, soft morning light, alpine landscape, powder snow, crisp winter air',
    gradient: 'linear-gradient(180deg, #E8F0FE 0%, #B8D4F0 50%, #D6E8F7 100%)',
    palette: 'cool-whites',
  },
  'snow': {
    prompt: 'gentle snowfall over pine forest, soft diffused light, winter wonderland',
    gradient: 'linear-gradient(180deg, #EDF2F7 0%, #C5D5E4 50%, #E2ECF4 100%)',
    palette: 'cool-whites',
  },
  'beach': {
    prompt: 'calm ocean waves meeting golden sand, warm sunset tones, gentle foam',
    gradient: 'linear-gradient(180deg, #FDF5E6 0%, #F5E6D3 50%, #87CEEB 100%)',
    palette: 'warm-sand',
  },
  'ocean': {
    prompt: 'deep blue ocean water, soft horizon line, scattered clouds, serene atmosphere',
    gradient: 'linear-gradient(180deg, #E0F0FF 0%, #A8D8EA 50%, #7EC8E3 100%)',
    palette: 'ocean-blue',
  },
  'wedding': {
    prompt: 'soft floral arrangement with blush pink and ivory petals, bokeh lights, romantic ambiance',
    gradient: 'linear-gradient(180deg, #FFF5F5 0%, #F5E6D3 50%, #FDECEA 100%)',
    palette: 'blush',
  },
  'ceremony': {
    prompt: 'elegant venue interior with warm ambient lighting, soft drapery, floral accents',
    gradient: 'linear-gradient(180deg, #FFF8F0 0%, #F5E6D3 50%, #EDE0D4 100%)',
    palette: 'blush',
  },
  'city': {
    prompt: 'urban skyline silhouette at twilight, city lights bokeh, soft purple-blue tones',
    gradient: 'linear-gradient(180deg, #2C3E50 0%, #4A6741 50%, #34495E 100%)',
    palette: 'urban-dark',
  },
  'urban': {
    prompt: 'modern architecture with glass reflections, golden hour light on buildings',
    gradient: 'linear-gradient(180deg, #F5F0EB 0%, #D4C5B2 50%, #E8DDD0 100%)',
    palette: 'urban-warm',
  },
  'nature': {
    prompt: 'lush green valley with morning mist, mountain trail, dappled sunlight through trees',
    gradient: 'linear-gradient(180deg, #E8F5E9 0%, #A5D6A7 50%, #C8E6C9 100%)',
    palette: 'forest',
  },
  'hiking': {
    prompt: 'panoramic mountain vista with rolling hills, wildflowers, soft golden light',
    gradient: 'linear-gradient(180deg, #F1F8E9 0%, #AED581 50%, #DCEDC8 100%)',
    palette: 'forest',
  },
  'restaurant': {
    prompt: 'warm candlelit table setting, soft bokeh, wine glasses, intimate dining atmosphere',
    gradient: 'linear-gradient(180deg, #FFF3E0 0%, #E8C9A0 50%, #F5E0C3 100%)',
    palette: 'warm-amber',
  },
  'food': {
    prompt: 'rustic wooden table with artisan ingredients, warm natural light, culinary still life',
    gradient: 'linear-gradient(180deg, #EFEBE9 0%, #D7CCC8 50%, #E8DDD0 100%)',
    palette: 'warm-amber',
  },
  'garden': {
    prompt: 'blooming flower garden with soft pastel colors, morning dew, gentle sunlight',
    gradient: 'linear-gradient(180deg, #F1F8E9 0%, #E8F5E9 50%, #DCEDC8 100%)',
    palette: 'garden-green',
  },
  'sunset': {
    prompt: 'dramatic golden hour sky with warm orange and pink clouds, silhouetted horizon',
    gradient: 'linear-gradient(180deg, #FFE0B2 0%, #FFAB91 50%, #FFD54F 100%)',
    palette: 'golden',
  },
  'forest': {
    prompt: 'dense forest canopy with light filtering through leaves, moss-covered ground, serene mood',
    gradient: 'linear-gradient(180deg, #E8F5E9 0%, #81C784 50%, #C8E6C9 100%)',
    palette: 'forest',
  },
}

const SETTING_KEYWORD_MAP: [string[], string][] = [
  [['ski', 'skiing', 'slopes', 'snowboard'], 'ski'],
  [['snow', 'winter', 'snowy', 'ice'], 'snow'],
  [['beach', 'shore', 'sand', 'coast', 'seaside'], 'beach'],
  [['ocean', 'sea', 'waves', 'marine'], 'ocean'],
  [['wedding', 'bride', 'groom', 'bridal'], 'wedding'],
  [['ceremony', 'altar', 'chapel', 'vows'], 'ceremony'],
  [['city', 'downtown', 'metropolitan', 'skyline'], 'city'],
  [['urban', 'street', 'building', 'architecture'], 'urban'],
  [['nature', 'outdoor', 'countryside', 'valley'], 'nature'],
  [['hiking', 'trail', 'mountain', 'trek', 'hike'], 'hiking'],
  [['restaurant', 'dining', 'cafe', 'bistro'], 'restaurant'],
  [['food', 'cooking', 'kitchen', 'meal'], 'food'],
  [['garden', 'flowers', 'bloom', 'botanical'], 'garden'],
  [['sunset', 'sunrise', 'golden hour', 'dusk', 'dawn'], 'sunset'],
  [['forest', 'woods', 'jungle', 'trees'], 'forest'],
]

export function getSceneBackground(
  scene?: string,
  setting?: string,
): SceneBackgroundConfig | null {
  const combined = `${scene ?? ''} ${setting ?? ''}`.toLowerCase()
  if (!combined.trim()) return null

  for (const [keywords, key] of SETTING_KEYWORD_MAP) {
    if (keywords.some(kw => combined.includes(kw))) {
      return SCENE_BACKGROUNDS[key] ?? null
    }
  }

  return null
}

// ─── Contextual Text Templates ────────────────────────────────────────

const SCENE_TEXT_TEMPLATES: Record<string, string[]> = {
  'wedding': [
    'To Love and To Cherish',
    'The Beginning of Forever',
    'Two Hearts, One Story',
  ],
  'ceremony': [
    'A Moment We\'ll Never Forget',
    'Sealed with a Promise',
    'Where Forever Began',
  ],
  'proposal': [
    'The Best Day of Our Lives',
    'She Said Yes',
    'Where Forever Began',
  ],
  'ski': [
    'Chasing Snow',
    'Mountain Memories',
    'On Top of the World',
  ],
  'snow': [
    'A Winter Tale',
    'Snowbound Hearts',
    'Frozen in Time',
  ],
  'beach': [
    'Salt, Sand & Sun',
    'Seaside Memories',
    'Tides of Joy',
  ],
  'ocean': [
    'Beyond the Horizon',
    'Where the Ocean Meets the Sky',
    'Waves of Wonder',
  ],
  'travel': [
    'Adventures Together',
    'Exploring the World, Side by Side',
    'Wanderlust',
  ],
  'city': [
    'City Lights',
    'Urban Stories',
    'Concrete & Dreams',
  ],
  'nature': [
    'Into the Wild',
    'Nature\'s Canvas',
    'Breathe It In',
  ],
  'hiking': [
    'The Path Less Traveled',
    'Summit Bound',
    'Every Step Together',
  ],
  'birthday': [
    'Another Year of Amazing',
    'Celebrate You',
    'Making Wishes',
  ],
  'baby': [
    'Hello, Little One',
    'The Tiniest Adventure',
    'A New Chapter Begins',
  ],
  'food': [
    'A Feast to Remember',
    'Savoring the Moment',
    'Gathered Around the Table',
  ],
  'garden': [
    'In Full Bloom',
    'Where Beauty Grows',
    'Petals & Sunshine',
  ],
  'sunset': [
    'Golden Hour',
    'Chasing the Light',
    'Painted Skies',
  ],
  'forest': [
    'Among the Trees',
    'Whispers of the Forest',
    'Rooted Together',
  ],
}

const GENERIC_QUOTES = [
  'Moments Worth Keeping',
  'A Story in Every Frame',
  'Forever Captured',
  'These Are the Days',
  'The Beauty of Now',
]

export interface ContextualQuote {
  text: string
  style: 'hero-title' | 'accent-quote'
}

export function generateContextualQuote(
  scene?: string,
  setting?: string,
  position: 'opening' | 'mid' | 'closing' = 'mid',
): ContextualQuote {
  const combined = `${scene ?? ''} ${setting ?? ''}`.toLowerCase()

  let templates: string[] | undefined
  for (const [keywords, key] of SETTING_KEYWORD_MAP) {
    if (keywords.some(kw => combined.includes(kw))) {
      templates = SCENE_TEXT_TEMPLATES[key]
      break
    }
  }

  if (!templates) {
    templates = GENERIC_QUOTES
  }

  const seed = combined.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
  const text = templates[Math.abs(seed) % templates.length]

  return {
    text,
    style: position === 'opening' ? 'hero-title' : 'accent-quote',
  }
}
