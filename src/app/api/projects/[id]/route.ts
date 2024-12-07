import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const projectService = ProjectService.getInstance();
const sseService = SSEService.getInstance();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        logger.info('Getting project by id', { projectId: params.id });
        const project = await projectService.findById(params.id);

        if (!project) {
            logger.warn('Project not found', { projectId: params.id });
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        logger.info('Project found', { projectId: params.id });
        return NextResponse.json(project);
    } catch (error) {
        logger.error('Failed to get project', {
            projectId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to get project' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        logger.info('Deleting project', { projectId: params.id });
        const success = await projectService.delete(params.id);

        if (!success) {
            logger.warn('Project not found for deletion', { projectId: params.id });
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        sseService.broadcast(SSEEventType.PROJECT_DELETED, {
            timestamp: Date.now(),
            entity: { id: params.id }
        });

        logger.info('Project deleted successfully', { projectId: params.id });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        logger.error('Failed to delete project', {
            projectId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to delete project' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        logger.info('Updating project', { projectId: params.id });
        const data = await request.json();
        
        const project = await projectService.update(params.id, data);
        
        if (!project) {
            logger.warn('Project not found for update', { projectId: params.id });
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }
        
        sseService.broadcast(SSEEventType.PROJECT_UPDATED, {
            timestamp: Date.now(),
            entity: project
        });
        
        logger.info('Project updated successfully', { projectId: params.id });
        return NextResponse.json(project);
    } catch (error) {
        logger.error('Failed to update project', {
            projectId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to update project' },
            { status: 500 }
        );
    }
}
