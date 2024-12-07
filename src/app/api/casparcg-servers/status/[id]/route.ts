import { NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import logger from '@/lib/logger/winston-logger';

const serverService = CasparCGServerService.getInstance();

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const server = await serverService.getServerStatus(params.id);
        if (!server) {
            return NextResponse.json(
                { success: false, error: 'Server not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(server);
    } catch (error) {
        logger.error('Failed to get server status', {
            serverId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to get server status' },
            { status: 500 }
        );
    }
}
