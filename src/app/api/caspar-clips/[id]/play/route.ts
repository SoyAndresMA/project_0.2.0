import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';

const projectService = ProjectService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`[CasparClip API] ⭐ Received PLAY request`, {
        clipId: params.id,
        method: request.method,
        url: request.url
    });
    
    return withErrorHandler(async () => {
        console.log(`[CasparClip API] 📨 Forwarding PLAY command to ProjectService`, {
            clipId: params.id,
            service: 'ProjectService.playClip'
        });
        
        try {
            await projectService.playClip(params.id);
            console.log(`[CasparClip API] ✅ PLAY command executed successfully`, {
                clipId: params.id,
                status: 'success'
            });
            
            return Response.json({
                success: true,
                clipId: params.id
            });
            
        } catch (error) {
            console.error(`[CasparClip API] ❌ Error executing PLAY command`, {
                clipId: params.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    });
}
