import { NextResponse } from 'next/server';
import { CasparClipService } from '@/lib/db/services/caspar-clip-service';
import logger from '@/lib/logger/winston-logger';

export const dynamic = 'force-dynamic';

const casparClipService = CasparClipService.getInstance();

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        logger.info(`Playing clip with ID: ${params.id}`);
        await casparClipService.play(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(`Error playing clip: ${error}`);
        return NextResponse.json(
            { success: false, error: 'Failed to play clip' },
            { status: 500 }
        );
    }
}
