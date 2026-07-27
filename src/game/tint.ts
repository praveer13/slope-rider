/**
 * The line wears its derivative (design v3 §5.3): hue by sign/magnitude of
 * f′ — mint flat → cyan/violet downhill → amber/red uphill. Shared by the
 * gameplay renderer and the Results "your line" thumbnail.
 */
export function slopeTint(m: number): string {
  const c = Math.max(-2.5, Math.min(2.5, m))
  if (Math.abs(c) < 0.08) return '#E8F0FF'
  if (c < 0) {
    const t = -c / 2.5
    return `hsl(${160 + t * 105} 90% ${62 - t * 8}%)`
  }
  const t = c / 2.5
  return `hsl(${42 - t * 34} 92% ${60 - t * 6}%)`
}
