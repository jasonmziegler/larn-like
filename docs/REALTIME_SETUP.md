# Real-time Subscriptions Setup Guide

This guide explains how to enable and configure real-time subscriptions in Supabase for the Larn-Like game.

## Overview

Real-time subscriptions allow the game to receive live updates when data changes in the database. This is critical for:
- **Monster Evolution**: Players see monsters evolve in real-time as other players die
- **World State Changes**: Soul shrines and death sites appear instantly
- **Live World Consequences**: Death events trigger immediate world updates

## Enabling Real-time in Supabase Dashboard

### Step 1: Access Database Replication Settings

1. Log in to your Supabase project dashboard
2. Navigate to **Database** in the left sidebar
3. Click on **Replication** tab

### Step 2: Enable Real-time for Required Tables

By default, Supabase creates a publication called `supabase_realtime`. You need to add tables to this publication.

#### Option A: Using the Dashboard (Recommended for beginners)

1. In the **Replication** tab, you'll see a list of tables
2. Find each required table and toggle the **Real-time** switch:
   - ✅ `monsters` - For monster evolution updates
   - ✅ `soul_shrines` - For world state changes
   - ✅ `death_events` - For live world consequences

#### Option B: Using SQL (Recommended for automation)

1. Navigate to **SQL Editor** in the left sidebar
2. Create a new query
3. Run the following SQL:

```sql
-- Enable real-time for game tables
ALTER PUBLICATION supabase_realtime ADD TABLE monsters;
ALTER PUBLICATION supabase_realtime ADD TABLE soul_shrines;
ALTER PUBLICATION supabase_realtime ADD TABLE death_events;
```

4. Click **Run** to execute

### Step 3: Configure Row Level Security (RLS)

Real-time subscriptions respect RLS policies. Ensure your tables have appropriate policies:

```sql
-- Allow authenticated users to read world data
CREATE POLICY "Anyone can view monsters"
  ON monsters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view soul shrines"
  ON soul_shrines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view death events"
  ON death_events FOR SELECT
  TO authenticated
  USING (true);
```

### Step 4: Verify Real-time is Enabled

Run this query to confirm which tables have real-time enabled:

```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Expected output should include:
- monsters
- soul_shrines
- death_events

## Performance Optimization Settings

### Publication Filters (Optional)

To reduce bandwidth, you can filter which changes trigger real-time events:

```sql
-- Only broadcast INSERT and UPDATE events (ignore DELETE)
ALTER PUBLICATION supabase_realtime
  SET (publish = 'insert, update');
```

### Rate Limiting

In your Supabase dashboard:
1. Go to **Settings** → **API**
2. Configure **Real-time** settings:
   - Max connections per client: 100 (default)
   - Max events per second: 100 (default)
   - Adjust based on your game's needs

## Testing Real-time Subscriptions

### Manual Test in Supabase Dashboard

1. Open two browser tabs with your Supabase project
2. In Tab 1: Go to **Table Editor** → `monsters`
3. In Tab 2: Open **SQL Editor** and run:
   ```sql
   -- This simulates a real-time listener
   LISTEN monsters;
   ```
4. In Tab 1: Insert or update a monster record
5. In Tab 2: You should see a notification

### Automated Test

Run the real-time test suite:

```bash
npm test -- apps/web/tests/integration/realtime.test.ts
```

## Monitoring Real-time Usage

### Dashboard Metrics

1. Go to **Settings** → **Usage**
2. Check **Real-time** section for:
   - Active connections
   - Messages per second
   - Bandwidth usage

### Troubleshooting

#### No Real-time Updates Received

1. **Check table is in publication:**
   ```sql
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```

2. **Verify RLS policies allow reads:**
   - Test query as authenticated user
   - Check policy definitions

3. **Check client subscription:**
   - Ensure channel is subscribed
   - Verify filter conditions are correct

#### Connection Drops Frequently

- Check network stability
- Verify Supabase project region matches your location
- Review rate limits in Settings → API

#### High Latency on Updates

- Check publication filters (too many events)
- Review RLS policy complexity (slow queries)
- Consider upgrading Supabase plan for better performance

## Best Practices

### DO's ✅

- **DO** enable real-time only for tables that need live updates
- **DO** use specific channel subscriptions with filters
- **DO** implement reconnection logic in your client
- **DO** unsubscribe from channels when components unmount
- **DO** use RLS policies to control what users can see

### DON'Ts ❌

- **DON'T** enable real-time for all tables (performance impact)
- **DON'T** subscribe to entire tables without filters
- **DON'T** leave subscriptions open when not needed
- **DON'T** broadcast sensitive data without RLS protection
- **DON'T** ignore connection errors (implement error handling)

## Production Considerations

### Scaling

For high-traffic production:
1. Consider using Supabase Pro plan (higher limits)
2. Implement client-side throttling/debouncing
3. Use presence features to track active users
4. Monitor real-time metrics regularly

### Security

1. **Always use RLS policies** - Real-time respects RLS
2. **Filter sensitive columns** - Don't broadcast passwords, tokens
3. **Validate on server-side** - Never trust client real-time data alone
4. **Rate limit client connections** - Prevent abuse

## Additional Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Real-time Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Real-time Authorization](https://supabase.com/docs/guides/realtime/authorization)
