import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Real-time subscription service for game world updates
 */

export interface MonsterUpdate {
  id: string;
  level: number;
  evolution_count: number;
  // Add other monster fields as needed
}

export interface SoulShrineUpdate {
  id: string;
  hero_name: string;
  location_x: number;
  location_y: number;
  // Add other shrine fields as needed
}

export interface DeathEventUpdate {
  id: string;
  hero_id: string;
  dungeon_level: number;
  // Add other death event fields as needed
}

type SubscriptionCallback<T> = (payload: RealtimePostgresChangesPayload<T>) => void;

/**
 * Subscribe to monster evolution updates
 */
export function subscribeToMonsters(
  callback: SubscriptionCallback<MonsterUpdate>
): RealtimeChannel {
  const channel = supabase
    .channel('monsters-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'monsters',
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to soul shrine updates
 */
export function subscribeToSoulShrines(
  callback: SubscriptionCallback<SoulShrineUpdate>
): RealtimeChannel {
  const channel = supabase
    .channel('soul-shrines-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'soul_shrines',
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to death event updates
 */
export function subscribeToDeathEvents(
  callback: SubscriptionCallback<DeathEventUpdate>
): RealtimeChannel {
  const channel = supabase
    .channel('death-events-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // Only listen for new death events
        schema: 'public',
        table: 'death_events',
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to specific monster by ID
 */
export function subscribeToMonster(
  monsterId: string,
  callback: SubscriptionCallback<MonsterUpdate>
): RealtimeChannel {
  const channel = supabase
    .channel(`monster-${monsterId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'monsters',
        filter: `id=eq.${monsterId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a real-time channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll(): Promise<void> {
  await supabase.removeAllChannels();
}

/**
 * Get channel status
 */
export function getChannelStatus(channel: RealtimeChannel): string {
  return channel.state;
}
