import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';
import logger from '@/lib/logger/winston-logger';

const projectService = ProjectService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    logger.info('Received UPDATE request for graph', {
        graphId: params.id,
        method: request.method,
        url: request.url
    });
    
    return withErrorHandler(async () => {
        const data = await request.json();
        
        logger.info('Forwarding UPDATE command to ProjectService', {
            graphId: params.id,
            service: 'ProjectService.updateGraph',
            data
        });
        
        try {
            await projectService.updateGraph(params.id, data);
            logger.info('UPDATE command executed successfully', {
                graphId: params.id,
                status: 'success'
            });
            
            return Response.json({
                success: true,
                graphId: params.id,
                data
            });
            
        } catch (error) {
            logger.error('Error executing UPDATE command', {
                graphId: params.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    });
}