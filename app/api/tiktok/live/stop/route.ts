/**
 * Stop TikTok LIVE tracking for a creator
 * POST /api/tiktok/live/stop
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

    // Only creators can stop tracking
    if (context.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can stop LIVE tracking' },
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

    // Stop tracking
    tiktokLiveManager.stopTracking(creator.id);

    return NextResponse.json({
      success: true,
      message: 'TikTok LIVE tracking stopped',
    });

  } catch (error: any) {
    console.error('[API] Error stopping LIVE tracking:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to stop LIVE tracking',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
