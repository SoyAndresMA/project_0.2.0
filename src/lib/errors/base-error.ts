export class BaseError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly context?: Record<string, any>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    public toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context
        };
    }
}