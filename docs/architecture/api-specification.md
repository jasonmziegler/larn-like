# API Specification

The API design follows the hybrid REST + WebSockets approach from our tech stack, with REST endpoints for user actions and WebSocket connections for real-time world updates. All endpoints use the shared TypeScript interfaces defined in our data models.

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Larn-Like Web3 Dungeon Crawler API
  version: 1.0.0
  description: RESTful API for game actions and world state management
servers:
  - url: https://api.larn-like.vercel.app
    description: Production API server
  - url: http://localhost:3000/api
    description: Local development server

paths:
  # Hero Management
  /heroes:
    post:
      summary: Create new hero (Insert Coin)
      description: Creates a fresh hero with base stats and starting equipment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                playerCredits:
                  type: number
                  description: Available credits for hero creation
                heroName:
                  type: string
                  maxLength: 12
                  description: Player-chosen hero name
      responses:
        201:
          description: Hero created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Hero'

  /heroes/{heroId}/move:
    post:
      summary: Move hero in dungeon
      description: Process hero movement with collision detection
      parameters:
        - name: heroId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                direction:
                  type: string
                  enum: [north, south, east, west]
                newPosition:
                  $ref: '#/components/schemas/Position'
      responses:
        200:
          description: Movement successful

  /heroes/{heroId}/combat:
    post:
      summary: Execute combat action
      description: Process combat between hero and monster
      parameters:
        - name: heroId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                action:
                  type: string
                  enum: [attack, defend, flee]
                targetMonsterId:
                  type: string
      responses:
        200:
          description: Combat resolved

  # World State Management
  /world/levels/{depth}:
    get:
      summary: Get dungeon level data
      description: Retrieve level layout, monsters, and items
      parameters:
        - name: depth
          in: path
          required: true
          schema:
            type: integer
            minimum: 0
      responses:
        200:
          description: Level data retrieved

  # Equipment and Inventory
  /heroes/{heroId}/inventory:
    get:
      summary: Get hero inventory
      description: Retrieve current inventory and equipment
    put:
      summary: Update hero equipment
      description: Equip/unequip items with slot validation

  # Town and Commerce
  /town/merchant:
    get:
      summary: Get merchant inventory
      description: Retrieve available items for purchase

  /town/merchant/purchase:
    post:
      summary: Purchase item from merchant
      description: Buy equipment using teeth currency

  # Soul Shrine Interactions
  /shrines/{shrineId}/bless:
    post:
      summary: Attempt equipment blessing
      description: Try to enhance equipment using soul shrine

components:
  schemas:
    Hero:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        level:
          type: integer
        isAlive:
          type: boolean

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            timestamp:
              type: string
              format: date-time

security:
  - BearerAuth: []
```

## WebSocket Real-Time Events

**Connection Endpoint:** `wss://api.larn-like.vercel.app/realtime`

```typescript
// Outbound Events (Server → Client)
interface WorldUpdateEvent {
  type: 'world_update';
  data: {
    levelDepth: number;
    changes: {
      monstersAdded?: Monster[];
      monstersRemoved?: string[];
      shrinesAdded?: SoulShrine[];
      shrinesRemoved?: string[];
      teethAdded?: TeethDrop[];
      teethCollected?: string[];
    };
  };
}

interface MonsterEvolutionEvent {
  type: 'monster_evolution';
  data: {
    monsterId: string;
    oldLevel: number;
    newLevel: number;
    equipmentGained: EquipmentItem[];
    killedHero: string;
  };
}

interface ShrineCreatedEvent {
  type: 'shrine_created';
  data: {
    shrine: SoulShrine;
    fromDeath: {
      heroName: string;
      level: number;
    };
  };
}
```

---
