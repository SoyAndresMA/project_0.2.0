import { NextRequest, NextResponse } from 'next/server';
import { CasparGraphService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const casparGraphService = CasparGraphService.getInstance();
const sseService = SSEService.getInstance();

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        logger.info('Creating new caspar graph', { data });

        const graph = await casparGraphService.create(data);
        if (!graph) {
            logger.error('Failed to create caspar graph', { data });
            return NextResponse.json(
                { success: false, error: 'Failed to create caspar graph' },
                { status: 400 }
            );
        }

        sseService.broadcast(SSEEventType.CASPAR_GRAPH_CREATED, {
            timestamp: Date.now(),
            entity: graph
        });

        logger.info('Caspar graph created successfully', { graphId: graph.id });
        return NextResponse.json(graph, { status: 201 });
    } catch (error) {
        logger.error('Failed to create caspar graph', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to create caspar graph' },
            { status: 500 }
        );
    }
}