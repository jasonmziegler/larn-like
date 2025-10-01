# Information Architecture (IA)

## Site Map / Screen Inventory

```mermaid
graph TD
    A[Title Screen - INSERT COIN] --> B[Main Game Interface]
    B --> B1[Town - Level 0]
    B --> B2[Dungeon Levels 1-∞]
    B --> B3[Death Screen - Full Takeover]

    B1 --> B1A[Town Map View]
    B1 --> B1B[Shop Inventory Overlay]
    B1 --> B1C[Town Storage Chest]

    B2 --> B2A[Dungeon Map View]
    B2 --> B2B[Combat Interface]
    B2 --> B2C[Monster Inspection Panel]
    B2 --> B2D[Soul Shrine Interaction]

    B3 --> A[Return to Title]

    B1A --> B2A[Stairs Down >]
    B2A --> B1A[Stairs Up <]
    B2A --> B2A[Town Portal - Direct to B1A]
    B1C --> B1C[Pagination < >]
```

## Navigation Structure

**Primary Navigation:** Context-sensitive `<` and `>` keys
- **Dungeon Context:** `<` = up levels (toward town), `>` = down levels (deeper)
- **Pagination Context:** `<` = previous page, `>` = next page
- **Emergency Exit:** Town Portal hotkey for direct Level X → Town escape

**Secondary Navigation:** Number keys (1-9) for item/inventory interaction
- **Inventory Management:** Direct hotkey access to carried items
- **Shop Interaction:** Number-based selection in merchant overlays
- **Equipment System:** Immediate equip/use through numbered inventory

**Breadcrumb Strategy:** Location display shows current context
- **Town:** "LOCATION: Town (Level 0)"
- **Dungeon:** "LOCATION: Dungeon Level X"
- **Shop:** "LOCATION: [Merchant Name] - Town"

---
