import { supabase } from './supabase';

/**
 * Storage service for managing game assets and save data
 */

const GAME_ASSETS_BUCKET = 'game-assets';
const SAVE_DATA_BUCKET = 'save-data';

/**
 * Upload a file to the game assets bucket
 */
export async function uploadGameAsset(
  file: File,
  path: string
): Promise<{ path: string; url: string }> {
  const { data, error } = await supabase.storage
    .from(GAME_ASSETS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(GAME_ASSETS_BUCKET)
    .getPublicUrl(path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Get public URL for a game asset
 */
export function getGameAssetUrl(path: string): string {
  const { data } = supabase.storage
    .from(GAME_ASSETS_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Save hero data to storage
 */
export async function saveHeroData(
  userId: string,
  heroId: string,
  data: object
): Promise<void> {
  const path = `${userId}/hero-${heroId}.json`;

  const { error } = await supabase.storage
    .from(SAVE_DATA_BUCKET)
    .upload(path, JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      upsert: true, // Overwrite if exists
    });

  if (error) throw error;
}

/**
 * Load hero data from storage
 */
export async function loadHeroData(
  userId: string,
  heroId: string
): Promise<object> {
  const path = `${userId}/hero-${heroId}.json`;

  const { data, error } = await supabase.storage
    .from(SAVE_DATA_BUCKET)
    .download(path);

  if (error) throw error;

  const text = await data.text();
  return JSON.parse(text);
}

/**
 * Delete hero save data
 */
export async function deleteHeroData(
  userId: string,
  heroId: string
): Promise<void> {
  const path = `${userId}/hero-${heroId}.json`;

  const { error } = await supabase.storage
    .from(SAVE_DATA_BUCKET)
    .remove([path]);

  if (error) throw error;
}

/**
 * List all save files for a user
 */
export async function listUserSaves(userId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(SAVE_DATA_BUCKET)
    .list(userId);

  if (error) throw error;

  return data.map((file) => file.name);
}

/**
 * Save user settings
 */
export async function saveUserSettings(
  userId: string,
  settings: object
): Promise<void> {
  const path = `${userId}/settings.json`;

  const { error } = await supabase.storage
    .from(SAVE_DATA_BUCKET)
    .upload(path, JSON.stringify(settings, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) throw error;
}

/**
 * Load user settings
 */
export async function loadUserSettings(userId: string): Promise<object | null> {
  const path = `${userId}/settings.json`;

  const { data, error } = await supabase.storage
    .from(SAVE_DATA_BUCKET)
    .download(path);

  if (error) {
    // Settings don't exist yet
    if (error.message.includes('not found')) {
      return null;
    }
    throw error;
  }

  const text = await data.text();
  return JSON.parse(text);
}
