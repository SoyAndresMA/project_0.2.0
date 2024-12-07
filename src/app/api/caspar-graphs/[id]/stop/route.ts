// Configuración de segmento de ruta
export const dynamic = 'force-dynamic' // Asegura que la ruta siempre sea dinámica

import { NextRequest, NextResponse } from 'next/server';
import { CasparGraphService } from '@/lib/db/services';
import logger from '@/lib/logger/winston-logger';

const casparGraphService = CasparGraphService.getInstance();

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const graph = await casparGraphService.stop(params.id);
        if (!graph) {
            return NextResponse.json(
                { success: false, error: 'Graph not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Failed to stop graph', {
            graphId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to stop graph' },
            { status: 500 }
        );
    }
}