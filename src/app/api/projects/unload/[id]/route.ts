import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services/project-service';
import { withErrorHandler } from '@/lib/api/middleware';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        const projectService = ProjectService.getInstance();
        await projectService.unloadProject(params.id);
        return NextResponse.json({ success: true });
    });
}
