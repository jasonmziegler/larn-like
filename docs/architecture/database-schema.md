# Database Schema

```sql
-- Enable UUID extension for globally unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table for authentication and session management
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id TEXT UNIQUE NOT NULL, -- Supabase auth user ID
    username VARCHAR(50) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Heroes table with temporary progression that resets on death
CREATE TABLE heroes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(12) NOT NULL, -- Limited for equipment naming
    level INTEGER DEFAULT 1,
    base_hp INTEGER DEFAULT 30,
    base_strength INTEGER DEFAULT 10,
    base_dexterity INTEGER DEFAULT 10,
    base_constitution INTEGER DEFAULT 10,
    current_hp INTEGER DEFAULT 30,
    current_strength DECIMAL(3,1) DEFAULT 10.0, -- Support +0.1 reagent bonuses
    current_dexterity DECIMAL(3,1) DEFAULT 10.0,
    current_constitution DECIMAL(3,1) DEFAULT 10.0,
    teeth_currency INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 0, -- Dungeon level (0 = town)
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    is_alive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_heroes_player_alive (player_id, is_alive),
    INDEX idx_heroes_location (current_level, position_x, position_y)
);

-- Equipment items with naming and blessing support
CREATE TABLE equipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- "Sarah's Iron Sword" format
    base_name VARCHAR(30) NOT NULL, -- "Iron Sword" without owner
    type VARCHAR(20) NOT NULL, -- weapon, helmet, bodyArmor, etc.
    subtype VARCHAR(20), -- sword, dagger, ring, etc.
    original_owner VARCHAR(12) NOT NULL, -- First hero to possess this item
    is_blessed BOOLEAN DEFAULT FALSE,
    blessed_by VARCHAR(12), -- Soul shrine hero name

    -- Stat bonuses
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    hp_bonus INTEGER DEFAULT 0,
    strength_bonus INTEGER DEFAULT 0,
    dexterity_bonus INTEGER DEFAULT 0,
    constitution_bonus INTEGER DEFAULT 0,

    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, unique
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_equipment_type CHECK (type IN (
        'weapon', 'offHand', 'helmet', 'bodyArmor', 'gloves',
        'boots', 'ring', 'amulet', 'belt'
    )),

    -- Indexes
    INDEX idx_equipment_type (type),
    INDEX idx_equipment_blessed (is_blessed),
    INDEX idx_equipment_owner (original_owner)
);

-- Hero equipment slots (9-slot system)
CREATE TABLE hero_equipment (
    hero_id UUID NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    slot VARCHAR(20) NOT NULL,
    item_id UUID REFERENCES equipment_items(id) ON DELETE SET NULL,

    PRIMARY KEY (hero_id, slot),

    CONSTRAINT valid_slot CHECK (slot IN (
        'weapon', 'offHand', 'helmet', 'bodyArmor', 'gloves',
        'boots', 'ring1', 'ring2', 'amulet', 'belt'
    ))
);

-- Dungeon levels with procedural layout persistence
CREATE TABLE dungeon_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    depth INTEGER UNIQUE NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    layout_data JSONB NOT NULL, -- Rooms, corridors, stairs positions
    stairs_up_x INTEGER,
    stairs_up_y INTEGER,
    stairs_down_x INTEGER NOT NULL,
    stairs_down_y INTEGER NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_regenerated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_depth CHECK (depth >= 0),
    CONSTRAINT positive_dimensions CHECK (width > 0 AND height > 0),

    -- Indexes
    INDEX idx_levels_depth (depth),
    INDEX idx_levels_regeneration (last_regenerated)
);

-- Monster types and baseline stats
CREATE TABLE monster_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(30) UNIQUE NOT NULL, -- skeleton, vampire_bat, rat
    ascii_char CHAR(1) NOT NULL, -- S, V, R
    base_hp INTEGER NOT NULL,
    base_attack INTEGER NOT NULL,
    base_defense INTEGER DEFAULT 0,
    spawn_weight INTEGER DEFAULT 1 -- For random generation
);

-- Individual monster instances with evolution tracking
CREATE TABLE monsters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_id UUID NOT NULL REFERENCES monster_types(id),
    current_level INTEGER NOT NULL REFERENCES dungeon_levels(depth),
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    evolution_level INTEGER DEFAULT 0, -- Number of promotions

    -- Current stats (modified by evolution)
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    current_attack INTEGER NOT NULL,
    current_defense INTEGER DEFAULT 0,

    is_evolved BOOLEAN DEFAULT FALSE,
    queue_position INTEGER, -- NULL if active, number if queued
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_monsters_level (current_level),
    INDEX idx_monsters_position (current_level, position_x, position_y),
    INDEX idx_monsters_queue (queue_position) WHERE queue_position IS NOT NULL,
    INDEX idx_monsters_evolved (is_evolved, evolution_level)
);

-- Soul shrines created from hero deaths
CREATE TABLE soul_shrines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hero_name VARCHAR(12) NOT NULL, -- Name of soul that created shrine
    level_depth INTEGER NOT NULL REFERENCES dungeon_levels(depth),
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    blessings_granted INTEGER DEFAULT 0,
    queue_position INTEGER, -- NULL if placed, number if queued
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Only one active shrine per position
    UNIQUE(level_depth, position_x, position_y) WHERE is_active = TRUE,

    INDEX idx_shrines_level (level_depth),
    INDEX idx_shrines_active (is_active),
    INDEX idx_shrines_queue (queue_position) WHERE queue_position IS NOT NULL
);

-- Death events for event sourcing and audit trail
CREATE TABLE death_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hero_id UUID NOT NULL REFERENCES heroes(id),
    hero_name VARCHAR(12) NOT NULL,
    killer_monster_id UUID NOT NULL REFERENCES monsters(id),
    death_level INTEGER NOT NULL,
    death_x INTEGER NOT NULL,
    death_y INTEGER NOT NULL,
    teeth_dropped INTEGER NOT NULL CHECK (teeth_dropped BETWEEN 1 AND 32),
    soul_shrine_created BOOLEAN DEFAULT TRUE,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Event sourcing data
    equipment_transferred JSONB, -- Items given to killer
    equipment_scattered JSONB, -- Items distributed to chests

    INDEX idx_deaths_time (processed_at),
    INDEX idx_deaths_location (death_level, death_x, death_y),
    INDEX idx_deaths_monster (killer_monster_id)
);

-- Performance optimizations
CREATE INDEX CONCURRENTLY idx_monsters_level_active ON monsters(current_level) WHERE queue_position IS NULL;
CREATE INDEX CONCURRENTLY idx_equipment_search ON equipment_items(type, rarity, is_blessed);

-- Views for common queries
CREATE VIEW active_monsters AS
SELECT m.*, mt.name as type_name, mt.ascii_char
FROM monsters m
JOIN monster_types mt ON m.type_id = mt.id
WHERE m.queue_position IS NULL;

CREATE VIEW evolved_monsters_summary AS
SELECT m.id, mt.name as type_name, m.current_level, m.evolution_level,
       COUNT(mk.id) as kill_count,
       ARRAY_AGG(mk.hero_name ORDER BY mk.killed_at) as victims
FROM monsters m
JOIN monster_types mt ON m.type_id = mt.id
LEFT JOIN monster_kills mk ON m.id = mk.monster_id
WHERE m.is_evolved = TRUE
GROUP BY m.id, mt.name, m.current_level, m.evolution_level;
```

---
