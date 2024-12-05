import { NextRequest, NextResponse } from 'next/server';
import { CasparClipService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { createCasparClipSchema, updateCasparClipSchema } from '@/lib/api/schemas';
import { MirasCasparCGClipResponse } from '@/lib/api/types';

const clipService = CasparClipService.getInstance();
const sseService = SSEService.getInstance();

export async function OPTIONS() {
    console.log('[CasparClip API] ⭐ Handling OPTIONS request');
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

        if (eventId) {
            const clips = await clipService.findByEventId(eventId);
            return NextResponse.json({
                success: true,
                clips
            } as MirasCasparCGClipResponse);
        }

        if (serverId) {
            const clips = await clipService.findByServerId(serverId);
            return NextResponse.json({
                success: true,
                clips
            } as MirasCasparCGClipResponse);
        }

        const clips = await clipService.findAll();
        return NextResponse.json({
            success: true,
            clips
        } as MirasCasparCGClipResponse);
    });
}

export async function POST(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const validated = createCasparClipSchema.parse(data);
        
        const clip = await clipService.create(validated);
        
        sseService.broadcast(SSEEventType.CLIP_CREATED, {
            timestamp: Date.now(),
            entity: clip
        });
        
        return NextResponse.json(clip, { status: 201 });
    });
}

export async function PUT(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            throw new ApiError(400, 'Clip ID is required');
        }
        
        const validated = updateCasparClipSchema.parse(updateData);
        const clip = await clipService.update(id, validated);
        
        if (!clip) {
            throw new ApiError(404, 'Clip not found');
        }
        
        sseService.broadcast(SSEEventType.CLIP_UPDATED, {
            timestamp: Date.now(),
            entity: clip
        });
        
        return NextResponse.json(clip);
    });
}

export async function PATCH(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, position } = data;
        
        if (!id || !position?.row || !position?.column) {
            throw new ApiError(400, 'Clip ID and position are required');
        }
        
        const clip = await clipService.updatePosition(id, position);
        
        if (!clip) {
            throw new ApiError(404, 'Clip not found');
        }
        
        sseService.broadcast(SSEEventType.CLIP_POSITION_CHANGED, {
            timestamp: Date.now(),
            entity: clip
        });
        
        return NextResponse.json(clip);
    });
}

export async function DELETE(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            throw new ApiError(400, 'Clip ID is required');
        }
        
        const success = await clipService.delete(id);
        
        if (!success) {
            throw new ApiError(404, 'Clip not found');
        }
        
        sseService.broadcast(SSEEventType.CLIP_DELETED, {
            timestamp: Date.now(),
            entity: { id }
        });
        
        return new NextResponse(null, { status: 204 });
    });
}
