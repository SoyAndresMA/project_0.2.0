import { NextRequest, NextResponse } from 'next/server';
import { EventUnionService } from '@/lib/db/services';
import logger from '@/lib/logger/winston-logger';

const eventUnionService = EventUnionService.getInstance();

export async function GET(request: NextRequest) {
    try {
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
    } catch (error) {
        logger.error('Failed to get event unions', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to get event unions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const eventUnion = await eventUnionService.create(data);
        return NextResponse.json(eventUnion, { status: 201 });
    } catch (error) {
        logger.error('Failed to create event union', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to create event union' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Event Union ID is required' },
                { status: 400 }
            );
        }
        
        const eventUnion = await eventUnionService.update(id, updateData);
        
        if (!eventUnion) {
            return NextResponse.json(
                { success: false, error: 'Event Union not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(eventUnion);
    } catch (error) {
        logger.error('Failed to update event union', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to update event union' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Event Union ID is required' },
                { status: 400 }
            );
        }
        
        const success = await eventUnionService.delete(id);
        
        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Event Union not found' },
                { status: 404 }
            );
        }
        
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        logger.error('Failed to delete event union', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to delete event union' },
            { status: 500 }
        );
    }
}
