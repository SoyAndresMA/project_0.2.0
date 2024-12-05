import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { createEventSchema, updateEventSchema } from '@/lib/api/schemas';

const eventService = EventService.getInstance();
const sseService = SSEService.getInstance();

export async function GET(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (projectId) {
            const events = await eventService.findByProjectId(projectId);
            return NextResponse.json(events);
        }

        const events = await eventService.findAll();
        return NextResponse.json(events);
    });
}

export async function POST(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const validated = createEventSchema.parse(data);
        
        const event = await eventService.create(validated);
        
        sseService.broadcast(SSEEventType.EVENT_CREATED, {
            timestamp: Date.now(),
            entity: event
        });
        
        return NextResponse.json(event, { status: 201 });
    });
}

export async function PUT(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            throw new ApiError(400, 'Event ID is required');
        }
        
        const validated = updateEventSchema.parse(updateData);
        const event = await eventService.update(id, validated);
        
        if (!event) {
            throw new ApiError(404, 'Event not found');
        }
        
        sseService.broadcast(SSEEventType.EVENT_UPDATED, {
            timestamp: Date.now(),
            entity: event
        });
        
        return NextResponse.json(event);
    });
}
