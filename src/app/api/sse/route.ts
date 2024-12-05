import { NextRequest, NextResponse } from 'next/server';
import { SSEService } from '@/lib/sse/sse-service';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const sseService = SSEService.getInstance();
    const sessionId = cookies().get('sessionId')?.value || crypto.randomUUID();
    const encoder = new TextEncoder();

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Configurar el cliente SSE
    sseService.addClient({
        id: sessionId,
        writer,
        encoder
    });

    // Manejar la desconexión cuando el cliente cierre la conexión
    req.signal.addEventListener('abort', () => {
        sseService.removeClient(sessionId);
    });

    return new NextResponse(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
