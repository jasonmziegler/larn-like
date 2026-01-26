import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  subscribeToMonsters,
  subscribeToSoulShrines,
  subscribeToDeathEvents,
  unsubscribe,
  getChannelStatus,
} from '../../src/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

describe('Real-time Subscriptions', () => {
  let monstersChannel: RealtimeChannel;
  let shrinesChannel: RealtimeChannel;
  let deathEventsChannel: RealtimeChannel;

  afterAll(async () => {
    // Clean up all subscriptions
    if (monstersChannel) await unsubscribe(monstersChannel);
    if (shrinesChannel) await unsubscribe(shrinesChannel);
    if (deathEventsChannel) await unsubscribe(deathEventsChannel);
  });

  describe('Monster Subscriptions', () => {
    it('should create a subscription channel for monsters', () => {
      monstersChannel = subscribeToMonsters((payload) => {
        console.log('Monster update:', payload);
      });

      expect(monstersChannel).toBeDefined();
      expect(monstersChannel.topic).toBe('monsters-changes');
    });

    it('should have a valid channel state', () => {
      const status = getChannelStatus(monstersChannel);
      expect(['joining', 'joined', 'closed']).toContain(status);
    });
  });

  describe('Soul Shrine Subscriptions', () => {
    it('should create a subscription channel for soul shrines', () => {
      shrinesChannel = subscribeToSoulShrines((payload) => {
        console.log('Soul shrine update:', payload);
      });

      expect(shrinesChannel).toBeDefined();
      expect(shrinesChannel.topic).toBe('soul-shrines-changes');
    });

    it('should have a valid channel state', () => {
      const status = getChannelStatus(shrinesChannel);
      expect(['joining', 'joined', 'closed']).toContain(status);
    });
  });

  describe('Death Event Subscriptions', () => {
    it('should create a subscription channel for death events', () => {
      deathEventsChannel = subscribeToDeathEvents((payload) => {
        console.log('Death event:', payload);
      });

      expect(deathEventsChannel).toBeDefined();
      expect(deathEventsChannel.topic).toBe('death-events-changes');
    });

    it('should have a valid channel state', () => {
      const status = getChannelStatus(deathEventsChannel);
      expect(['joining', 'joined', 'closed']).toContain(status);
    });
  });

  describe('Subscription Management', () => {
    it('should unsubscribe from a channel', async () => {
      const testChannel = subscribeToMonsters(() => {});

      await unsubscribe(testChannel);

      const status = getChannelStatus(testChannel);
      expect(['closed', 'leaving']).toContain(status);
    });
  });
});
