export interface Photo {
  id: string
  file?: File
  thumbnailUrl: string
  fullUrl: string
  width: number
  height: number
  selected: boolean
}

/** Spread in the visual editor — compiled blueprint with resolved visual tokens. */
export interface EditorSpread {
  id: string
  templateId: string
  familyId?: string
  role?: SpreadRole
  leftPhotos: (string | null)[]
  rightPhotos: (string | null)[]
  quote: string | null
  slots?: (FinalSlotData | EnrichedSlotData)[]
  theme?: string
  variant?: TemplateVariant | null
  resolvedStyle?: ResolvedSpreadStyle
  design?: SpreadDesign
  moodConcept?: MoodConceptId
  emptyPageFill?: EmptyPageFill
}

export interface EmptyPageFill {
  type: 'ai-background' | 'quote' | 'gradient'
  side: 'left' | 'right'
  prompt?: string
  text?: string
  gradient?: string
}

// ─── Spread Composition (absolute-positioned rendering) ──────────────

export type MoodConceptId =
  | 'ocean'
  | 'coffee-candle'
  | 'soft-romantic'
  | 'modern-luxury'
  | 'golden-hour'
  | 'garden-fresh'
  | 'minimal-clean'

export interface BackgroundLayerDef {
  gradient: string
  opacity: number
  blendMode?: string
}

export interface SpreadDesignBackground {
  color: string
  blurPhotoUrl?: string
  blurOpacity?: number
  blurPx?: number
  texture?: TextureType
  textureOpacity?: number
  gradientWash?: string
  gradientWashOpacity?: number
  gradientBlendMode?: string
  conceptId?: MoodConceptId
  backgroundLayers?: BackgroundLayerDef[]
  svgOverlay?: string
  svgOverlayOpacity?: number
  /** AI-generated background image URL — full spread */
  generatedBgUrl?: string
  generatedBgOpacity?: number
  /** AI-generated background for left page only */
  generatedBgLeftUrl?: string
  generatedBgLeftOpacity?: number
  /** AI-generated background for right page only */
  generatedBgRightUrl?: string
  generatedBgRightOpacity?: number
}

export interface SpreadDesign {
  elements: SpreadElement[]
  background: SpreadDesignBackground
}

export type SpreadElement = PhotoElement | QuoteElement | DecorativeElement

export interface PhotoElement {
  type: 'photo'
  slotId: string
  photoId: string
  photoUrl: string | null
  page: 'left' | 'right' | 'full'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  borderWidth: number
  borderColor: string
  borderRadius: number
  shadow: string
  padding: number
  zIndex: number
  objectPosition: string
  objectFit: 'cover' | 'contain'
  importance: SlotImportance
  clipPath?: string
  scale?: number
}

export interface QuoteElement {
  type: 'quote'
  text: string
  page: 'left' | 'right'
  x: number
  y: number
  width: number
  height: number
  fontFamily: string
  fontWeight: number
  fontSize: number
  italic: boolean
  color: string
  align: 'start' | 'center' | 'end'
  letterSpacing: string
  lineHeight: number
  zIndex: number
  quoteMarks: QuoteMarkStyle
}

export type DecorativeElementType = 'divider' | 'ornament' | 'script-text' | 'accent-line' | 'gradient-wash' | 'flourish' | 'svg-pattern'

export interface DecorativeElement {
  type: DecorativeElementType
  page: 'left' | 'right'
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity: number
  rotation: number
  zIndex: number
  style?: DividerStyle
  text?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  italic?: boolean
  gradient?: string
  blendMode?: string
  strokeWidth?: number
  svgPath?: string
}

// ─── People Roster Types ────────────────────────────────────────────

export interface PhotoFaceObservation {
  photoId: string
  faceIndex: number
  labelHe: string
  matchHint: string
}

export interface AlbumPerson {
  id: string
  displayName: string
  photoIds: string[]
  avatarPhotoId: string
  avatarObjectPosition?: string
}

// ─── AI Generation Pipeline Types ───────────────────────────────────

export type PhotoOrientation = 'portrait' | 'landscape' | 'square'
export type SceneType = 'outdoor' | 'indoor' | 'portrait' | 'group' | 'detail' | 'landscape_scenic' | 'food' | 'architecture' | 'action'
export type EmotionType = 'joyful' | 'romantic' | 'serene' | 'energetic' | 'nostalgic' | 'dramatic' | 'tender' | 'neutral'
export type ColorTone = 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted'
export type FaceRegion = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'spread' | 'none'

/** Layer 1 output: structured score per photo from vision API */
export interface PhotoScore {
  photoId: string
  orientation: PhotoOrientation
  aspectRatio: number

  sharpness: number
  exposure: number
  composition: number
  overallQuality: number

  scene: SceneType
  peopleCount: number
  hasFaces: boolean
  facesRegion: FaceRegion

  emotion: EmotionType
  colorDominant: ColorTone

  isHighlight: boolean
  isCoverCandidate: boolean
  isHeroCandidate: boolean
  isCloseup: boolean
  isGroupShot: boolean

  recommendedDisplay: PhotoOrientation
  similarityCluster?: string
  description: string
  setting?: string
  faceObservations?: PhotoFaceObservation[]
}

export type PhotoRole = 'cover' | 'hero' | 'standard' | 'filler'

/** Layer 2 output: ranked photo with role */
export interface RankedPhoto {
  photoId: string
  score: PhotoScore
  rank: number
  role: PhotoRole
}

/** Layer 2 output: curated set ready for layout */
export interface CuratedPhotoSet {
  selected: RankedPhoto[]
  removed: { photoId: string; reason: string }[]
  coverCandidates: string[]
  heroCandidates: string[]
  totalOriginal: number
  totalSelected: number
}

// ─── Layout Grammar Types ───────────────────────────────────────────

export type SlotImportance = 'hero' | 'primary' | 'secondary' | 'accent'
export type TemplateCategory = 'cover' | 'hero' | 'balanced' | 'grid' | 'mosaic' | 'text' | 'closing'

export interface SafeZone {
  top: number
  bottom: number
  left: number
  right: number
}

export interface SlotDefinition {
  id: string
  page: 'left' | 'right'
  x: number
  y: number
  width: number
  height: number
  accepts: (PhotoOrientation | 'any')[]
  importance: SlotImportance
  minQuality: number
  safeZone: SafeZone
}

export interface LayoutTemplate {
  id: string
  name: string
  category: TemplateCategory
  slots: SlotDefinition[]
  minPhotos: number
  maxPhotos: number
  acceptsQuote: boolean
  quotePosition?: 'left-bottom' | 'right-bottom' | 'right-center'
  cannotRepeatWithin: number
  bestForMood: string[]
  bestForScene: string[]
  /** When true, ALL slots span both pages (left→right mirror) */
  spanning?: boolean
  /** Specific slot IDs that span both pages (used for mixed layouts) */
  spanningSlotIds?: string[]
}

export interface PageRules {
  bleedMm: number
  safeMarginMm: number
  gutterMm: number
  firstSpreadTemplate: string
  lastSpreadTemplate: string
  maxConsecutiveSameCategory: number
  quoteFrequency: { min: number; max: number }
}

// ─── Spread Planning Types ──────────────────────────────────────────

/** AI per-spread design overrides */
export interface SpreadPlanDesign {
  backgroundColor?: string
  backgroundBlurPhotoId?: string
  backgroundBlurOpacity?: number
  marginOverride?: number
  slotOverrides?: Record<string, {
    borderWidth?: number
    borderColor?: string
    shadow?: string
    rotation?: number
    padding?: number
    scale?: number
  }>
  quoteStyle?: {
    fontSize?: number
    italic?: boolean
    weight?: number
    color?: string
    position?: QuotePlacement
  }
}

/** Layer 3 output: AI-selected template + assigned photo group */
export interface SpreadPlan {
  spreadIndex: number
  templateId: string
  theme: string
  assignedPhotoIds: string[]
  quote: string | null
  designOverrides?: SpreadPlanDesign
  moodConcept?: MoodConceptId
}

/** A group of photos clustered for a single spread, with orientation metadata. */
export interface PageGroup {
  groupId: string
  photoIds: string[]
  orientationMix: { landscape: number; portrait: number; square: number }
  avgQuality: number
  bestPhotoId: string
  bestPhotoQuality: number
  theme: string
  eventId?: string
}

// ─── AI Spread Skeleton Spec (raw AI output) ───────────────────────

export interface AISpreadSpec {
  spreadIndex: number
  concept: string
  mood: string
  background: {
    baseColor: string
    gradient?: { type: 'radial' | 'linear'; colors: string[]; position: string }
    texture?: TextureType
    textureOpacity?: number
    blurPhotoSlot?: string
    blurOpacity?: number
  }
  photoSlots: AIPhotoSlotSpec[]
  textBlocks: AITextBlockSpec[]
  decorations: AIDecorationSpec[]
}

export interface AIPhotoSlotSpec {
  id: string
  page: 'left' | 'right'
  x: number
  y: number
  w: number
  h: number
  rotation: number
  radius: number
  role: 'hero' | 'support' | 'accent'
  frame: {
    borderWidth: number
    borderColor: string
    shadow: string
    padding: number
  }
  zIndex: number
  accepts: ('portrait' | 'landscape' | 'any')[]
}

export interface AITextBlockSpec {
  type: 'quote' | 'caption' | 'script-overlay'
  content: string
  page: 'left' | 'right'
  x: number
  y: number
  w: number
  h: number
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  color: string
  align: 'start' | 'center' | 'end'
  letterSpacing: string
  lineHeight: number
  rotation: number
  opacity: number
  zIndex: number
}

export interface AIDecorationSpec {
  type: 'line' | 'gradient-wash' | 'flourish' | 'corner-ornament'
  page: 'left' | 'right'
  x: number
  y: number
  w: number
  h: number
  color: string
  opacity: number
  rotation: number
  zIndex: number
  gradient?: string
  blendMode?: string
  strokeWidth?: number
  svgPath?: string
  style?: DividerStyle
}

// ─── Photo Placement Types ──────────────────────────────────────────

/** Layer 4/5 output: final placement per slot */
export interface CropSuggestion {
  focusX: number
  focusY: number
  scale: number
  reason: string
}

export interface SlotAssignment {
  spreadIndex: number
  slotId: string
  photoId: string
  photoUrl: string
  needsCrop: boolean
  cropSuggestion: CropSuggestion | null
  fitMode: 'cover' | 'contain' | 'custom'
}

export interface FinalSlotData {
  slotId: string
  photoUrl: string
  objectFit: 'cover' | 'contain'
  objectPosition: string
  transform: string
}

export interface EnrichedSlotData extends FinalSlotData {
  importance: SlotImportance
  frame: ResolvedFrame
}

// ─── Design Family System ────────────────────────────────────────────

export type SpreadRole = 'cover' | 'opening' | 'hero' | 'standard' | 'grid' | 'breathing' | 'text' | 'collage' | 'closing'
export type RhythmPace = 'slow' | 'medium' | 'fast'
export type BreathingRoom = 'tight' | 'normal' | 'generous' | 'airy'
export type SymmetryMode = 'strict' | 'balanced' | 'asymmetric' | 'dynamic'
export type DensityLevel = 'sparse' | 'moderate' | 'dense'
export type TextureType = 'none' | 'paper' | 'linen' | 'watercolor' | 'grain'
export type DecorativePhilosophy = 'none' | 'minimal' | 'subtle' | 'ornate'
export type QuoteMarkStyle = 'none' | 'simple' | 'elegant' | 'serif-large'
export type DividerStyle = 'none' | 'thin-line' | 'ornamental' | 'dotted'
export type CaptionPlacement = 'below' | 'beside' | 'floating' | 'margin' | 'none'
export type QuotePlacement = 'center' | 'corner' | 'sidebar' | 'floating'
export type TextDensity = 'low' | 'medium' | 'high'

export interface FamilySpacing {
  pageMarginPercent: number
  photoGapPx: number
  whiteSpaceRatio: number
  breathingRoom: BreathingRoom
  asymmetric: boolean
}

export interface FamilyTypography {
  quoteFont: string
  quoteWeight: number
  quoteSizeClass: string
  quoteItalic: boolean
  quoteLineHeight: number
  quoteLetterSpacing: string
  quoteAlign: 'center' | 'start' | 'end'
  captionFont: string
  captionWeight: number
  captionSizeClass: string
}

export interface FamilyComposition {
  symmetry: SymmetryMode
  density: DensityLevel
  preferredTemplates: string[]
  avoidedTemplates: string[]
  maxPhotosPerSpread: number
  heroFrequency: number
}

export interface FamilyPhotoFrame {
  borderWidth: number
  borderColor: string
  borderRadius: number
  shadow: string
  rotationRange: [number, number]
  innerPadding: number
}

export interface FamilyBackground {
  color: string
  allowPhotoBlur: boolean
  photoBlurOpacity: number
  photoBlurPx: number
  allowTexture: boolean
  textureType: TextureType
  textureOpacity: number
}

export interface ScriptOverlayConfig {
  words: string[]
  font: string
  weight: number
  sizeRange: [number, number]
  roles: SpreadRole[]
  placements: ('corner' | 'behind-photo' | 'page-edge' | 'centered')[]
  color: string
  opacity: number
  italic: boolean
}

export interface GradientWashConfig {
  type: 'radial' | 'linear'
  color: string
  opacity: number
  position: 'top-left' | 'bottom-right' | 'top-right' | 'center' | 'full'
  roles: SpreadRole[]
}

export interface FamilyDecorative {
  philosophy: DecorativePhilosophy
  quoteMarks: QuoteMarkStyle
  dividers: DividerStyle
  cornerOrnaments: boolean
  scriptOverlays: ScriptOverlayConfig | null
  accentLines: boolean
  accentLineColor?: string
  gradientWash: GradientWashConfig | null
  flourishes: boolean
  flourishColor?: string
}

export interface FamilyPalette {
  background: string
  surface: string
  accent: string
  text: string
  textMuted: string
  border: string
}

export interface FamilyRhythm {
  pace: RhythmPace
  quoteEveryN: number
  breathingSpreadEveryN: number
  fullBleedEveryN: number
}

export interface FamilyLayoutBehavior {
  canOffsetPhotos: boolean
  canOverlapPhotos: boolean
  canRotatePhotos: boolean
  canBreakGrid: boolean
  preferredQuotePlacement: QuotePlacement[]
}

export interface FamilyTextBehavior {
  showCaptions: boolean
  showDates: boolean
  showLocationLabels: boolean
  quoteMaxLength: number
  textDensity: TextDensity
}

export interface FamilyConstraints {
  forbidDarkBackgrounds: boolean
  maxPhotosHardLimit: number
  requireSymmetryOnCover: boolean
  avoidFaceNearGutter: boolean
  minPhotoQualityForHero: number
}

export interface SpreadRoleOverride {
  spacingOverride?: Partial<FamilySpacing>
  backgroundOverride?: Partial<FamilyBackground>
  frameOverride?: Partial<FamilyPhotoFrame>
  decorativeOverride?: Partial<FamilyDecorative>
  typographyOverride?: Partial<FamilyTypography>
}

export interface ResolvedFrame {
  borderWidth: number
  borderColor: string
  borderRadius: number
  shadow: string
  rotationRange: [number, number]
  innerPadding: number
}

export interface ResolvedSpreadStyle {
  spacing: FamilySpacing
  background: FamilyBackground
  frame: ResolvedFrame
  typography: FamilyTypography
  decorative: FamilyDecorative
  palette: FamilyPalette
}

export interface DesignFamily {
  id: string
  name: string
  nameHe: string
  description: string
  descriptionHe: string

  bestForType: string[]
  bestForMood: string[]
  bestForStyle: string[]

  spacing: FamilySpacing
  typography: FamilyTypography
  composition: FamilyComposition
  photoFrame: FamilyPhotoFrame
  slotFrameOverrides: Partial<Record<SlotImportance, Partial<FamilyPhotoFrame>>>
  background: FamilyBackground
  decorative: FamilyDecorative
  palette: FamilyPalette
  rhythm: FamilyRhythm
  layoutBehavior: FamilyLayoutBehavior
  textBehavior: FamilyTextBehavior
  spreadRoles: Partial<Record<SpreadRole, SpreadRoleOverride>>
  constraints: FamilyConstraints
}

// ─── Template Variant System ─────────────────────────────────────────

export interface TemplateVariantAdjustments {
  marginBias?: 'left' | 'right' | 'top' | 'bottom'
  scalePhotos?: number
  offsetPrimaryPhoto?: { x: number; y: number }
  allowOverlap?: boolean
  overlapAmount?: number
  captionPlacement?: CaptionPlacement
  quotePlacement?: QuotePlacement
  enforceAsymmetry?: boolean
  photoRotation?: [number, number]
  gapOverride?: number
}

export interface TemplateVariant {
  familyId: string
  templateId: string
  adjustments: TemplateVariantAdjustments
}

// ─── Album Rhythm Orchestrator ───────────────────────────────────────

export interface SpreadSequenceSlot {
  index: number
  role: SpreadRole
  isQuoteSpread: boolean
  isBreathingSpread: boolean
  templateConstraint?: string
  densityHint: DensityLevel
  maxPhotos?: number
}

// ─── Generation Result ──────────────────────────────────────────────

export interface GenerationResult {
  spreads: EditorSpread[]
  analyses: PhotoScore[]
  curated: CuratedPhotoSet
  peopleRoster: AlbumPerson[]
}

export interface AlbumQuestion {
  id: string
  label: string
  multiSelect: boolean
  options: QuestionOption[]
}

export interface QuestionOption {
  id: string
  label: string
  icon?: string
}

export type CoverMaterial = 'linen' | 'white' | 'light-brown'

export interface AlbumConfig {
  type: string | null
  style: string | null
  mood: string | null
  people: string[]
  automationLevel: number
  pages: number
  size: string
  coverType: string
  coverMaterial: CoverMaterial
  designFamily: string | null
  vibeText: string
  backgroundMode: 'white' | 'ai-generated'
}

export interface AlbumSpread {
  id: string
  leftPage: AlbumPage
  rightPage: AlbumPage
}

export interface AlbumPage {
  id: string
  layout: string
  slots: PageSlot[]
  textBlocks: TextBlock[]
}

export interface PageSlot {
  id: string
  photoId: string | null
  x: number
  y: number
  width: number
  height: number
}

export interface TextBlock {
  id: string
  text: string
  x: number
  y: number
  fontSize: 'small' | 'medium' | 'large'
  align: 'right' | 'center' | 'left'
}

export interface GenerationStage {
  id: number
  headline: string
  subtext: string
  startPercent: number
  endPercent: number
  durationMs: number
  notification?: {
    text: string
    atPercent: number
  }
}

export type ScreenStep = 'upload' | 'curate' | 'configure' | 'setup' | 'generating' | 'editor'

export interface PreScoredData {
  allScores?: PhotoScore[]
  curated: CuratedPhotoSet
  dateLookup: Map<string, Date>
}

export interface AlbumSize {
  id: string
  label: string
  closedDimensions: string
  openDimensions: string
  closedW: number
  closedH: number
  openW: number
  openH: number
}

export interface AlbumPricing {
  sizeId: string
  basePages: number
  basePrice: number
  pricePerExtraSpread: number
}

export type SidebarMode = 'page' | 'photo' | 'ai'
export type AuthMode = 'login' | 'signup'

export type OrderStatus = 'draft' | 'processing' | 'printing' | 'shipped' | 'delivered'

export interface UserProject {
  id: string
  title: string
  coverUrl: string
  size: string
  pages: number
  photosCount: number
  lastEdited: string
  progress: number
}

export interface UserOrder {
  id: string
  orderNumber: string
  title: string
  coverUrl: string
  status: OrderStatus
  size: string
  pages: number
  price: number
  orderedAt: string
  estimatedDelivery?: string
}
