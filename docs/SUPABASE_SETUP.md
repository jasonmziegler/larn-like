# Supabase Setup Guide

This guide walks through setting up Supabase for the Larn-Like project, including API key generation and configuration.

## Prerequisites

- Supabase account created at https://supabase.com
- Projects created: `larn-like-dev` and `larn-like-prod`

## API Keys Configuration

### Locating Your API Keys

1. Navigate to your Supabase project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Select **API** from the settings menu
4. You'll find two important keys:
   - **Project URL**: Your Supabase project URL
   - **anon public key**: Safe to use in client-side code (frontend)
   - **service_role key**: **NEVER expose to frontend** - backend only

### Development Environment Setup

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your development project credentials in `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://your-dev-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-dev-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key-here
   SUPABASE_DB_PASSWORD=your-database-password-here
   ```

3. **IMPORTANT**: Never commit `.env.local` to git. It's already in `.gitignore`.

### Production Environment Setup

For production deployment (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `VITE_SUPABASE_URL` - Your production Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your production anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your production service role key (mark as **secret**)
   - Set environment scope to **Production**

4. For preview/staging environments, add the same variables with **Preview** scope

## API Key Security Best Practices

### DO's ✅

- **DO** use separate Supabase projects for development and production
- **DO** use the anon key in frontend applications
- **DO** use the service role key only in backend/serverless functions
- **DO** rotate keys immediately if compromised
- **DO** enable Row Level Security (RLS) policies on all tables
- **DO** use environment variables for all credentials
- **DO** enable API rate limiting in Supabase dashboard

### DON'Ts ❌

- **DON'T** commit `.env.local` or any file containing real credentials
- **DON'T** expose service role key to frontend code
- **DON'T** use production keys in development
- **DON'T** share keys in chat, email, or documentation
- **DON'T** hardcode credentials in source code

## API Key Rotation Procedures

### When to Rotate Keys

- Suspected key compromise or exposure
- Team member with key access leaves
- Regular security maintenance (every 90 days recommended)
- After a security incident

### How to Rotate Keys

#### Development Keys

1. Go to Supabase project dashboard → **Settings** → **API**
2. Click **Reset** next to the key you want to rotate
3. Confirm the reset operation
4. Copy the new key
5. Update `.env.local` with the new key
6. Restart your development server
7. Notify team members to update their local `.env.local` files

#### Production Keys

1. **IMPORTANT**: Plan rotation during low-traffic period
2. In Supabase dashboard → **Settings** → **API**, reset the key
3. Immediately update Vercel environment variables:
   - Go to Vercel → **Settings** → **Environment Variables**
   - Update the affected variable with new key
4. Redeploy your application:
   ```bash
   vercel --prod
   ```
5. Monitor for authentication errors
6. Update any external services using the old key

### Emergency Key Revocation

If a key is compromised:

1. **Immediately** reset the key in Supabase dashboard
2. Update environment variables in all deployment environments
3. Force redeploy all affected applications
4. Review Supabase logs for unauthorized access
5. Enable additional security measures (2FA, IP restrictions if available)
6. Document the incident for security audit

## Separate Keys for Development and Production

This project uses **separate Supabase projects** for isolation:

| Environment | Project | Purpose |
|-------------|---------|---------|
| Development | `larn-like-dev` | Local development and testing |
| Production | `larn-like-prod` | Live production environment |

### Benefits of Separation

- **Data Isolation**: Dev changes don't affect production
- **Security**: Compromised dev keys don't expose production
- **Testing**: Safe environment for schema changes
- **Rate Limits**: Separate quotas for dev and prod

## Verifying Your Setup

After configuring your API keys, verify the setup:

```bash
# Run the Supabase setup verification tests
npm test -- apps/web/tests/integration/supabase-setup.test.ts
```

Expected output:
- ✅ Supabase client initialized
- ✅ Can connect to Supabase
- ✅ Authentication methods available
- ✅ Database access available
- ✅ Realtime capabilities available
- ✅ Storage capabilities available

## Troubleshooting

### "Missing Supabase environment variables" Error

- Verify `.env.local` exists and contains valid credentials
- Restart your development server after adding/changing environment variables
- Check that variable names match exactly (case-sensitive)

### Authentication Fails

- Verify anon key is correct and not expired
- Check that email authentication is enabled in Supabase dashboard
- Ensure redirect URLs are configured correctly

### CORS Errors

- Add your development URL (`http://localhost:3000`) to allowed origins in Supabase dashboard
- For production, add your Vercel domain to allowed origins

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Environment Variables in Vercel](https://vercel.com/docs/environment-variables)
