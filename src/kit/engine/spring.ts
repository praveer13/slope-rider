/**
 * Critically-damped spring for arrow tips (design §12: stiffness 500, damping 40).
 */
export class Spring {
  x: number
  y: number
  vx = 0
  vy = 0
  tx: number
  ty: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.tx = x
    this.ty = y
  }

  set(x: number, y: number) {
    this.x = x
    this.y = y
    this.tx = x
    this.ty = y
    this.vx = 0
    this.vy = 0
  }

  update(dtMs: number, stiffness = 500, damping = 40) {
    const dt = Math.min(0.033, dtMs / 1000)
    this.vx += (this.tx - this.x) * stiffness * dt
    this.vy += (this.ty - this.y) * stiffness * dt
    const dr = Math.exp(-damping * dt)
    this.vx *= dr
    this.vy *= dr
    this.x += this.vx * dt
    this.y += this.vy * dt
  }
}
