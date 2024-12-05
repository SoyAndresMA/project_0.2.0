import { NextRequest, NextResponse } from 'next/server';
import { EventUnionService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { eventUnionSchemas } from '@/lib/api/schemas';

const eventUnionService = EventUnionService.getInstance();
const sseService = SSEService.getInstance();

export async function GET(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const projectId = searchParams.get('projectId');

        if (eventId) {
            const eventUnions = await eventUnionService.findByEventId(eventId);
            return NextResponse.json(eventUnions);
        }

        if (projectId) {
            const eventUnions = await eventUnionService.findByProjectId(projectId);
            return NextResponse.json(eventUnions);
        }

        const eventUnions = await eventUnionService.findAll();
        return NextResponse.json(eventUnions);
    });
}

export async function POST(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const validated = eventUnionSchemas.createEventUnionSchema.parse(data);
        
        const eventUnion = await eventUnionService.create(validated);
        
        sseService.broadcast(SSEEventType.EVENT_UNION_CREATED, {
            timestamp: Date.now(),
            entity: eventUnion
        });
        
        return NextResponse.json(eventUnion, { status: 201 });
    });
}

export async function PUT(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            throw new ApiError(400, 'Event Union ID is required');
        }
        
        const validated = eventUnionSchemas.updateEventUnionSchema.parse(updateData);
        const eventUnion = await eventUnionService.update(id, validated);
        
        if (!eventUnion) {
            throw new ApiError(404, 'Event Union not found');
        }
        
        sseService.broadcast(SSEEventType.EVENT_UNION_UPDATED, {
            timestamp: Date.now(),
            entity: eventUnion
        });
        
        return NextResponse.json(eventUnion);
    });
}

export async function DELETE(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            throw new ApiError(400, 'Event Union ID is required');
        }
        
        const success = await eventUnionService.delete(id);
        
        if (!success) {
            throw new ApiError(404, 'Event Union not found');
        }
        
        sseService.broadcast(SSEEventType.EVENT_UNION_DELETED, {
            timestamp: Date.now(),
            entity: { id }
        });
        
        return new NextResponse(null, { status: 204 });
    });
}
