import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/services/supabase';

// Skipped: Supabase backend deferred to post-MVP (see Sprint Change Proposal 2026-01-29)
describe.skip('Supabase Setup Verification', () => {
  it('should have valid Supabase configuration', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should be able to connect to Supabase', async () => {
    const { data, error } = await supabase.auth.getSession();

    // We expect no error (even if session is null for unauthenticated users)
    expect(error).toBeNull();
  });

  it('should have authentication methods available', () => {
    expect(supabase.auth.signUp).toBeDefined();
    expect(supabase.auth.signInWithPassword).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
    expect(supabase.auth.getUser).toBeDefined();
  });

  it('should have database access available', () => {
    expect(supabase.from).toBeDefined();
  });

  it('should have realtime capabilities', () => {
    expect(supabase.channel).toBeDefined();
  });

  it('should have storage capabilities', () => {
    expect(supabase.storage).toBeDefined();
  });
});
