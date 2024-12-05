import { NextRequest } from 'next/server';
import { SSEService } from '@/lib/sse/sse-service';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const sseService = SSEService.getInstance();
    const clientId = uuidv4();

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const client = {
        id: clientId,
        writer,
        encoder
    };

    sseService.addClient(client);

    request.signal.addEventListener('abort', () => {
        sseService.removeClient(clientId);
    });

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
