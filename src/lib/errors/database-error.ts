import { BaseError } from './base-error';

export class DatabaseError extends BaseError {
    constructor(
        message: string,
        operation: string,
        table?: string,
        context?: Record<string, any>
    ) {
        super(message, 'DATABASE_ERROR', {
            operation,
            table,
            ...context
        });
    }
}