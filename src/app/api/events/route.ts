import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const eventService = EventService.getInstance();
const sseService = SSEService.getInstance();

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        logger.info('Creating new event', { data });

        const event = await eventService.create(data);
        if (!event) {
            logger.error('Failed to create event', { data });
            return NextResponse.json(
                { success: false, error: 'Failed to create event' },
                { status: 400 }
            );
        }

        sseService.broadcast(SSEEventType.EVENT_CREATED, {
            timestamp: Date.now(),
            entity: event
        });

        logger.info('Event created successfully', { eventId: event.id });
        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        logger.error('Failed to create event', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
