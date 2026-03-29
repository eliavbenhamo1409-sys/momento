import type { ResolvedSpreadStyle, ResolvedFrame } from '../../types'

export const DEFAULT_FRAME: ResolvedFrame = {
  borderWidth: 0,
  borderColor: 'transparent',
  borderRadius: 8,
  shadow: 'none',
  rotationRange: [0, 0],
  innerPadding: 0,
}

export const DEFAULT_STYLE: ResolvedSpreadStyle = {
  spacing: { pageMarginPercent: 6, photoGapPx: 10, whiteSpaceRatio: 0.30, breathingRoom: 'normal', asymmetric: false },
  background: { color: '#FFFFFF', allowPhotoBlur: true, photoBlurOpacity: 0.06, photoBlurPx: 60, allowTexture: true, textureType: 'paper', textureOpacity: 0.015 },
  frame: DEFAULT_FRAME,
  typography: { quoteFont: 'Heebo', quoteWeight: 300, quoteSizeClass: 'text-lg', quoteItalic: false, quoteLineHeight: 1.8, quoteLetterSpacing: '0.02em', quoteAlign: 'center', captionFont: 'Plus Jakarta Sans', captionWeight: 400, captionSizeClass: 'text-[10px]' },
  decorative: { philosophy: 'minimal', quoteMarks: 'simple', dividers: 'thin-line', cornerOrnaments: false, accentLines: true, accentLineColor: 'rgba(180,175,165,0.25)', scriptOverlays: null, gradientWash: null, flourishes: false },
  palette: { background: '#FFFFFF', surface: '#FAF4ED', accent: '#9E9686', text: '#2D2823', textMuted: '#A09A92', border: 'rgba(45,40,35,0.06)' },
}

export function getTexturePattern(type: string): string {
  switch (type) {
    case 'paper':
      return 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")'
    case 'linen':
      return 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'1\' fill=\'%23000\' opacity=\'0.03\'/%3E%3C/svg%3E")'
    case 'grain':
      return 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'g\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23g)\' opacity=\'0.3\'/%3E%3C/svg%3E")'
    case 'watercolor':
      return 'url("data:image/svg+xml,%3Csvg width=\'300\' height=\'300\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'w\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.03\' numOctaves=\'5\' seed=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23w)\' opacity=\'0.15\'/%3E%3C/svg%3E")'
    default:
      return 'none'
  }
}
