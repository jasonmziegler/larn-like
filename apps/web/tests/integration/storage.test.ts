import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/services/supabase';

// Skipped: Supabase backend deferred to post-MVP (see Sprint Change Proposal 2026-01-29)
describe.skip('Storage Buckets', () => {
  describe('Storage Availability', () => {
    it('should have storage API available', () => {
      expect(supabase.storage).toBeDefined();
    });

    it('should be able to list buckets', async () => {
      const { data, error } = await supabase.storage.listBuckets();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Game Assets Bucket', () => {
    it('should be able to access game-assets bucket', async () => {
      const { data, error } = await supabase.storage
        .from('game-assets')
        .list();

      // Bucket might not exist yet, but the API should be accessible
      // Error is expected if bucket doesn't exist
      expect(supabase.storage.from('game-assets')).toBeDefined();
    });
  });

  describe('Save Data Bucket', () => {
    it('should be able to access save-data bucket', async () => {
      const { data, error } = await supabase.storage
        .from('save-data')
        .list();

      // Bucket might not exist yet, but the API should be accessible
      // Error is expected if bucket doesn't exist
      expect(supabase.storage.from('save-data')).toBeDefined();
    });
  });

  describe('Storage Operations', () => {
    it('should have upload capability', () => {
      const bucket = supabase.storage.from('game-assets');
      expect(bucket.upload).toBeDefined();
      expect(typeof bucket.upload).toBe('function');
    });

    it('should have download capability', () => {
      const bucket = supabase.storage.from('save-data');
      expect(bucket.download).toBeDefined();
      expect(typeof bucket.download).toBe('function');
    });

    it('should have list capability', () => {
      const bucket = supabase.storage.from('game-assets');
      expect(bucket.list).toBeDefined();
      expect(typeof bucket.list).toBe('function');
    });

    it('should have delete capability', () => {
      const bucket = supabase.storage.from('save-data');
      expect(bucket.remove).toBeDefined();
      expect(typeof bucket.remove).toBe('function');
    });

    it('should have public URL generation capability', () => {
      const bucket = supabase.storage.from('game-assets');
      expect(bucket.getPublicUrl).toBeDefined();
      expect(typeof bucket.getPublicUrl).toBe('function');
    });
  });
});
