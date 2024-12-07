// Configuración de segmento de ruta
export const dynamic = 'force-dynamic' // Asegura que la ruta siempre sea dinámica
export const runtime = 'nodejs' // Especifica el runtime

import { NextRequest, NextResponse } from 'next/server';
import { CasparGraphService } from '@/lib/db/services';
import logger from '@/lib/logger/winston-logger';

const casparGraphService = CasparGraphService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    logger.info('Received request to play graph', {
        graphId: params.id
    });
    
    try {
        const graph = await casparGraphService.play(params.id);
        if (!graph) {
            return NextResponse.json(
                { success: false, error: 'Graph not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Failed to play graph', {
            graphId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to play graph' },
            { status: 500 }
        );
    }
}