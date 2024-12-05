import { NextRequest, NextResponse } from 'next/server';
import { CasparGraphService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { createCasparGraphSchema, updateCasparGraphSchema } from '@/lib/api/schemas';
import logger from '@/lib/logger/winston-logger';

const graphService = CasparGraphService.getInstance();
const sseService = SSEService.getInstance();

export async function OPTIONS() {
    logger.debug('Handling OPTIONS request for caspar-graphs');
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-debug',
        },
    });
}

export async function GET(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const serverId = searchParams.get('serverId');

        logger.info('GET caspar-graphs request', { eventId, serverId });

        let graphs;
        if (eventId) {
            graphs = await graphService.findByEventId(eventId);
        } else if (serverId) {
            graphs = await graphService.findByServerId(serverId);
        } else {
            graphs = await graphService.findAll();
        }

        logger.debug('Found graphs', { count: graphs.length });

        return NextResponse.json({
            success: true,
            graphs
        });
    });
}

export async function POST(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        logger.info('Creating new caspar-graph', { data });

        const validated = createCasparGraphSchema.parse(data);
        const graph = await graphService.create(validated);
        
        sseService.broadcast(SSEEventType.ITEM_CREATED, {
            timestamp: Date.now(),
            entity: graph,
            itemType: 'caspargraph'
        });
        
        logger.info('Caspar-graph created successfully', { graphId: graph.id });
        return NextResponse.json(graph, { status: 201 });
    });
}

export async function PUT(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            const error = 'Graph ID is required';
            logger.error(error, { data });
            throw new ApiError(400, error);
        }
        
        logger.info('Updating caspar-graph', { graphId: id, updateData });
        
        const validated = updateCasparGraphSchema.parse(updateData);
        const graph = await graphService.update(id, validated);
        
        if (!graph) {
            const error = 'Graph not found';
            logger.error(error, { graphId: id });
            throw new ApiError(404, error);
        }
        
        sseService.broadcast(SSEEventType.ITEM_UPDATED, {
            timestamp: Date.now(),
            entity: graph,
            itemType: 'caspargraph'
        });
        
        logger.info('Caspar-graph updated successfully', { graphId: id });
        return NextResponse.json(graph);
    });
}

export async function PATCH(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, position } = data;
        
        if (!id || !position?.row || !position?.column) {
            const error = 'Graph ID and position are required';
            logger.error(error, { data });
            throw new ApiError(400, error);
        }
        
        logger.info('Updating caspar-graph position', { 
            graphId: id, 
            position 
        });
        
        const graph = await graphService.updatePosition(id, position);
        
        if (!graph) {
            const error = 'Graph not found';
            logger.error(error, { graphId: id });
            throw new ApiError(404, error);
        }
        
        sseService.broadcast(SSEEventType.ITEM_POSITION_CHANGED, {
            timestamp: Date.now(),
            entity: graph,
            itemType: 'caspargraph'
        });
        
        logger.info('Caspar-graph position updated successfully', { 
            graphId: id,
            position 
        });
        
        return NextResponse.json(graph);
    });
}

export async function DELETE(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            const error = 'Graph ID is required';
            logger.error(error);
            throw new ApiError(400, error);
        }
        
        logger.info('Deleting caspar-graph', { graphId: id });
        
        const success = await graphService.delete(id);
        
        if (!success) {
            const error = 'Graph not found';
            logger.error(error, { graphId: id });
            throw new ApiError(404, error);
        }
        
        sseService.broadcast(SSEEventType.ITEM_DELETED, {
            timestamp: Date.now(),
            entity: { id },
            itemType: 'caspargraph'
        });
        
        logger.info('Caspar-graph deleted successfully', { graphId: id });
        return new NextResponse(null, { status: 204 });
    });
}