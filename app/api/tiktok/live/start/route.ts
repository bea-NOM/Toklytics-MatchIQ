/**
 * Start TikTok LIVE tracking for a creator
 * POST /api/tiktok/live/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { tiktokLiveManager } from '@/src/lib/tiktok-live-service';
import { getViewerContext } from '@/src/lib/viewer-context';
import { getPrismaClient } from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    
    // Get authenticated user
    const context = await getViewerContext(request.headers);
    
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only creators can start tracking
    if (context.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can start LIVE tracking' },
        { status: 403 }
      );
    }

    // Get creator info
    const creator = await prisma.creators.findUnique({
      where: { user_id: context.userId },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Get user to find handle
    const user = await prisma.users.findUnique({
      where: { id: context.userId },
      select: { handle: true },
    });

    // Get TikTok token to find username
    const tiktokToken = await prisma.tikTokToken.findFirst({
      where: { user_id: context.userId },
      orderBy: { created_at: 'desc' },
    });

    if (!tiktokToken) {
      return NextResponse.json(
        { error: 'TikTok account not linked. Please link your TikTok account first.' },
        { status: 400 }
      );
    }

    // Parse request body for TikTok username (if provided)
    const body = await request.json();
    const tiktokUsername = body.tiktokUsername || user?.handle;

    if (!tiktokUsername) {
      return NextResponse.json(
        { error: 'TikTok username is required' },
        { status: 400 }
      );
    }

    // Start tracking
    const session = await tiktokLiveManager.startTracking({
      tiktokUsername,
      creatorId: creator.id,
      onConnected: () => {
        console.log(`[API] LIVE tracking started for @${tiktokUsername}`);
      },
      onDisconnected: () => {
        console.log(`[API] LIVE tracking stopped for @${tiktokUsername}`);
      },
      onError: (error) => {
        console.error(`[API] LIVE tracking error for @${tiktokUsername}:`, error);
      },
    });

    return NextResponse.json({
      success: true,
      message: 'TikTok LIVE tracking started',
      status: session.getStatus(),
    });

  } catch (error: any) {
    console.error('[API] Error starting LIVE tracking:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start LIVE tracking',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
