import type { SVGProps } from 'react'

const svgProps: SVGProps<SVGSVGElement> = {
  width: 48,
  height: 48,
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function GlyphCarve(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M6 36 L18 24 L30 20 L42 12" />
      <path d="M30 20 L38 12 L38 20 L30 20" fill="currentColor" opacity="0.25" />
      <circle cx="18" cy="24" r="3" fill="currentColor" />
    </svg>
  )
}

export function GlyphSteep(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M8 38 L40 10" />
      <path d="M40 10 L32 10 L40 18" fill="currentColor" opacity="0.25" />
      <path d="M12 14 L12 22" />
      <path d="M12 18 L20 18" />
    </svg>
  )
}

export function GlyphApex(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M6 38 Q16 38 24 18 Q32 38 42 38" />
      <circle cx="24" cy="18" r="3" fill="currentColor" />
      <path d="M24 18 L24 10" />
    </svg>
  )
}

export function GlyphArea(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M6 38 L6 30 Q16 30 24 16 Q32 30 42 30 L42 38 Z" fill="currentColor" opacity="0.2" />
      <path d="M6 30 Q16 30 24 16 Q32 30 42 30" />
      <path d="M6 38 L42 38" />
    </svg>
  )
}

export function GlyphPortal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M14 8 L14 40" strokeWidth="3" />
      <path d="M34 8 L34 40" strokeWidth="3" />
      <path d="M14 24 L22 24" />
      <path d="M34 24 L26 24" />
      <circle cx="22" cy="24" r="2" fill="currentColor" />
      <circle cx="26" cy="24" r="2" fill="currentColor" />
    </svg>
  )
}

export function GlyphWindSpring(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M8 24 L18 24" />
      <path d="M12 20 L18 24 L12 28" />
      <path d="M28 24 C28 18, 36 18, 36 24 C36 30, 28 30, 28 24" />
      <path d="M36 24 L42 24" />
    </svg>
  )
}

export const GLYPH_COMPONENTS = {
  carve: GlyphCarve,
  steep: GlyphSteep,
  apex: GlyphApex,
  area: GlyphArea,
  portal: GlyphPortal,
  'wind-spring': GlyphWindSpring,
} as const
