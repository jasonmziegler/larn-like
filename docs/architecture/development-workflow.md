# Development Workflow

> **PHASE NOTE:** This document describes the full target architecture including cloud services. For Epics 1-4, all persistence is browser-local (localStorage/IndexedDB). Cloud components (Supabase, Vercel Functions, WebSockets, REST API) are deferred to Epic 5. Sections marked **(Epic 5)** do not apply to Epics 1-4.

## Local Development Setup

### Epics 1-4 Quick Start
```bash
# Clone repository and install dependencies
git clone <repository-url>
cd larn-like
npm install

# Start the game (no backend needed)
npm run dev:web
```

No environment variables, database setup, or backend services are required for Epics 1-4.

### Prerequisites
```bash
# Install Node.js 18+ and npm
node --version  # 18+
npm --version   # 9+

# Install dependencies
npm install
```

### Initial Setup (Full Stack — Epic 5)
```bash
# Clone repository
git clone <repository-url>
cd larn-like

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials **(Epic 5)**

# Run database migrations **(Epic 5)**
npm run db:migrate

# Seed initial data **(Epic 5)**
npm run db:seed
```

### Development Commands
```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:web

# Start backend only
npm run dev:api

# Run tests
npm run test
npm run test:e2e
npm run test:coverage
```

## Environment Configuration

### Required Environment Variables

For Epics 1-4, no environment variables are required. The following are needed for Epic 5:

```bash
# Frontend (.env.local) **(Epic 5)**
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3000/api

# Backend (.env) **(Epic 5)**
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-connection-string

# Shared
NODE_ENV=development
LOG_LEVEL=debug
```

---
