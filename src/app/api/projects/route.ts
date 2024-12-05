import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { withErrorHandler, ApiError } from '@/lib/api/middleware';
import { createProjectSchema, updateProjectSchema } from '@/lib/api/schemas';

const projectService = ProjectService.getInstance();
const sseService = SSEService.getInstance();

export async function GET() {
    return withErrorHandler(async () => {
        console.log('GET /api/projects: Starting request');
        try {
            const projects = await projectService.findAll();
            console.log('GET /api/projects: Projects retrieved:', projects);
            return NextResponse.json(projects);
        } catch (error) {
            console.error('GET /api/projects: Error in handler:', error);
            throw error;
        }
    });
}

export async function POST(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const validated = createProjectSchema.parse(data);
        
        const project = await projectService.create(validated);
        
        sseService.broadcast(SSEEventType.PROJECT_CREATED, {
            timestamp: Date.now(),
            entity: project
        });
        
        return NextResponse.json(project, { status: 201 });
    });
}

export async function PUT(request: NextRequest) {
    return withErrorHandler(async () => {
        const data = await request.json();
        const { id, ...updateData } = data;
        
        if (!id) {
            throw new ApiError(400, 'Project ID is required');
        }
        
        const validated = updateProjectSchema.parse(updateData);
        const project = await projectService.update(id, validated);
        
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
