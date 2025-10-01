# Infrastructure Setup & Configuration

## Supabase Service Configuration

**Purpose:** Complete setup procedures for Supabase backend services including database, authentication, and real-time subscriptions.

### Account Setup & Service Provisioning

**1. Supabase Account Creation:**
```bash
# Visit https://supabase.com and create account
# Choose appropriate plan (Free tier for development, Pro for production)
# Create new project: "larn-like-dev" and "larn-like-prod"
```

**2. Database Configuration:**
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial schema using provided SQL schema
-- Configure Row Level Security (RLS) policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
-- (Continue for all tables)

-- Create RLS policies for secure data access
CREATE POLICY "Players can access own data" ON players
FOR ALL USING (auth.uid()::text = auth_id);

CREATE POLICY "Heroes belong to player" ON heroes
FOR ALL USING (player_id IN (SELECT id FROM players WHERE auth_id = auth.uid()::text));
```

**3. Authentication Service Setup:**
```javascript
// Enable authentication providers in Supabase dashboard
// Minimum: Email/Password authentication
// Optional: Google, GitHub OAuth for enhanced user experience
// Configure email templates for registration/password reset
// Set up redirect URLs for production deployment
```

**4. Real-time Subscriptions:**
```sql
-- Enable real-time for required tables
ALTER publication supabase_realtime ADD TABLE monsters;
ALTER publication supabase_realtime ADD TABLE soul_shrines;
ALTER publication supabase_realtime ADD TABLE death_events;
```

### API Key Management

**Development Environment:**
```bash
# .env.local (never commit to git)
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
```

**Production Environment (Vercel):**
```bash
# Configure in Vercel dashboard environment variables
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

## Database Migration Strategy

**Purpose:** Reliable schema evolution and deployment procedures using Supabase migration tools.

### Migration Workflow

**1. Initialize Supabase CLI:**
```bash
# Install Supabase CLI globally
npm install -g supabase

# Login and initialize project
supabase login
supabase init

# Link to remote project
supabase link --project-ref your-project-ref
```

**2. Schema Migration Process:**
```bash
# Create new migration
supabase migration new initial_schema

# Apply migrations to local development
supabase db reset

# Push migrations to remote (production)
supabase db push

# Generate TypeScript types from schema
supabase gen types typescript --local > src/types/supabase.ts
```

**3. Migration File Structure:**
```
supabase/
├── config.toml                    # Project configuration
├── migrations/
│   ├── 20231201000001_initial_schema.sql
│   ├── 20231201000002_add_indexes.sql
│   └── 20231201000003_rls_policies.sql
├── seed.sql                       # Development data
└── functions/                     # Edge functions (if needed)
```

### Schema Versioning & Rollback

**Forward Migration:**
```sql
-- migrations/20231201000001_initial_schema.sql
-- Create tables, indexes, and constraints
-- Include transaction wrapping for atomicity
BEGIN;

CREATE TABLE players (...);
CREATE TABLE heroes (...);
-- ... other tables

COMMIT;
```

**Rollback Procedures:**
```bash
# Rollback to specific migration
supabase db reset --db-url your-database-url

# Manual rollback SQL for production
-- Create rollback scripts for each migration
-- Test rollback procedures in staging environment
```

## Development Environment Setup

**Purpose:** Standardized local development environment with all services integrated and validated.

### Local Development Stack

**1. Prerequisites Installation:**
```bash
# Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 9+

# Git for version control
git --version

# Supabase CLI for database management
supabase --version
```

**2. Project Setup:**
```bash
# Clone repository and install dependencies
git clone <repository-url>
cd larn-like
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Run initial database setup
supabase start
supabase db reset

# Verify services are running
supabase status
```

**3. Service Integration Testing:**
```typescript
// Create test script: scripts/verify-setup.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function verifySetup() {
  // Test database connection
  const { data, error } = await supabase.from('players').select('count');
  console.log('Database connection:', error ? 'FAILED' : 'SUCCESS');

  // Test authentication
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  });
  console.log('Authentication:', authError ? 'FAILED' : 'SUCCESS');

  // Test real-time subscriptions
  const subscription = supabase
    .channel('test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' },
        (payload) => console.log('Real-time:', 'SUCCESS'))
    .subscribe();

  console.log('Setup verification complete');
}

verifySetup();
```

### Development Scripts & Commands

**Package.json additions:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:web\" \"npm run dev:api\"",
    "dev:web": "vite",
    "dev:api": "vercel dev",
    "db:reset": "supabase db reset",
    "db:migrate": "supabase db push",
    "db:seed": "supabase db seed",
    "db:types": "supabase gen types typescript --local > src/types/supabase.ts",
    "verify-setup": "node scripts/verify-setup.js",
    "build": "npm run build:web && npm run build:api",
    "build:web": "vite build",
    "build:api": "vercel build"
  }
}
```

## Security Configuration

**Purpose:** Secure credential management, access controls, and production security measures.

### Row Level Security (RLS) Policies

**Player Data Protection:**
```sql
-- players table policies
CREATE POLICY "Players can view own profile" ON players
FOR SELECT USING (auth.uid()::text = auth_id);

CREATE POLICY "Players can update own profile" ON players
FOR UPDATE USING (auth.uid()::text = auth_id);

-- heroes table policies
CREATE POLICY "Players access own heroes" ON heroes
FOR ALL USING (
  player_id IN (
    SELECT id FROM players WHERE auth_id = auth.uid()::text
  )
);
```

**Game Data Access:**
```sql
-- World data (readable by all authenticated users)
CREATE POLICY "World data readable" ON dungeon_levels
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Monster data readable" ON monsters
FOR SELECT TO authenticated USING (true);

-- Equipment modification restricted to owners
CREATE POLICY "Equipment owned by player" ON equipment_items
FOR ALL USING (
  original_owner IN (
    SELECT name FROM heroes WHERE player_id IN (
      SELECT id FROM players WHERE auth_id = auth.uid()::text
    )
  )
);
```

### Environment Security

**Development Security:**
```bash
# .env.example template
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
LOG_LEVEL=debug

# .gitignore additions
.env
.env.local
.env.production
supabase/.env
```

**Production Security:**
```bash
# Vercel environment variables (configured in dashboard)
# Never expose service role key to frontend
# Use environment-specific Supabase projects
# Enable API rate limiting in Supabase dashboard
# Configure CORS origins for production domain
```

---
