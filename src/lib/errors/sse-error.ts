import { BaseError } from './base-error';

export class SSEError extends BaseError {
    constructor(
        message: string,
        clientId: string,
        eventType?: string,
        context?: Record<string, any>
    ) {
        super(message, 'SSE_ERROR', {
            clientId,
            eventType,
            ...context
        });
    }
}