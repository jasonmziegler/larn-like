# Animation & Micro-interactions

## Motion Principles

**Minimal Animation Philosophy** - ASCII roguelikes rely on character replacement and text updates rather than smooth animations. Motion limited to essential feedback: character position updates, text scrolling, and status changes.

## Key Animations

- **Character Movement:** Immediate position updates with no tweening (Duration: 0ms, authentic roguelike feel)
- **Combat Feedback:** Text-based damage display with brief highlighting (Duration: 500ms, Easing: none)
- **Screen Transitions:** Instant context switching between town/dungeon/shop modes (Duration: 0ms, maintains responsiveness)
- **Death Screen Transition:** Immediate full-screen takeover with no fade effects (Duration: 0ms, emphasizes finality)
- **Blessed Item Enhancement:** Brief white flash on blessing success (Duration: 200ms, Easing: none)

---
