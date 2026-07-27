import type { Session, SessionEvents } from './session.js'

export type SessionCtor<TLevel, TExtras extends object> = new (
  canvas: HTMLCanvasElement,
  level: TLevel,
  events: SessionEvents<TExtras>,
) => Session<TLevel, TExtras>

export interface SessionRegistry<TLevel, TExtras extends object> {
  register(key: string, ctor: SessionCtor<TLevel, TExtras>): void
  create(
    key: string,
    canvas: HTMLCanvasElement,
    level: TLevel,
    events: SessionEvents<TExtras>,
  ): Session<TLevel, TExtras>
}

export function createSessionRegistry<
  TLevel,
  TExtras extends object = {},
>(): SessionRegistry<TLevel, TExtras> {
  const registry = new Map<string, SessionCtor<TLevel, TExtras>>()
  return {
    register(key, ctor) {
      registry.set(key, ctor)
    },
    create(key, canvas, level, events) {
      const ctor = registry.get(key)
      if (!ctor) throw new Error(`Unknown session key: ${key}`)
      return new ctor(canvas, level, events)
    },
  }
}
