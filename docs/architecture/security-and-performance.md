# Security and Performance

> **PHASE NOTE:** This document describes the full target architecture including cloud services. For Epics 1-4, all persistence is browser-local (localStorage/IndexedDB). Cloud components (Supabase, Vercel Functions, WebSockets, REST API) are deferred to Epic 5. Sections marked **(Epic 5)** do not apply to Epics 1-4.

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' wss://realtime.supabase.co`
- XSS Prevention: Input sanitization and Content Security Policy
- Secure Storage: JWT tokens in httpOnly cookies, sensitive data encrypted

**Backend Security** **(Epic 5):**
- Input Validation: Comprehensive validation using shared TypeScript interfaces
- Rate Limiting: 100 requests per minute per IP, 1000 per hour per authenticated user
- CORS Policy: Restricted to allowed origins, credentials included for authenticated requests

**Authentication Security** **(Epic 5):**
- Token Storage: JWT in secure httpOnly cookies with SameSite protection
- Session Management: Automatic token refresh, secure logout
- Password Policy: Handled by Supabase Auth with best practices

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <500KB total bundle size
- Loading Strategy: Code splitting by route, lazy loading for non-critical components
- Caching Strategy: Service Worker for offline play, localStorage for game state

**Backend Performance** **(Epic 5):**
- Response Time Target: <200ms for all API endpoints
- Database Optimization: Optimized indexes, query performance monitoring
- Caching Strategy: Redis for session data, PostgreSQL query result caching

---
