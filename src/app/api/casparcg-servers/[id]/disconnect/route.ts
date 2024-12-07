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
        logger.info('Disconnecting from CasparCG server', { serverId: params.id });

        const server = await serverService.disconnect(params.id);
        if (!server) {
            logger.warn('Server not found for disconnection', { serverId: params.id });
            return NextResponse.json(
                { success: false, error: 'Server not found' },
                { status: 404 }
            );
        }

        sseService.broadcast(SSEEventType.SERVER_DISCONNECTED, {
            timestamp: Date.now(),
            entity: server
        });

        logger.info('Server disconnected successfully', { serverId: params.id });
        return NextResponse.json(server);
    } catch (error) {
        logger.error('Failed to disconnect from server', {
            serverId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to disconnect from server' },
            { status: 500 }
        );
    }
}
