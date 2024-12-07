import { NextResponse } from 'next/server';
import { CasparClipService } from '@/lib/db/services/caspar-clip-service';
import logger from '@/lib/logger/winston-logger';

const casparClipService = CasparClipService.getInstance();

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    logger.info('POST /api/caspar/clips/[id]/stop received', { clipId: params.id });
    
    try {
        await casparClipService.stopClip(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Failed to stop clip', { 
            clipId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to stop clip' },
            { status: 500 }
        );
    }
}
