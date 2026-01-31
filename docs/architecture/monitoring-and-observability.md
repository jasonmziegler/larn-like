# Monitoring and Observability

> **PHASE NOTE:** This document describes the full target architecture including cloud services. For Epics 1-4, all persistence is browser-local (localStorage/IndexedDB). Cloud components (Supabase, Vercel Functions, WebSockets, REST API) are deferred to Epic 5. Sections marked **(Epic 5)** do not apply to Epics 1-4.

## Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics for Core Web Vitals and user interactions
- **Backend Monitoring** **(Epic 5):** Vercel Functions monitoring for serverless performance
- **Error Tracking:** Built-in Vercel error reporting with custom error context
- **Performance Monitoring:** Custom Canvas rendering performance tracking

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and stack traces
- API response times from client perspective
- User interactions and game session duration

**Backend Metrics** **(Epic 5):**
- Request rate and response time per endpoint
- Error rate and error types
- Database query performance
- Serverless function cold start times

**Game-Specific Metrics:**
- Canvas rendering performance (frame rate)
- Game session duration and completion rates
- Death event processing time
- Monster evolution queue performance

---
