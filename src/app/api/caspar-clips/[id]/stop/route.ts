import { NextRequest, NextResponse } from 'next/server';
import { CasparClipService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';
import logger from '@/lib/logger/winston-logger';

const casparClipService = CasparClipService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`[CasparClip API] ⭐ Received STOP request for clip ${params.id}`, {
        clipId: params.id,
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries())
    });
    
    return withErrorHandler(async () => {
        console.log(`[CasparClip API] 📨 Forwarding STOP command to CasparClipService`, {
            clipId: params.id,
            service: 'CasparClipService.stopClip'
        });
        
        try {
            await casparClipService.stopClip(params.id);
            console.log(`[CasparClip API] ✅ STOP command executed successfully`, {
                clipId: params.id,
                status: 'success'
            });
            
            return NextResponse.json({
                success: true,
                clipId: params.id
            });
            
        } catch (error) {
            console.error(`[CasparClip API] ❌ Error executing STOP command`, {
                clipId: params.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    });
}
