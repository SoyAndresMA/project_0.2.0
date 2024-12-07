import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';

const projectService = ProjectService.getInstance();
const sseService = SSEService.getInstance();

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { action } = data;

        switch (action) {
            case 'list': {
                const projects = await projectService.findAll();
                return NextResponse.json({ success: true, projects });
            }

            case 'load': {
                const { id } = data;
                if (!id) {
                    return NextResponse.json(
                        { success: false, error: 'Project ID is required' },
                        { status: 400 }
                    );
                }

                await projectService.loadProject(id);
                return NextResponse.json({ success: true });
            }

            case 'unload': {
                const { id } = data;
                if (!id) {
                    return NextResponse.json(
                        { success: false, error: 'Project ID is required' },
                        { status: 400 }
                    );
                }

                await projectService.unload(id);
                sseService.broadcast(SSEEventType.PROJECT_UNLOADED, {
                    timestamp: Date.now(),
                    projectId: id
                });

                return NextResponse.json({ success: true });
            }

            case 'create': {
                const project = await projectService.create(data);
                sseService.broadcast(SSEEventType.PROJECT_CREATED, {
                    timestamp: Date.now(),
                    entity: project
                });

                return NextResponse.json({ success: true });
            }

            case 'update': {
                const { id, ...updateData } = data;
                if (!id) {
                    return NextResponse.json(
                        { success: false, error: 'Project ID is required' },
                        { status: 400 }
                    );
                }

                const project = await projectService.update(id, updateData);
                sseService.broadcast(SSEEventType.PROJECT_UPDATED, {
                    timestamp: Date.now(),
                    entity: project
                });

                return NextResponse.json({ success: true });
            }

            case 'delete': {
                const { id } = data;
                if (!id) {
                    return NextResponse.json(
                        { success: false, error: 'Project ID is required' },
                        { status: 400 }
                    );
                }

                await projectService.delete(id);
                sseService.broadcast(SSEEventType.PROJECT_DELETED, {
                    timestamp: Date.now(),
                    projectId: id
                });

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('[Projects API] Error:', error);
        sseService.broadcast(SSEEventType.PROJECT_ERROR, {
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { success: false, error: 'Operation failed' },
            { status: 500 }
        );
    }
}
