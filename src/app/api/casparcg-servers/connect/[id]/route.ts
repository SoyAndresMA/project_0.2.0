import { NextRequest, NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler } from '@/lib/api/middleware';

const serverService = CasparCGServerService.getInstance();
const sseService = SSEService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`[API] Received connection request for server ID: ${params.id}`);
    
    return withErrorHandler(async () => {
        const serverInstance = await serverService.getServerInstance(params.id);
        
        if (!serverInstance) {
            console.error(`[API] Server instance not found: ${params.id}`);
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        try {
            if (serverInstance.isConnected()) {
                console.log(`[API] Disconnecting from server: ${serverInstance.getName()}`);
                await serverInstance.disconnect();
                
                // Notificar a los clientes
                sseService.broadcast(SSEEventType.CASPARCG_SERVER_LOG, {
                    timestamp: new Date(),
                    type: 'info',
                    message: `Disconnected from ${serverInstance.getName()}`
                });
                
                return NextResponse.json({ connected: false });
            } else {
                console.log(`[API] Connecting to server: ${serverInstance.getName()}`);
                await serverInstance.connect();
                
                // Notificar a los clientes
                sseService.broadcast(SSEEventType.CASPARCG_SERVER_LOG, {
                    timestamp: new Date(),
                    type: 'info',
                    message: `Connected to ${serverInstance.getName()}`
                });
                
                return NextResponse.json({ connected: true });
            }
        } catch (error) {
            console.error(`[API] Error in server connection process:`, error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }
    });
}
