# User Flows

## Complete Death-to-Restart Cycle

**User Goal:** Experience death as world-building contribution and start a new hero

**Entry Points:** Combat defeat in dungeon levels 1-∞ only (no town deaths)

**Success Criteria:** Player understands all death consequences through single automatic display, feels motivated to start new hero, new hero enters world with visible death consequences

### Flow Diagram

```mermaid
graph TD
    A[Hero Dies in Dungeon] --> B[Death Screen - Automatic Display]
    B --> C[Show All Death Information Simultaneously]
    C --> C1[Monster Promotion: Last hitter gets level + equipment]
    C --> C2[Soul Shrine: Queued for Level X placement]
    C --> C3[Teeth Drop: XX at death location]
    C --> C4[Equipment Scatter: Remaining gear to chests]
    C --> D[Press Any Key to Continue]
    D --> E[Return to Title Screen]
    E --> F[INSERT COIN Interface]
    F --> G[Create New Hero]
    G --> H[Enter Persistent World]
    H --> I[Discover Death Consequences]

    I --> I1[Encounter Promoted Monster]
    I --> I2[Find Soul Shrine from Queue]
    I --> I3[Collect Death Site Teeth]
    I --> I4[Discover Scattered Equipment in Chests]
```

### Edge Cases & Error Handling:
- **Last Hit Attribution:** Simple last-damage-dealer logic determines monster promotion
- **Town Safety:** No deaths possible in Level 0, eliminates shrine/promotion edge cases
- **Shrine Queue System:** Failed placements queue for next map render, used shrines trigger queue replacement
- **Simultaneous Information:** All consequences displayed together, no timing complexity

## Equipment Management & Town Commerce

**User Goal:** Convert collected teeth into useful equipment and manage 9-slot inventory system

**Entry Points:** Return to town with accumulated teeth, inventory management during dungeon exploration

**Success Criteria:** Successfully purchase equipment using teeth currency, understand equipment slot constraints and management, efficiently transition between town commerce and dungeon exploration

### Flow Diagram

```mermaid
graph TD
    A[Enter Town with Teeth] --> B[Navigate to Merchant]
    B --> C[Shop Interface - Map Replaced with Inventory]
    C --> D[Number Keys 1-9 Select Items]
    D --> E[View Panel Shows Item Details]
    E --> F[Purchase Confirmation]
    F --> G[Equipment Added to Inventory]
    G --> H[Automatic Equipment if Slot Available]
    H --> I[Excess to Town Chest Storage]
    I --> J[Return to Town Map]

    J --> K[< > Navigate to Dungeon Entrance]
    K --> L[> Stairs Down to Level 1]

    G --> G1[Character Card Flip Shows Equipped vs Inventory]
    H --> H1[9-Slot Constraint Management]
    I --> I1[Paginated Chest Access < >]
```

## Soul Shrine Discovery & Blessing

**User Goal:** Discover soul shrines from previous deaths and attempt equipment blessing

**Entry Points:** Exploring dungeon levels where souls were trapped, systematic shrine hunting on specific levels

**Success Criteria:** Successfully identify and interact with soul shrines, understand blessing probability and equipment selection, feel rewarded regardless of blessing success/failure

### Flow Diagram

```mermaid
graph TD
    A[Explore Level X] --> B[Discover Soul Shrine]
    B --> C[View Panel: "Player_Name's Shrine"]
    C --> D[Approach Shrine for Interaction]
    D --> E[Blessing Attempt Initiated]
    E --> F[RNG Blessing Calculation]
    F --> G{Blessing Success?}

    G -->|Yes| H[Random Equipment Enhanced]
    G -->|No| I[Blessing Failed - No Effect]

    H --> J[Equipment Gains Blessed Status + Mod]
    I --> K[Shrine Disappears After Use]
    J --> K
    K --> L[Shrine Queue Triggers Replacement]
    L --> M[Continue Exploration]

    B --> B1[Shrine from Death Queue]
    H --> H1[Equipment Naming: "Blessed Player_Name's Item"]
    J --> J1[Inventory Shows Enhanced Stats]
```

---
