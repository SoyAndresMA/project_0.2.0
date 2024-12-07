import { NextRequest, NextResponse } from 'next/server';
import { TypeItemUnionService } from '@/lib/db/services';
import logger from '@/lib/logger/winston-logger';

const typeItemUnionService = TypeItemUnionService.getInstance();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        logger.info('Getting type item union', { id: params.id });
        const typeItemUnion = await typeItemUnionService.findById(params.id);
        
        if (!typeItemUnion) {
            logger.warn('Type item union not found', { id: params.id });
            return NextResponse.json(
                { success: false, error: 'TypeItemUnion not found' },
                { status: 404 }
            );
        }

        logger.info('Type item union found', { id: params.id });
        return NextResponse.json(typeItemUnion);
    } catch (error) {
        logger.error('Failed to get type item union', { 
            id: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to get type item union' },
            { status: 500 }
        );
    }
}
