import { NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const serverService = CasparCGServerService.getInstance();
const sseService = SSEService.getInstance();

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        logger.info('Connecting to CasparCG server', { serverId: params.id });

        const server = await serverService.connect(params.id);
        if (!server) {
            logger.warn('Server not found for connection', { serverId: params.id });
            return NextResponse.json(
                { success: false, error: 'Server not found' },
                { status: 404 }
            );
        }

        const serverStatus = server.getStatus();
        sseService.broadcast(SSEEventType.SERVER_STATE_CHANGED, {
            timestamp: Date.now(),
            entityId: params.id,
            state: { status: serverStatus }
        });

        return NextResponse.json({
            success: true,
            server: {
                id: server.config.id,
                name: server.config.name,
                host: server.config.host,
                port: server.config.port,
                status: serverStatus
            }
        });
    } catch (error) {
        logger.error('Failed to connect to server', {
            serverId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to connect to server' },
            { status: 500 }
        );
    }
}
