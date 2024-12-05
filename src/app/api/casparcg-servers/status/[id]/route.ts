import { NextRequest, NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';

const serverService = CasparCGServerService.getInstance();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        console.log(`[API] Received server status request for ID: ${params.id}`);
        
        const server = await serverService.findById(params.id);
        if (!server) {
            throw new Error(`Server ${params.id} not found`);
        }

        const status = server.getStatus();
        console.log(`[API] Server ${params.id} status:`, status);
        
        return NextResponse.json({
            success: true,
            serverId: params.id,
            status
        });
    });
}
