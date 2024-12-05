import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import logger from '@/lib/logger/winston-logger';
import { DatabaseError } from '@/lib/errors/database-error';
import { CasparError } from '@/lib/errors/caspar-error';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function withErrorHandler(handler: () => Promise<Response>) {
    try {
        logger.info('Incoming API request', {
            url: globalThis.location?.href,
            method: globalThis.location?.method,
            timestamp: new Date().toISOString()
        });

        const response = await handler();
        
        logger.info('API request completed', {
            url: globalThis.location?.href,
            method: globalThis.location?.method,
            status: response.status
        });
        
        return response;
    } catch (error) {
        const errorResponse = {
            timestamp: new Date().toISOString(),
            path: globalThis.location?.href
        };

        if (error instanceof ApiError) {
            logger.error('API Error', {
                ...errorResponse,
                code: error.code,
                message: error.message
            });
            
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    ...errorResponse
                },
                { status: error.statusCode }
            );
        }

        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        if (error instanceof DatabaseError) {
            logger.error('Database Error in API', {
                ...errorResponse,
                ...error.context,
                message: error.message
            });
            
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    context: error.context,
                    ...errorResponse
                },
                { status: 500 }
            );
        }

        if (error instanceof CasparError) {
            logger.error('CasparCG Error in API', {
                ...errorResponse,
                ...error.context,
                message: error.message
            });
            
            return NextResponse.json(
                {
                    ...error.toJSON(),
                    ...errorResponse
                },
                { status: 500 }
            );
        }

        // Error desconocido
        logger.error('Unhandled API Error', {
            ...errorResponse,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        
        return NextResponse.json(
            {
                error: 'Internal server error',
                ...errorResponse
            },
            { status: 500 }
        );
    }
}
