# Introduction

This document outlines the complete fullstack architecture for **Larn-Like Web3 Dungeon Crawler**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

The unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for this modern fullstack application where client-side game mechanics and server-side world persistence are deeply intertwined.

## Starter Template or Existing Project

**Decision:** Greenfield project with custom vanilla TypeScript frontend and Vercel/Supabase backend as specified in PRD requirements.

Based on my review of the PRD, this is a greenfield project with specific technology preferences mentioned:
- Frontend: Vanilla TypeScript with Canvas 2D API
- Backend: Vercel serverless functions with Supabase PostgreSQL
- Monorepo structure with shared TypeScript interfaces

Given the specific Canvas 2D ASCII rendering requirements and performance targets (60fps, sub-200ms), I recommend proceeding with the custom vanilla approach as specified in the PRD to maintain maximum control over rendering optimization.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-28 | v1.0 | Initial architecture creation based on PRD v1.3 and UI/UX Specification v1.0 | Winston (Architect) |

---
