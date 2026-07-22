# Map screen contract (pinned decisions)

Same pattern as Phase World (design/screens/map.md there is the reference):

- Vertical scroll of 6 zone cards (design §3 names/accents/taglines) =
  accent-gradient panel + procedural glyph (inline SVG per zone:
  carve | steep | apex | area | portal | wind-spring) + name + tagline +
  lock overlay with gate label ("Clear Zone N finale").
- 9 node chips per zone: 8 circles + 1 hex finale; locked/open/1–3★ states;
  tap → `/play?level=<id>`.
- Boss card "The Avalanche" after zone 6 → `/boss`; locked until all 6
  finales cleared.
- Level ids "1-1".."6-8", finales "N-9" with `finale: true` (numeric order).
- Unlock rules: zone 1 open; zone N needs zone N−1 finale; finale N-9 needs
  zone N's 8; boss needs all 6 finales. `currentNodeId` = first
  unlocked-uncleared, else boss if open, else last.
- Scroll padding from kit Layout's chrome offset only — pages never add
  their own safe-area padding.
