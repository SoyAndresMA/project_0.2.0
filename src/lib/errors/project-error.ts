import { BaseError } from './base-error';

export class ProjectError extends BaseError {
    constructor(
        message: string,
        projectId: string,
        operation: string,
        context?: Record<string, any>
    ) {
        super(message, 'PROJECT_ERROR', {
            projectId,
            operation,
            ...context
        });
    }
}