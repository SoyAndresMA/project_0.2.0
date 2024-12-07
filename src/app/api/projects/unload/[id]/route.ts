import { NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services/project-service';
import logger from '@/lib/logger/winston-logger';

const projectService = ProjectService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const project = await projectService.unloadProject(params.id);
        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(project);
    } catch (error) {
        logger.error('Failed to unload project', {
            projectId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to unload project' },
            { status: 500 }
        );
    }
}
