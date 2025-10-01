# Accessibility Requirements

## Compliance Target

**Standard:** WCAG 2.1 AA Compliance with selective AAA features where achievable without compromising authentic roguelike experience.

## Key Requirements

### Visual Accessibility

**Color contrast ratios:** All intensity levels exceed WCAG AA standards (7.6:1 to 21:1 ratios)

**Focus indicators:** Bright green (#00FF00) highlighting for keyboard navigation with clear visual distinction

**Text sizing:** Monospace fonts maintain layout integrity across browser zoom levels up to 200%

**Alternative color schemes:** Amber-on-black option available for users with green color vision deficiencies

### Interaction Accessibility

**Keyboard navigation:** Complete game playability using only keyboard inputs - WASD/arrow movement, number keys for inventory, `<`/`>` for navigation, `?` for help

**Screen reader support:**
- Essential information always announced (health, combat, critical status)
- Interactive elements clearly identified with context
- Balanced detail level for gameplay efficiency
- Logical reading order through interface regions

**Touch targets:** Not applicable - keyboard-only interaction design eliminates touch/click requirements

### Content Accessibility

**Alternative text:** ASCII symbols mapped to descriptive text for screen readers:
- `@` = "Player character"
- `+` = "Soul shrine"
- `*` = "Blessed item indicator"
- Monster letters = "Monster type, level, and evolution status"

**Heading structure:** Clear information hierarchy using screen reader heading navigation through game interface sections

**Form labels:** All interactive elements (inventory items, shop selections) have descriptive labels with context

## Testing Strategy

### **Automated Testing (Weekly):**
- axe-core accessibility audit for HTML structure compliance
- WAVE browser extension for contrast and navigation validation
- Lighthouse accessibility scoring for performance benchmarks

### **Screen Reader Testing (Monthly):**
- NVDA (Windows), JAWS (Windows), VoiceOver (Mac) compatibility testing
- Complete gameplay sessions using only screen reader output
- Navigation testing through all game areas and contexts

### **User Testing with Disabled Gamers (Quarterly):**
- 3-5 participants with diverse accessibility needs
- 60-90 minute remote testing sessions with think-aloud protocol
- Focus on pain points, navigation confusion, and missing information

---
