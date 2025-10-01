# Development Workflow

## Local Development Setup

### Prerequisites
```bash
# Install Node.js 18+ and npm
node --version  # 18+
npm --version   # 9+

# Install dependencies
npm install
```

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd larn-like

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
npm run db:migrate

# Seed initial data
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
```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:3000/api

# Backend (.env)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-connection-string

# Shared
NODE_ENV=development
LOG_LEVEL=debug
```

---
