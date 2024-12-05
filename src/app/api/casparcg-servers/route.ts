import { NextRequest, NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { createServerSchema, updateServerSchema } from '@/lib/api/schemas';

const serverService = CasparCGServerService.getInstance();
const sseService = SSEService.getInstance();

export async function GET() {
    try {
        const servers = await serverService.findAll();
        return NextResponse.json({ success: true, servers });
    } catch (error) {
        console.error('[API] Error getting servers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get servers' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const validated = createServerSchema.parse(data);
        
        const server = await serverService.create(validated);
        
        sseService.broadcast(SSEEventType.CASPARCG_SERVER_CREATED, {
            timestamp: Date.now(),
            entity: server
        });
        
        return NextResponse.json(server, { status: 201 });
    });
}

export async function PUT(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            throw new ApiError(400, 'Server ID is required');
        }
        
        const validated = updateServerSchema.parse(updateData);
        const server = await serverService.update(id, validated);
        
        if (!server) {
            throw new ApiError(404, 'Server not found');
        }
        
        sseService.broadcast(SSEEventType.CASPARCG_SERVER_UPDATED, {
            timestamp: Date.now(),
            entity: server
        });
        
        return NextResponse.json(server);
    });
}

export async function DELETE(request: NextRequest) {
    return withErrorHandler(async () => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            throw new ApiError(400, 'Server ID is required');
        }
        
        const success = await serverService.delete(id);
        
        if (!success) {
            throw new ApiError(404, 'Server not found');
        }
        
        sseService.broadcast(SSEEventType.CASPARCG_SERVER_DELETED, {
            timestamp: Date.now(),
            entity: { id }
        });
        
        return new NextResponse(null, { status: 204 });
    });
}
