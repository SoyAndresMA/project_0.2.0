import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/db/services/project-service';

const projectService = ProjectService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await projectService.loadProject(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to load project' },
            { status: 500 }
        );
    }
}
