import { NextRequest, NextResponse } from 'next/server';
import { CasparGraphService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const casparGraphService = CasparGraphService.getInstance();
const sseService = SSEService.getInstance();

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const data = await request.json();
        logger.info('Updating caspar graph', { graphId: params.id, data });

        const graph = await casparGraphService.update(params.id, data);
        if (!graph) {
            logger.warn('Graph not found for update', { graphId: params.id });
            return NextResponse.json(
                { success: false, error: 'Graph not found' },
                { status: 404 }
            );
        }

        sseService.broadcast(SSEEventType.CASPAR_GRAPH_UPDATED, {
            timestamp: Date.now(),
            entity: graph
        });

        logger.info('Graph updated successfully', { graphId: params.id });
        return NextResponse.json(graph);
    } catch (error) {
        logger.error('Failed to update graph', {
            graphId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to update graph' },
            { status: 500 }
        );
    }
}