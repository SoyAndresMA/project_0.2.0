import { NextRequest } from 'next/server';
import { CasparClipService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';
import logger from '@/lib/logger/winston-logger';

const casparClipService = CasparClipService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    logger.info('Received PLAY request for clip', {
        clipId: params.id,
        method: request.method,
        url: request.url
    });
    
    return withErrorHandler(async () => {
        logger.info('Forwarding PLAY command to CasparClipService', {
            clipId: params.id,
            service: 'CasparClipService.playClip'
        });
        
        try {
            await casparClipService.playClip(params.id);
            logger.info('PLAY command executed successfully', {
                clipId: params.id,
                status: 'success'
            });
            
            return Response.json({
                success: true,
                clipId: params.id
            });
            
        } catch (error) {
            logger.error('Error executing PLAY command', {
                clipId: params.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    });
}
