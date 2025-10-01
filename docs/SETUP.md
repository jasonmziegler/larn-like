# Larn-Like Web3 Dungeon Crawler - Development Setup Guide

*Quick Start Guide for Developers*
*Last Updated: 2025-09-29*

---

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

### Required Software

```bash
# Node.js 18+ and npm 9+
node --version  # Should output v18.0.0 or higher
npm --version   # Should output 9.0.0 or higher

# Git for version control
git --version

# A modern code editor (VS Code recommended)
# Browser with good developer tools (Chrome/Firefox recommended)
```

### Supabase Account Setup

1. **Create Supabase Account:**
   - Visit [https://supabase.com](https://supabase.com)
   - Sign up for a free account
   - Verify your email address

2. **Create Development Project:**
   - Click "New Project" in Supabase dashboard
   - Organization: Use your personal org or create one
   - Project Name: `larn-like-dev`
   - Database Password: Generate a strong password and save it
   - Region: Choose closest to your location
   - Click "Create new project"

3. **Wait for Project Initialization:**
   - Project setup takes 2-3 minutes
   - You'll see a green "Active" status when ready

---

## Quick Setup (5 Minutes)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd larn-like

# Install all dependencies (frontend + backend + shared)
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Open the file and replace placeholders with real values
```

**Get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the values into `.env.local`:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=development
```

### 3. Database Setup

```bash
# Install Supabase CLI globally
npm install -g supabase

# Initialize Supabase in project
supabase login
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Deploy database schema
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### 4. Start Development Servers

```bash
# Start all services (frontend + backend)
npm run dev

# Or start individually:
npm run dev:web      # Frontend only (port 5173)
npm run dev:api      # Backend only (port 3000)
```

### 5. Verify Setup

```bash
# Run setup verification script
npm run verify-setup

# Should output:
# Database connection: SUCCESS
# Authentication: SUCCESS
# Real-time: SUCCESS
# Setup verification complete
```

**Manual Verification:**
1. Open browser to `http://localhost:5173`
2. You should see the "INSERT COIN" title screen
3. ASCII characters should render properly
4. No console errors in browser developer tools

---

## Detailed Setup Instructions

### Database Schema Deployment

The database schema includes all tables for heroes, monsters, equipment, dungeons, and world state. Here's what gets created:

**Core Tables:**
- `players` - User accounts and authentication
- `heroes` - Individual hero instances (reset on death)
- `monsters` - Baseline and evolved monster data
- `equipment_items` - Weapons, armor, and blessed items
- `dungeon_levels` - Procedurally generated level layouts
- `soul_shrines` - Blessing stations from trapped souls
- `death_events` - Complete death history for event sourcing

**Security Policies:**
- Row Level Security (RLS) enabled on all tables
- Players can only access their own heroes and equipment
- World data (dungeons, monsters) readable by all authenticated users
- Equipment modification restricted to original owners

### Development Database Seeding

```bash
# Create seed data for development
npm run db:seed

# This creates:
# - Monster types (skeleton, vampire_bat, rat, etc.)
# - Basic equipment templates
# - Test dungeon levels 1-3
# - Development user account
```

**Seed Data Includes:**
- **Monster Types:** Skeleton (S), Vampire Bat (V), Rat (R), Spider (s), Orc (O)
- **Equipment Templates:** Basic dagger, leather shirt, iron sword, chain mail
- **Test Levels:** Pre-generated levels 1-3 for immediate testing
- **Dev Account:** `dev@example.com` / `devpassword123` for quick testing

### Local Development Workflow

**Daily Development:**
```bash
# Start your development session
npm run dev

# Make code changes...
# Frontend changes auto-reload via Vite HMR
# Backend changes restart API server automatically

# Run tests
npm test
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

**Database Changes:**
```bash
# Create new migration for schema changes
supabase migration new add_new_feature

# Edit the migration file in supabase/migrations/
# Apply changes locally
supabase db reset

# Generate updated types
npm run db:types

# Push to remote when ready
supabase db push
```

### Troubleshooting

**Common Issues and Solutions:**

**1. "Connection to database failed"**
```bash
# Check Supabase project status
supabase status

# Restart local Supabase
supabase stop
supabase start

# Verify environment variables are correct
cat .env.local
```

**2. "Authentication errors"**
```bash
# Reset local auth state
rm -rf .supabase/auth

# Clear browser local storage
# Go to Application → Storage → Clear All

# Restart development server
npm run dev
```

**3. "Canvas rendering issues"**
```bash
# Check browser console for WebGL errors
# Try different browser
# Ensure hardware acceleration is enabled
# Update graphics drivers if necessary
```

**4. "Type errors after schema changes"**
```bash
# Regenerate types from latest schema
npm run db:types

# Restart TypeScript language server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**5. "Port already in use"**
```bash
# Kill processes on ports 3000 and 5173
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or use different ports
npm run dev:web -- --port 5174
npm run dev:api -- --port 3001
```

---

## Project Structure Overview

```
larn-like/
├── apps/
│   ├── web/                    # Frontend application (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── core/           # Game engine
│   │   │   ├── rendering/      # Canvas ASCII rendering
│   │   │   ├── game/           # Game logic
│   │   │   └── services/       # API integration
│   │   └── public/             # Static assets
│   └── api/                    # Backend application (Vercel Functions)
│       ├── heroes/             # Hero management endpoints
│       ├── world/              # World state endpoints
│       └── shared/             # Shared utilities
├── packages/
│   └── shared/                 # Shared TypeScript types
├── supabase/
│   ├── migrations/             # Database schema migrations
│   └── config.toml            # Supabase configuration
├── docs/                       # Documentation
│   ├── prd.md                 # Product Requirements
│   ├── architecture.md        # Technical Architecture
│   └── SETUP.md              # This file
└── scripts/                    # Development utilities
```

---

## Development Commands Reference

```bash
# Project Setup
npm install                     # Install all dependencies
npm run verify-setup           # Test all services integration

# Development
npm run dev                    # Start frontend + backend
npm run dev:web               # Frontend only (port 5173)
npm run dev:api               # Backend only (port 3000)

# Database
npm run db:reset              # Reset local database
npm run db:migrate            # Apply migrations to remote
npm run db:seed               # Add development seed data
npm run db:types              # Generate TypeScript types

# Testing
npm test                      # Run unit tests
npm run test:e2e             # Run end-to-end tests
npm run test:coverage        # Generate coverage report

# Code Quality
npm run lint                  # ESLint checking
npm run type-check           # TypeScript type checking
npm run format               # Prettier formatting

# Build & Deploy
npm run build                # Build for production
npm run preview              # Preview production build
npm run deploy               # Deploy to Vercel
```

---

## Next Steps

Once your development environment is set up:

1. **Explore the Codebase:**
   - Read through the PRD (`docs/prd.md`) to understand game mechanics
   - Review the architecture (`docs/architecture.md`) for technical details
   - Examine the Epic 0 stories for infrastructure tasks

2. **Start Development:**
   - Begin with Epic 0 stories (infrastructure setup completion)
   - Implement Epic 1 (core game loop) once infrastructure is solid
   - Follow the story acceptance criteria for guidance

3. **Join Development:**
   - All infrastructure blocking issues from the PO checklist have been addressed
   - Epic 4 scope has been reduced to MVP-appropriate level
   - Database migration strategy is now in place
   - Development environment is fully documented and tested

---

## Support

If you encounter issues not covered in this guide:

1. Check the troubleshooting section above
2. Review error logs in browser console and terminal
3. Verify all environment variables are correctly configured
4. Ensure Supabase project is active and accessible
5. Try the setup verification script to isolate issues

The development environment has been designed to work reliably across different operating systems and development setups. Most issues stem from environment variable misconfiguration or Supabase project connectivity.

---

*Setup Guide Complete - Addresses all PO Master Checklist infrastructure requirements*