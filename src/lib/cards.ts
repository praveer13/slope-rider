/**
 * SLOPE RIDER codex cards + archive fragments.
 * Cards mirror VECTO/Phase World CardMeta shape; fragments are game-specific unlockables.
 */

export interface CardMeta {
  id: string
  zone: number
  front: string
  term: string
  note: string
  foundIn: string
  foundLabel: string
}

const C = (
  zone: number,
  n: 1 | 2 | 3,
  front: string,
  term: string,
  note: string,
  foundIn: string,
  foundLabel: string,
): CardMeta => ({
  id: `z${zone}-${n}`,
  zone,
  front,
  term,
  note,
  foundIn,
  foundLabel,
})

/** The 18 collectible concept cards (design §10) + the boss reward card. */
export const CARDS: CardMeta[] = [
  // Zone 1 — mint
  C(1, 1, "Draw the hill down and it pushes you. Steeper down, bigger push.", "The Push", "tangential gravity: a = g·sinθ.", "1-2", "Level 1-2"),
  C(1, 2, "Release your line and Vex rides it — until gravity wins.", "Letting Go", "projectile motion: ẍ = (0,−g).", "1-5", "Level 1-5"),
  C(1, 3, "Draw a climb and it drinks the speed the drop paid for.", "Uphill Cost", "energy: v²/2 + g·h = const.", "1-9", "First Descent finale"),

  // Zone 2 — cyan
  C(2, 1, "Every line you draw has a number: how much up for how much across.", "Rise Over Run", "slope m = Δy/Δx.", "2-2", "Level 2-2"),
  C(2, 2, "Your line's number is the rider's steering wheel.", "The Speedometer", "derivative f′(x) = lim Δy/Δx.", "2-5", "Level 2-5"),
  C(2, 3, "Down lines push; up lines pull. Steeper means stronger.", "Sign Language", "sign and magnitude of f′.", "2-9", "Steep Reading finale"),

  // Zone 3 — violet
  C(3, 1, "Where your line's number is zero, things get interesting.", "Flat Tops", "critical points: f′(x) = 0.", "3-2", "Level 3-2"),
  C(3, 2, "Draw a crest and it hands Vex the sky for a heartbeat.", "The Launch Window", "local maximum: f′ = 0, f″ < 0.", "3-5", "Level 3-5"),
  C(3, 3, "A bowl in your line catches Vex and throws her forward.", "Valley Floors", "local minimum: f′ = 0, f″ > 0.", "3-9", "Apex Ridge finale"),

  // Zone 4 — amber
  C(4, 1, "Light doesn't vanish. It piles up under your line.", "Piling Up", "accumulation function A(x) = ∫ₐˣ f.", "4-2", "Level 4-2"),
  C(4, 2, "The higher your line, the bigger the pile beneath it.", "Tall Holds More", "area scales with function values.", "4-5", "Level 4-5"),
  C(4, 3, "Every scrap of line feeds the pile, whether you see it or not.", "Every Bit Counts", "A′(x) = f(x) (FTC part 1).", "4-9", "Lightfields finale"),

  // Zone 5 — magenta
  C(5, 1, "Doors trade height-pile for speed. Exactly.", "The Trade", "FTC: ∫ₐᵇ f′ = f(b) − f(a).", "5-2", "Level 5-2"),
  C(5, 2, "What your line gives up, a door can give back.", "Two-Way Door", "derivative and integral are inverse operations.", "5-5", "Level 5-5"),
  C(5, 3, "A door trades height and speed to the last crumb, never rounding.", "Exact Change", "conservation E = v²/2 + g·h.", "5-9", "Portal Peaks finale"),

  // Zone 6 — coral
  C(6, 1, "Write a number k. The wind pushes k-hard, always — even uphill.", "The Wind Rule", "ODE ẍ = k → constant acceleration.", "6-2", "Level 6-2"),
  C(6, 2, "Far from your line's center, the spring pulls harder. Rule, not wall.", "The Spring Rule", "ẍ = −k(x−x₀) → harmonic motion.", "6-5", "Level 6-5"),
  C(6, 3, "Every motion rule draws its own hill in your head.", "Rules Make Shapes", "ODEs and their solution curves.", "6-9", "Wind & Spring finale"),

  // Boss reward card
  {
    id: "the-white-wall",
    zone: 6,
    front: "The mountain lets go. You read it, not fight it.",
    term: "The Avalanche",
    note: "Pursuit on a slope: stay low, stay fast, stay ahead.",
    foundIn: "boss",
    foundLabel: "Survive The Avalanche",
  },
]

export const cardById = (id: string): CardMeta | undefined =>
  CARDS.find((c) => c.id === id)

export const cardsForLevel = (levelId: string): CardMeta[] =>
  CARDS.filter((c) => c.foundIn === levelId)

export interface FragmentMeta {
  id: string
  title: string
  quote: string
  prompt: string
  answer: string
  unlockLevel: string
}

export const FRAGMENTS: FragmentMeta[] = [
  {
    id: "fragment-1",
    title: "The First Speedometer",
    quote:
      "We shall call that motion equally and uniformly accelerated which, starting from rest, acquires during equal time-intervals equal increments of speed.",
    prompt: "Equal speed steps in equal times — what shape is your speed's graph?",
    answer: "a straight line / ramp",
    unlockLevel: "3-9",
  },
  {
    id: "fragment-2",
    title: "The Geometric Pile",
    quote:
      "Population, when unchecked, increases in a geometrical ratio. Subsistence increases only in an arithmetical ratio.",
    prompt: "Geometric piles rule which wind-swept curve?",
    answer: "exponential — the runaway pile; dP/dt = rP has P = P₀e^{rt}",
    unlockLevel: "5-9",
  },
  {
    id: "fragment-3",
    title: "The Sum Sign",
    quote:
      "Utile erit scribi ∫ pro omn. l (\"It will be useful to write ∫ for omnia l — the sum of all the l's.\")",
    prompt: "∫ is just a long S. What is the AreaBar summing?",
    answer: "the light under the hill — infinitely many thin strips",
    unlockLevel: "boss",
  },
]

export const fragmentById = (id: string): FragmentMeta | undefined =>
  FRAGMENTS.find((f) => f.id === id)
