import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';
import logger from '@/lib/logger/winston-logger';

const projectService = ProjectService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    logger.info('Received PLAY request for graph', {
        graphId: params.id,
        method: request.method,
        url: request.url
    });
    
    return withErrorHandler(async () => {
        logger.info('Forwarding PLAY command to ProjectService', {
            graphId: params.id,
            service: 'ProjectService.playGraph'
        });
        
        try {
            await projectService.playGraph(params.id);
            logger.info('PLAY command executed successfully', {
                graphId: params.id,
                status: 'success'
            });
            
            return Response.json({
                success: true,
                graphId: params.id
            });
            
        } catch (error) {
            logger.error('Error executing PLAY command', {
                graphId: params.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    });
}