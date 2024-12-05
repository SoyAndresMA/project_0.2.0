import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { MirasProjectManager } from '@/lib/project/miras-project-manager';

const projectService = ProjectService.getInstance();
const sseService = SSEService.getInstance();
const projectManager = MirasProjectManager.getInstance();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        // Intentar obtener del ProjectManager primero
        const loadedProject = projectManager.getProject(params.id);
        if (loadedProject) {
            const state = loadedProject.getState();
            return NextResponse.json({
                id: state.id,
                name: state.name,
                description: state.description
            });
        }

        // Si no está en memoria, obtener de BD
        const project = await projectService.findById(params.id);
        if (!project) {
            throw new ApiError(404, 'Project not found');
        }
        return NextResponse.json(project);
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        const project = await projectService.findById(params.id);
        
        if (!project) {
            throw new ApiError(404, 'Project not found');
        }
        
        await projectService.delete(params.id);
        
        sseService.broadcast(SSEEventType.PROJECT_DELETED, {
            timestamp: Date.now(),
            entity: project
        });
        
        return new NextResponse(null, { status: 204 });
    });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        const data = await request.json();
        
        const project = await projectService.update(params.id, data);
        
        if (!project) {
            throw new ApiError(404, 'Project not found');
        }
        
        sseService.broadcast(SSEEventType.PROJECT_UPDATED, {
            timestamp: Date.now(),
            entity: project
        });
        
        return NextResponse.json(project);
    });
}
