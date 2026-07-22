# Boss screen contract — THE AVALANCHE (pinned decisions)

## Flow

1. Banner per ridge ("Carve" / "Portals" / "Spring Rule") on ridge entry.
2. The avalanche wall chases left→right: starts 2 u/s under rider speed,
   +0.5 u/s per ridge. Distance shown as a screen-edge meter (jagged white
   edge + numeric distance — shape + text, never color-only).
3. **Caught = soft rewind:** game-side `rewindToCheckpoint()` — rider resets
   to the current ridge start, wall resets 6u back, neutral wind-settle
   sound, ghost-rider replay of the canonical line starts. NEVER
   `Session.doMiss()` (no red flash, no miss counter, no punishment).
4. Shards sit ON the canonical line only — no detours under pressure.
5. Win at the basin: avalanche settles into slow snow (release, not
   defeat), victory letterbox + Fragment 3 reveal card.

## Rules

- No timers, no countdowns, no lives, no fail screens. The chase is spatial
  and its distance is always visible. Retry is free and instant.
- Stars: 1★ finish; 2★ ≥ 60% light; 3★ ≥ 90% light.
- Rewards: 150 gears, 200 XP; card "The White Wall"; Fragment 3 unlock.
- Terrain: 3 ridge courses from the zone-6 finale family (exact segments in
  build data, authored under the same §4 constraints as levels: C0, band,
  gaps marked).
- Ridge 3 spring section: k = 1.2 fixed, x₀ mid-valley (no editor in boss).
- HUD: same as gameplay (SlopeChip, AreaBar showing run total, StarMeter) +
  ridge banner + wall meter. Pause sheet per kit. Mid-level persist includes
  current ridge + wall distance.
