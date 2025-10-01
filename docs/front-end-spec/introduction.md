# Introduction

Based on the PRD, this document defines the user experience goals, information architecture, user flows, and visual design specifications for **Larn-Like Web3 Dungeon Crawler**'s user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user-centered experience.

The core UX challenge is communicating the innovative persistent world mechanics where player deaths become permanent world-building events through community-driven environmental storytelling. Each new hero discovers a world shaped by strangers' deaths, creating archaeological discovery rather than personal revenge narratives.

**Enhanced Death Screen Framework:**
```
Lvl 1 Player_Name slain by Lvl 1 Vampire Bat.
Player_Name dropped X teeth in death.
Lvl 1 Vampire Bat leveled up and descended deeper into the dungeon with Player_Name's Dagger.
The rest of Player_Name's belongings have been scattered by rats.
Player_Name's soul was trapped at Dungeon Level X.
Play again?
```

**Key UX Insights from User Journey Analysis:**
- **Fresh hero discovery** - Each character encounters artifacts and evolved monsters created by unknown previous players, fostering curiosity about world history
- **Community world-building** - Death contributes to shared environmental challenges rather than personal narrative threads
- **Archaeological engagement** - Finding "Sarah's Iron Sword" or "Marcus's Shield" creates historical flavor without personal attachment
- **Environmental storytelling** - Evolved monsters display kill counts and equipment as world lore, not personal vendetta targets

**Core UX Principles:**
1. **Clean slate psychology** - Every hero starts completely fresh with no connection to previous attempts
2. **Discovery-driven exploration** - Named equipment and evolved monsters tell stories of strangers, creating atmospheric depth
3. **Community consequence visibility** - Clear feedback showing how each death shapes the world for future players
4. **Immediate mechanical understanding** - Death screen education ensures players grasp the persistent world system from first death

## Overall UX Goals & Principles

### Target User Personas

**Roguelike Veterans (Marcus)**
Technical professionals and dedicated gamers familiar with NetHack, Rogue, DCSS who appreciate keyboard-first ASCII gameplay and complex mechanics. They expect responsive controls, information density, and strategic depth. Skeptical of innovation unless it proves meaningful complexity.

**Curious Newcomers (Emma)**
Players attracted by innovative persistent world mechanics but new to traditional roguelikes. Need gentle guidance and clear feedback while discovering the ASCII aesthetic. Excited by revolutionary game concepts but require scaffolding to reach competency.

### Usability Goals

**Universal Performance Standards:**
- **Responsive interaction:** Sub-200ms input response maintains fluid gameplay for veterans while providing immediate feedback for newcomers
- **Immediate death comprehension:** Both personas understand persistent world mechanics from first death screen experience

**Veteran-Specific Goals:**
- **Information accessibility:** All game data (monster stats, equipment, world state) immediately accessible through familiar hotkey patterns
- **Strategic depth validation:** Complex mechanics prove meaningful within 8-20 minutes of play

**Newcomer-Specific Goals:**
- **Basic competency achievement:** Successfully navigate, fight, and understand core loop within 5 minutes
- **Innovation appreciation:** "Aha!" moment recognizing death-as-world-building within 15 minutes of first play

### Design Principles

**1. Dual-Track Information Architecture**
Design systems that serve both information-hungry veterans and newcomer guidance needs simultaneously. Core mechanics accessible without tutorials; optional contextual hints available on demand without disrupting experienced player flow.

**2. Authentic ASCII with Modern Clarity**
Honor 1980s terminal aesthetic while ensuring visual hierarchy and readability for newcomers. Balance nostalgic authenticity with accessibility requirements for diverse players.

**3. Death as Universal Teacher**
Transform traditional roguelike failure into positive world-building education. Death screen must satisfy both skeptical veterans seeking mechanical depth and confused newcomers needing emotional reframing.

**4. Progressive Complexity Revelation**
Reveal sophisticated systems (equipment, town, evolution) gradually through natural gameplay discovery rather than overwhelming initial presentations. Veterans discover through exploration; newcomers through guided experience.

**5. Performance-First Innovation**
Innovative persistent world mechanics must never compromise the responsive, fluid interaction that veterans demand and newcomers need for confidence building.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-28 | v1.0 | Initial UX goals based on PRD analysis and persona journey mapping | Sally (UX Expert) |

---
