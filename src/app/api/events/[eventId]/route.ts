import { NextRequest } from 'next/server';
import { EventService } from '@/lib/db/services/event-service';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';

const eventService = EventService.getInstance();
const sseService = SSEService.getInstance();

export async function GET(
    request: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        const event = await eventService.findById(params.eventId);
        if (!event) {
            return new Response('Event not found', { status: 404 });
        }
        return Response.json(event);
    } catch (error) {
        console.error('Error getting event:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        const data = await request.json();
        const event = await eventService.update(params.eventId, data);
        if (event) {
            sseService.emit(SSEEventType.EVENT_UPDATED, { entity: event });
        }
        return Response.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { eventId: string } }
) {
    try {
        await eventService.delete(params.eventId);
        sseService.emit(SSEEventType.EVENT_DELETED, { entity: { id: params.eventId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting event:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
