import { NextRequest, NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';

const serverService = CasparCGServerService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        console.log(`[API] Attempting to connect to server ID: ${params.id}`);
        
        const server = await serverService.findById(params.id);
        if (!server) {
            console.error(`[API] Server ${params.id} not found`);
            return NextResponse.json(
                { error: `Server not found` },
                { status: 404 }
            );
        }

        try {
            await server.connect();
            console.log(`[API] Successfully connected to server ${server.config.name}`);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error(`[API] Connection error:`, error);
            return NextResponse.json(
                { 
                    error: error instanceof Error ? error.message : 'Unknown connection error',
                    serverId: params.id,
                    serverName: server.config.name,
                    host: server.config.host,
                    port: server.config.port
                },
                { status: 500 }
            );
        }
    });
}
