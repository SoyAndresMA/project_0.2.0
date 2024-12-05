import { BaseError } from './base-error';

export class CasparError extends BaseError {
    constructor(
        message: string,
        serverId: string,
        command?: string,
        context?: Record<string, any>
    ) {
        super(message, 'CASPAR_ERROR', {
            serverId,
            command,
            ...context
        });
    }
}