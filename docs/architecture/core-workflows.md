# Core Workflows

> **PHASE NOTE:** This document describes the full target architecture including cloud services. For Epics 1-4, all persistence is browser-local (localStorage/IndexedDB). Cloud components (Supabase, Vercel Functions, WebSockets, REST API) are deferred to Epic 5. Sections marked **(Epic 5)** do not apply to Epics 1-4.

## Hero Death and World Evolution Workflow

### Epics 1-4 (Local)

```mermaid
sequenceDiagram
    participant Player as Player (Browser)
    participant GE as Game Engine
    participant LS as localStorage

    Player->>GE: Attack monster (final blow to hero)
    GE->>GE: Calculate damage, hero HP = 0
    GE->>GE: Process death event locally
    GE->>GE: Promote killer monster (+1 level, +stats)
    GE->>GE: Transfer hero equipment to monster
    GE->>GE: Create soul shrine at death location
    GE->>GE: Generate teeth drop (1-32)
    GE->>LS: Save updated world state
    GE->>Player: Display death screen with consequences
```

### Epic 5+ (Cloud)

```mermaid
sequenceDiagram
    participant Player as Player (Browser)
    participant GE as Game Engine
    participant WS as World Sync Service
    participant DEP as Death Event Processor
    participant MES as Monster Evolution Service
    participant EMS as Equipment Management Service
    participant SSS as Soul Shrine Service
    participant DB as Database Service
    participant RT as Real-time Service

    Player->>GE: Attack monster (final blow to hero)
    GE->>GE: Calculate damage, hero HP = 0
    GE->>WS: POST /heroes/{id}/combat (hero death)
    WS->>DEP: Process death event

    DEP->>DB: Begin transaction
    DEP->>DB: Create DeathEvent record
    DEP->>MES: Promote killer monster
    MES->>DB: Update monster stats and level

    DEP->>EMS: Transfer equipped items
    EMS->>DB: Move items to monster equipment slots

    DEP->>SSS: Create soul shrine
    SSS->>DB: Create shrine on level or queue

    DEP->>DB: Generate teeth drop at death location
    DEP->>DB: Commit transaction
    DEP->>RT: Broadcast world update events
    RT-->>WS: MonsterEvolutionEvent
    WS->>GE: Update local world state
    GE->>Player: Display death screen with consequences
```

## Soul Shrine Blessing Interaction Workflow

### Epics 1-4 (Local)

```mermaid
sequenceDiagram
    participant Player as Player (Browser)
    participant GE as Game Engine
    participant LS as localStorage

    Player->>GE: Approach soul shrine
    GE->>GE: Display shrine info (Hero_Name's Shrine)
    Player->>GE: Interact with shrine
    GE->>GE: Calculate blessing probability
    alt Blessing successful
        GE->>GE: Enhance selected equipment stats
    else Blessing failed
        GE->>GE: Degrade or destroy equipment
    end
    GE->>GE: Mark shrine as consumed
    GE->>LS: Save updated world state
    GE->>Player: Display blessing result
```

### Epic 5+ (Cloud)

```mermaid
sequenceDiagram
    participant Player as Player (Browser)
    participant GE as Game Engine
    participant WS as World Sync Service
    participant SSS as Soul Shrine Service
    participant EMS as Equipment Management Service
    participant DB as Database Service

    Player->>GE: Approach soul shrine
    GE->>GE: Display shrine info (Player_Name's Shrine)
    Player->>GE: Interact with shrine
    GE->>WS: POST /shrines/{id}/bless
    WS->>SSS: Process blessing attempt

    SSS->>DB: Validate shrine is active
    SSS->>EMS: Get hero equipment for blessing
    SSS->>SSS: Calculate blessing probability

    alt Blessing successful
        SSS->>EMS: Enhance random equipment
        EMS->>DB: Update item with blessed status
        SSS->>DB: Mark shrine as used/destroyed
    else Blessing failed
        SSS->>DB: Mark shrine as used/destroyed
    end

    WS->>GE: Update local shrine state
    GE->>Player: Display blessing result
```

## New Hero World Discovery Workflow

### Epics 1-4 (Local)

```mermaid
sequenceDiagram
    participant Player as Player (Browser)
    participant GE as Game Engine
    participant LS as localStorage

    Player->>GE: Insert Coin, Create Hero
    GE->>GE: Create hero with base stats
    GE->>LS: Save new hero state

    Player->>GE: Enter dungeon (level 1)
    GE->>LS: Load level 1 world state
    LS->>GE: Return level with evolved monsters, shrines, teeth
    GE->>Player: Render dungeon with persistent world elements

    Player->>GE: Inspect evolved monster
    Note over Player: Monster details show:<br/>- "Skeleton - Slayer of 2 Heroes"<br/>- Trophy equipment list<br/>- Enhanced stats from evolution

    Player->>GE: Collect teeth from death site
    GE->>GE: Update hero teeth currency
    GE->>LS: Save hero state
```

### Epic 5+ (Cloud)

```mermaid
sequenceDiagram
    participant Player as Player (Browser)
    participant GE as Game Engine
    participant WS as World Sync Service
    participant LGS as Level Generation Service
    participant MES as Monster Evolution Service
    participant DB as Database Service

    Player->>GE: Insert Coin, Create Hero
    GE->>WS: POST /heroes (new hero creation)
    WS->>DB: Create hero with base stats

    Player->>GE: Enter dungeon (level 1)
    GE->>WS: GET /world/levels/1
    WS->>LGS: Retrieve level 1
    LGS->>MES: Get evolved monsters for level
    MES->>DB: Query monsters with kill histories
    WS->>GE: Return level with evolved monsters

    Player->>GE: Inspect evolved monster
    Note over Player: Monster details show:<br/>- "Skeleton - Slayer of 2 Heroes"<br/>- Trophy equipment list<br/>- Enhanced stats from evolution

    Player->>GE: Collect teeth from death site
    GE->>WS: POST /heroes/{id}/collect-teeth
    WS->>DB: Update hero teeth currency
```

---
