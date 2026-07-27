# Gameplay screen contract v3 (pinned decisions — build agents read this)

## Anatomy

- One `ShapeRideSession` (kit Session subclass) drives both modes on one
  canvas, one Engine. Phase machine: `shape | ride | freeze`.
- HUD row (both modes): back IconButton, StarMeter (stars-earned-so-far),
  pause IconButton.
- **SHAPE mode HUD:** per-window INK chips (top-left, only budgeted
  windows), Ride NeonButton (bottom-center, 56px), Z6 rule pencil
  (top-right). Intro card scrim (name, goal, coach ≤ 6 words, "Drag the
  knots. Tap Ride.") dismisses on tap.
- **RIDE mode HUD:** SlopeChip (top-left), AreaBar (bottom edge),
  edit-line pencil (top-right), Z6 rule pencil below it.
- Pause sheet: Resume / Edit line (ride only) / Ghost hint / Restart /
  Settings / Quit to map. Mid-level persist: knot y's, attempts, rule,
  ghostDismissed (phase always resumes to SHAPE).

## Input (canon-pinned)

- **SHAPE:** press within 44px of a knot → vertical drag; knots snap to
  0.25u with haptic+sfx tick per quantum; release inside budget = line
  chime, over budget = soft buzz + INK chip goes coral. Nothing else
  intercepts the finger.
- **RIDE:** carve zone top 75% (hold, or toggle per Settings), hop zone
  bottom 25% tap. pointercancel = release. Ride starts with auto-carve
  until the player's first touch ends it.
- Long-press must never summon OS selection (global no-select + canvas
  touch-action none + contextmenu suppressed — see AGENTS.md).

## Camera

- SHAPE: `frameContent()` fits the WHOLE level (bedrock + windows + goal)
  with 1.5u pad; engine fitWorld minScale lowered to 6 for this (kit
  default 26 preserved for chase/VECTO-era callers).
- RIDE: v2 chase cam (lookahead + ease), entered by tween from the shape
  fit — the zoom-in IS the mode transition.
- Freeze: camera holds during the 900ms freeze, tweens back to the
  whole-level fit for TUNE.

## Rendering

- Bedrock: zone-accent glow line. Player line: per-sample derivative tint
  (mint flat → cyan/violet downhill → amber/red uphill; uphill ALSO dashed —
  sign is never color-only).
- SHAPE extras: anchor diamonds, clamp-band dashes (coral when over
  budget), knot beads + 44px affordance rings, drag guide rail, ghost
  solution (dashed + pulsing knot rings) when ghostVisible.
- Freeze marker: pulsing amber ring + ≤5-word reason label ("stalled —
  steeper before this", "the gate is here", "faster for the door", "too
  much sky — soften it").
- Perf caps unchanged: ≤ 64 samples per terrain piece per frame,
  ≤ 40 speed lines.

## Ghost hint

- Solution knots rendered as the ghost line (NOT kit hintPath, NOT a ghost
  rider). Auto-shows entering SHAPE with attempts ≥ 3 (ghostHints setting,
  dismissable), always available from pause.

## Physics render

- Unchanged from v2: fixed 120 Hz accumulator, alpha interpolation, 60 Hz
  fallback at hardwareConcurrency ≤ 4, CCD landing, portal E-conservation
  asserted by the harness.
