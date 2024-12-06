// Configuración de segmento de ruta
export const dynamic = 'force-dynamic' // Asegura que la ruta siempre sea dinámica
export const runtime = 'nodejs' // Especifica el runtime

import { NextResponse } from 'next/server';
import { CasparGraphService } from '@/lib/db/services';
import logger from '@/lib/logger/winston-logger';

const casparGraphService = CasparGraphService.getInstance();

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Validar método HTTP
    if (request.method !== 'POST') {
        return NextResponse.json(
            { success: false, error: 'Method not allowed' },
            { status: 405 }
        );
    }

    try {
        logger.info('POST /api/caspar-graphs/[id]/play received', {
            graphId: params.id,
            url: request.url
        });

        await casparGraphService.playGraph(params.id);

        return NextResponse.json(
            { success: true, graphId: params.id },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            }
        );

    } catch (error) {
        logger.error('Error in POST /api/caspar-graphs/[id]/play', {
            graphId: params.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            }
        );
    }
}

// Manejar preflight requests para CORS
export async function OPTIONS() {
    return NextResponse.json(
        {},
        {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }
    );
}