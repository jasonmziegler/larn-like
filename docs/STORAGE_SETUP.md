# Supabase Storage Setup Guide

This guide explains how to create and configure storage buckets in Supabase for the Larn-Like game.

## Overview

Supabase Storage provides S3-compatible object storage for game assets and save data. For this project, we'll create two buckets:
- **game-assets**: Static game files (sprites, tiles, sounds)
- **save-data**: Hero save files and game progress

## Creating Storage Buckets

### Step 1: Access Storage Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket** button

### Step 2: Create Game Assets Bucket

1. Click **New bucket**
2. Configure the bucket:
   - **Name**: `game-assets`
   - **Public**: ✅ Enable (static assets should be publicly accessible)
   - **File size limit**: 50MB (default)
   - **Allowed MIME types**: Leave empty or specify:
     - `image/*` (for sprites and tiles)
     - `audio/*` (for sound effects)
     - `application/json` (for asset manifests)
3. Click **Create bucket**

### Step 3: Create Save Data Bucket

1. Click **New bucket**
2. Configure the bucket:
   - **Name**: `save-data`
   - **Public**: ❌ Disable (private user data)
   - **File size limit**: 10MB (save files are small)
   - **Allowed MIME types**:
     - `application/json` (save file format)
3. Click **Create bucket**

## Configuring Bucket Permissions

### Game Assets Bucket (Public)

Since game assets are public, configure policies to allow:
- **Read**: Anyone (authenticated or anonymous)
- **Write**: Only authorized users/services

```sql
-- Allow public downloads of game assets
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'game-assets');

-- Allow authenticated users to upload assets (for development)
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'game-assets');
```

### Save Data Bucket (Private)

Save data should only be accessible by the owner:

```sql
-- Users can only access their own save files
CREATE POLICY "Users can read own saves"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'save-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own saves"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'save-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own saves"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'save-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own saves"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'save-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Setup CORS Policies

### For Development

1. In Supabase dashboard, go to **Storage** → **Configuration**
2. Add CORS allowed origins:
   - `http://localhost:3000` (dev server)
   - `http://127.0.0.1:3000` (alternative localhost)

### For Production

Add your production domain:
- `https://your-domain.vercel.app`
- `https://www.your-domain.com`

### Via Dashboard

1. Navigate to **Storage** → **Configuration** → **CORS**
2. Click **Add new CORS policy**
3. Configure:
   - **Allowed Origins**: Your domain(s)
   - **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`
   - **Allowed Headers**: `*` or specific headers
   - **Max Age**: `3600` (1 hour)

## File Organization Structure

### Game Assets Bucket

```
game-assets/
├── sprites/
│   ├── hero/
│   │   ├── warrior.png
│   │   └── mage.png
│   └── monsters/
│       ├── goblin.png
│       └── dragon.png
├── tiles/
│   ├── dungeon-floor.png
│   └── walls.png
├── sounds/
│   ├── attack.mp3
│   └── death.mp3
└── manifest.json
```

### Save Data Bucket

```
save-data/
└── {user_id}/
    ├── hero-{hero_id}.json
    └── settings.json
```

## Storage Usage Patterns

### Uploading Game Assets

```typescript
import { supabase } from './supabase';

async function uploadAsset(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('game-assets')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  return data;
}
```

### Downloading Assets

```typescript
async function getAssetUrl(path: string): Promise<string> {
  const { data } = supabase.storage
    .from('game-assets')
    .getPublicUrl(path);

  return data.publicUrl;
}
```

### Saving Hero Data

```typescript
async function saveHeroData(userId: string, heroId: string, data: object) {
  const path = `${userId}/hero-${heroId}.json`;

  const { error } = await supabase.storage
    .from('save-data')
    .upload(path, JSON.stringify(data), {
      contentType: 'application/json',
      upsert: true // Overwrite if exists
    });

  if (error) throw error;
}
```

### Loading Hero Data

```typescript
async function loadHeroData(userId: string, heroId: string) {
  const path = `${userId}/hero-${heroId}.json`;

  const { data, error } = await supabase.storage
    .from('save-data')
    .download(path);

  if (error) throw error;

  const text = await data.text();
  return JSON.parse(text);
}
```

## Storage Limitations

### Free Tier Limits

- **Storage**: 1 GB total
- **Bandwidth**: 2 GB per month
- **File uploads**: 50 MB max per file

### Pro Tier Limits

- **Storage**: 100 GB included
- **Bandwidth**: 200 GB per month included
- **File uploads**: 5 GB max per file

### Best Practices

1. **Compress images**: Use WebP or optimized PNG
2. **Cache aggressively**: Set long cache control headers for static assets
3. **CDN usage**: Supabase Storage includes CDN by default
4. **Cleanup old saves**: Implement retention policies for abandoned saves
5. **Monitor usage**: Track storage usage in dashboard

## Testing Storage

### Manual Test

1. Go to **Storage** → Select bucket
2. Click **Upload file**
3. Choose a test file and upload
4. Verify file appears in bucket
5. Try downloading the file

### Automated Test

Run the storage integration tests:

```bash
npm test -- apps/web/tests/integration/storage.test.ts
```

## Monitoring Storage Usage

### Dashboard Metrics

1. Go to **Storage** in Supabase dashboard
2. View metrics:
   - Total storage used
   - Bandwidth consumption
   - Request count
   - Error rates

### Storage Cleanup

Implement automated cleanup for old files:

```sql
-- Find files older than 90 days in save-data
SELECT *
FROM storage.objects
WHERE bucket_id = 'save-data'
  AND created_at < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Upload Fails with 403 Forbidden

- Verify bucket policies allow INSERT
- Check authentication token is valid
- Ensure file path matches policy rules

### CORS Errors

- Add your domain to allowed origins
- Check CORS configuration in Storage settings
- Verify request headers match allowed headers

### File Not Found (404)

- Verify file path is correct (case-sensitive)
- Check bucket name matches
- Ensure file was uploaded successfully

### Storage Quota Exceeded

- Review storage usage in dashboard
- Delete unnecessary files
- Upgrade to Pro plan if needed

## Security Considerations

### DO's ✅

- **DO** use Row Level Security policies
- **DO** organize files by user ID for isolation
- **DO** validate file types and sizes before upload
- **DO** implement rate limiting for uploads
- **DO** use signed URLs for temporary access

### DON'Ts ❌

- **DON'T** store sensitive data without encryption
- **DON'T** allow unlimited public uploads
- **DON'T** use predictable file names
- **DON'T** expose internal file structure
- **DON'T** skip virus/malware scanning for user uploads

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [CDN and Caching](https://supabase.com/docs/guides/storage/cdn)
