import { NextRequest, NextResponse } from 'next/server';
import { TypeItemUnionService } from '@/lib/db/services';
import { withErrorHandler } from '@/lib/api/middleware';

const typeItemUnionService = TypeItemUnionService.getInstance();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withErrorHandler(async () => {
        const typeItemUnion = await typeItemUnionService.findById(params.id);
        
        if (!typeItemUnion) {
            return NextResponse.json(
                { error: 'TypeItemUnion not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(typeItemUnion);
    });
}
