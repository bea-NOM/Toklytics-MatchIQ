/**
 * Get TikTok LIVE tracking status for a creator
 * GET /api/tiktok/live/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { tiktokLiveManager } from '@/src/lib/tiktok-live-service';
import { getViewerContext } from '@/src/lib/viewer-context';
import { getPrismaClient } from '@/src/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Only creators can check status
    if (context.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can check LIVE tracking status' },
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

    // Get session
    const session = tiktokLiveManager.getSession(creator.id);
    
    if (!session) {
      return NextResponse.json({
        isTracking: false,
        message: 'Not currently tracking',
      });
    }

    const status = session.getStatus();

    return NextResponse.json({
      isTracking: status.isTracking,
      username: status.username,
      roomId: status.roomId,
    });

  } catch (error: any) {
    console.error('[API] Error getting LIVE tracking status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get LIVE tracking status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
