/**
 * TikTok LIVE Event Tracking Service
 * 
 * Connects to TikTok's internal WebSocket "Webcast" service to capture
 * real-time events from LIVE streams including:
 * - Gift events (power-ups)
 * - Battle events
 * - Chat messages
 * - Viewer joins
 */

import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import type { 
  WebcastGiftMessage, 
  WebcastLinkMicBattle,
  WebcastChatMessage,
  WebcastMemberMessage 
} from 'tiktok-live-connector';
import { prisma } from './prisma';
import { PowerUpType } from '@prisma/client';

// Map TikTok gift names to our PowerUpType enum
const GIFT_TO_POWERUP_MAP: Record<string, PowerUpType> = {
  'magic_mist': PowerUpType.MAGIC_MIST,
  'Magic Mist': PowerUpType.MAGIC_MIST,
  'vault_glove': PowerUpType.VAULT_GLOVE,
  'Vault Glove': PowerUpType.VAULT_GLOVE,
  'No.2_booster': PowerUpType.NO2_BOOSTER,
  'No.2 Booster': PowerUpType.NO2_BOOSTER,
  'No.3_booster': PowerUpType.NO3_BOOSTER,
  'No.3 Booster': PowerUpType.NO3_BOOSTER,
  'stun_hammer': PowerUpType.STUN_HAMMER,
  'Stun Hammer': PowerUpType.STUN_HAMMER,
  'glove': PowerUpType.GLOVE,
  'Glove': PowerUpType.GLOVE,
  'time_maker': PowerUpType.TIME_MAKER,
  'Time Maker': PowerUpType.TIME_MAKER,
};

// Default expiration times for power-ups (in hours)
const POWERUP_EXPIRY_HOURS: Record<PowerUpType, number> = {
  [PowerUpType.MAGIC_MIST]: 48,
  [PowerUpType.VAULT_GLOVE]: 48,
  [PowerUpType.NO2_BOOSTER]: 24,
  [PowerUpType.NO3_BOOSTER]: 24,
  [PowerUpType.STUN_HAMMER]: 72,
  [PowerUpType.GLOVE]: 48,
  [PowerUpType.TIME_MAKER]: 24,
};

interface TikTokLiveSessionConfig {
  tiktokUsername: string;
  creatorId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export class TikTokLiveService {
  private connection: TikTokLiveConnection | null = null;
  private config: TikTokLiveSessionConfig;
  private isTracking: boolean = false;
  private currentBattleId: string | null = null;

  constructor(config: TikTokLiveSessionConfig) {
    this.config = config;
  }

  /**
   * Start tracking TikTok LIVE events
   */
  async start(): Promise<void> {
    if (this.isTracking) {
      throw new Error('Already tracking this stream');
    }

    console.log(`[TikTok LIVE] Starting tracking for @${this.config.tiktokUsername}`);

    // Create connection
    this.connection = new TikTokLiveConnection(this.config.tiktokUsername, {
      processInitialData: true,
      enableExtendedGiftInfo: true,
      fetchRoomInfoOnConnect: true,
    });

    // Set up event handlers
    this.setupEventHandlers();

    // Connect to the stream
    try {
      const state = await this.connection.connect();
      this.isTracking = true;
      console.log(`[TikTok LIVE] Connected to room ${state.roomId}`);
      
      if (this.config.onConnected) {
        this.config.onConnected();
      }
    } catch (error) {
      console.error('[TikTok LIVE] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Stop tracking TikTok LIVE events
   */
  stop(): void {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
      this.isTracking = false;
      this.currentBattleId = null;
      console.log('[TikTok LIVE] Stopped tracking');
      
      if (this.config.onDisconnected) {
        this.config.onDisconnected();
      }
    }
  }

  /**
   * Get current tracking status
   */
  getStatus(): { isTracking: boolean; username: string; roomId?: string } {
    return {
      isTracking: this.isTracking,
      username: this.config.tiktokUsername,
      roomId: this.connection?.roomId,
    };
  }

  /**
   * Set up all event handlers for the TikTok LIVE connection
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Control Events
    this.connection.on(ControlEvent.CONNECTED, (state) => {
      console.log(`[TikTok LIVE] Connected to room ${state.roomId}`);
    });

    this.connection.on(ControlEvent.DISCONNECTED, ({ code, reason }) => {
      console.log(`[TikTok LIVE] Disconnected: ${reason} (code: ${code})`);
      this.isTracking = false;
      if (this.config.onDisconnected) {
        this.config.onDisconnected();
      }
    });

    this.connection.on(ControlEvent.ERROR, (error) => {
      console.error('[TikTok LIVE] Error:', error);
      if (this.config.onError) {
        this.config.onError(error);
      }
    });

    // Message Events
    this.connection.on(WebcastEvent.GIFT, (data: WebcastGiftMessage) => {
      this.handleGift(data);
    });

    this.connection.on(WebcastEvent.LINK_MIC_BATTLE, (data: WebcastLinkMicBattle) => {
      this.handleBattle(data);
    });

    this.connection.on(WebcastEvent.CHAT, (data: WebcastChatMessage) => {
      console.log(`[TikTok LIVE] Chat: ${data.uniqueId}: ${data.comment}`);
    });

    this.connection.on(WebcastEvent.MEMBER, (data: WebcastMemberMessage) => {
      console.log(`[TikTok LIVE] ${data.uniqueId} joined`);
    });

    this.connection.on(ControlEvent.WEBSOCKET_CONNECTED, () => {
      console.log('[TikTok LIVE] WebSocket connected');
    });
  }

  /**
   * Handle gift events (power-ups)
   */
  private async handleGift(data: WebcastGiftMessage): Promise<void> {
    try {
      const giftName = data.giftName;
      const uniqueId = data.uniqueId;
      const repeatCount = data.repeatCount || 1;
      const repeatEnd = data.repeatEnd ?? true; // True for single gifts

      console.log(`[TikTok LIVE] Gift: ${uniqueId} sent ${giftName} x${repeatCount} (repeatEnd: ${repeatEnd})`);

      // Only process when streak ends or for non-streakable gifts
      if (!repeatEnd) {
        console.log(`[TikTok LIVE] Streak in progress, waiting for end...`);
        return;
      }

      // Check if this gift is a power-up
      const powerUpType = GIFT_TO_POWERUP_MAP[giftName];
      if (!powerUpType) {
        console.log(`[TikTok LIVE] Gift "${giftName}" is not a tracked power-up`);
        return;
      }

      // Get or create viewer
      const viewer = await this.getOrCreateViewer(uniqueId, data.profilePictureUrl);

      // Calculate expiration
      const awardedAt = new Date();
      const expiryHours = POWERUP_EXPIRY_HOURS[powerUpType];
      const expiryAt = new Date(awardedAt.getTime() + expiryHours * 60 * 60 * 1000);

      // Create power-up entry for each repeat
      for (let i = 0; i < repeatCount; i++) {
        const powerup = await prisma.powerups.create({
          data: {
            type: powerUpType,
            holder_viewer_id: viewer.id,
            creator_id: this.config.creatorId,
            awarded_at: awardedAt,
            expiry_at: expiryAt,
            source: `tiktok_live_${this.connection?.roomId || 'unknown'}`,
            active: true,
          },
        });

        // Create CREATED event
        await prisma.powerup_events.create({
          data: {
            powerup_id: powerup.id,
            kind: 'CREATED',
            at: awardedAt,
            meta: {
              tiktok_username: uniqueId,
              gift_name: giftName,
              room_id: this.connection?.roomId,
              battle_id: this.currentBattleId,
              gift_id: data.giftId,
              diamond_count: data.diamondCount,
            },
          },
        });

        console.log(`[TikTok LIVE] ✅ Created power-up: ${powerUpType} for ${uniqueId}`);
      }

    } catch (error) {
      console.error('[TikTok LIVE] Error handling gift:', error);
      throw error;
    }
  }

  /**
   * Handle battle events
   */
  private async handleBattle(data: WebcastLinkMicBattle): Promise<void> {
    try {
      const battleUsers = data.battleUsers || [];
      const battleId = `battle_${Date.now()}`;

      this.currentBattleId = battleId;

      console.log(`[TikTok LIVE] 🥊 Battle started: ${battleUsers.map((u: any) => u.uniqueId).join(' VS ')}`);

      // You can extend this to create battle records in your database
      // For now, we just track the battle ID to associate with power-ups

    } catch (error) {
      console.error('[TikTok LIVE] Error handling battle:', error);
    }
  }

  /**
   * Get or create a viewer record
   */
  private async getOrCreateViewer(tiktokUsername: string, profilePictureUrl?: string): Promise<any> {
    // Try to find existing viewer by TikTok username
    // Note: You might want to add a tiktok_username field to viewers table
    
    // For now, we'll create a user + viewer if not exists
    const existingUser = await prisma.users.findFirst({
      where: {
        handle: tiktokUsername,
      },
      include: {
        viewers: true,
      },
    });

    if (existingUser?.viewers) {
      return existingUser.viewers;
    }

    // Create new user + viewer
    const user = await prisma.users.create({
      data: {
        email: `${tiktokUsername}@tiktok-viewer.placeholder`, // Placeholder email
        handle: tiktokUsername,
        role: 'VIEWER',
        viewers: {
          create: {
            display_name: tiktokUsername,
          },
        },
      },
      include: {
        viewers: true,
      },
    });

    console.log(`[TikTok LIVE] Created new viewer: ${tiktokUsername}`);

    return user.viewers;
  }
}

// Global connection manager
class TikTokLiveManager {
  private sessions: Map<string, TikTokLiveService> = new Map();

  /**
   * Start tracking for a creator
   */
  async startTracking(config: TikTokLiveSessionConfig): Promise<TikTokLiveService> {
    const key = config.creatorId;

    // Stop existing session if any
    if (this.sessions.has(key)) {
      await this.stopTracking(config.creatorId);
    }

    const service = new TikTokLiveService(config);
    await service.start();
    
    this.sessions.set(key, service);
    return service;
  }

  /**
   * Stop tracking for a creator
   */
  stopTracking(creatorId: string): void {
    const service = this.sessions.get(creatorId);
    if (service) {
      service.stop();
      this.sessions.delete(creatorId);
    }
  }

  /**
   * Get session status
   */
  getSession(creatorId: string): TikTokLiveService | undefined {
    return this.sessions.get(creatorId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Map<string, TikTokLiveService> {
    return this.sessions;
  }
}

// Export singleton instance
export const tiktokLiveManager = new TikTokLiveManager();
