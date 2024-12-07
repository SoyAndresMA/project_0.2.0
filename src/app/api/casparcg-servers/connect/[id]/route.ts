import { NextRequest, NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const serverService = CasparCGServerService.getInstance();
const sseService = SSEService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const server = await serverService.connect(params.id);
        if (!server) {
            return NextResponse.json(
                { success: false, error: 'Server not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(server);
    } catch (error) {
        logger.error('Failed to connect server', {
            serverId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to connect server' },
            { status: 500 }
        );
    }
}
