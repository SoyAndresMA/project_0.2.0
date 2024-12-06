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
        logger.info('Incoming API request');
        
        const response = await handler();
        
        // Asegurarnos de que la respuesta tenga los headers CORS
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-debug');
        
        logger.info('API request completed', {
            status: response.status
        });
        
        // Crear una nueva respuesta con los headers CORS
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    } catch (error) {
        const errorResponse = {
            timestamp: new Date().toISOString()
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
                    timestamp: errorResponse.timestamp
                },
                { 
                    status: error.statusCode,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, x-debug'
                    }
                }
            );
        }

        if (error instanceof ZodError) {
            logger.error('Validation Error', {
                ...errorResponse,
                errors: error.errors
            });
            
            return NextResponse.json(
                {
                    error: 'Validation Error',
                    details: error.errors,
                    timestamp: errorResponse.timestamp
                },
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, x-debug'
                    }
                }
            );
        }

        if (error instanceof DatabaseError) {
            logger.error('Database Error', {
                ...errorResponse,
                code: error.code,
                message: error.message,
                details: error.details
            });
            
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    timestamp: errorResponse.timestamp
                },
                { 
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, x-debug'
                    }
                }
            );
        }

        if (error instanceof CasparError) {
            logger.error('CasparCG Error', {
                ...errorResponse,
                code: error.code,
                message: error.message,
                details: error.details
            });
            
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    timestamp: errorResponse.timestamp
                },
                { 
                    status: 500,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, x-debug'
                    }
                }
            );
        }

        // Error genérico
        logger.error('Unhandled Error', {
            ...errorResponse,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                timestamp: errorResponse.timestamp
            },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, x-debug'
                }
            }
        );
    }
}
