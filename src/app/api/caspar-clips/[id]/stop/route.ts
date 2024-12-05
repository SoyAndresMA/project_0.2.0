import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services/project-service';
import { withErrorHandler } from '@/lib/api/middleware';

const projectService = ProjectService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`[CasparClip API] ⭐ Received STOP request`, {
        clipId: params.id,
        method: request.method,
        url: request.url
    });
    
    return withErrorHandler(async () => {
        console.log(`[CasparClip API] 📨 Forwarding STOP command to ProjectService`, {
            clipId: params.id,
            service: 'ProjectService.stopClip'
        });
        
        try {
            await projectService.stopClip(params.id);
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
