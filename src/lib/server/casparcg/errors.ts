export enum CasparCGErrorCodes {
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    INVALID_CHANNEL = 'INVALID_CHANNEL',
    INVALID_LAYER = 'INVALID_LAYER',
    MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND',
    MEDIA_LOAD_ERROR = 'MEDIA_LOAD_ERROR',
    PLAYBACK_ERROR = 'PLAYBACK_ERROR',
    SERVER_NOT_RESPONDING = 'SERVER_NOT_RESPONDING',
    VERSION_MISMATCH = 'VERSION_MISMATCH',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface CasparCGErrorDetails {
    serverName?: string;
    host?: string;
    port?: number;
    channel?: number;
    layer?: number;
    mediaPath?: string;
}

export class CasparCGError extends Error {
    constructor(
        public readonly code: CasparCGErrorCodes,
        message: string,
        public readonly userMessage: string,
        public readonly details?: CasparCGErrorDetails
    ) {
        super(message);
        this.name = 'CasparCGError';
    }

    public toJSON() {
        return {
            code: this.code,
            message: this.message,
            userMessage: this.userMessage,
            details: this.details
        };
    }
}

export function getErrorUserMessage(code: CasparCGErrorCodes, details?: CasparCGErrorDetails): string {
    const serverInfo = details?.serverName 
        ? `server "${details.serverName}" (${details.host}:${details.port})`
        : 'server';

    switch (code) {
        case CasparCGErrorCodes.CONNECTION_ERROR:
            return `Could not connect to ${serverInfo}. Please check if the server is running and accessible.`;
        
        case CasparCGErrorCodes.CONNECTION_TIMEOUT:
            return `Connection timeout while trying to connect to ${serverInfo}. The server might be busy or unreachable.`;
        
        case CasparCGErrorCodes.AUTHENTICATION_ERROR:
            return `Authentication failed for ${serverInfo}. Please check your credentials.`;
        
        case CasparCGErrorCodes.INVALID_CHANNEL:
            return `Invalid channel ${details?.channel} specified for ${serverInfo}.`;
        
        case CasparCGErrorCodes.INVALID_LAYER:
            return `Invalid layer ${details?.layer} specified for channel ${details?.channel}.`;
        
        case CasparCGErrorCodes.MEDIA_NOT_FOUND:
            return `Media file "${details?.mediaPath}" not found on ${serverInfo}.`;
        
        case CasparCGErrorCodes.MEDIA_LOAD_ERROR:
            return `Failed to load media file "${details?.mediaPath}" on ${serverInfo}.`;
        
        case CasparCGErrorCodes.PLAYBACK_ERROR:
            return `Error during playback on channel ${details?.channel}, layer ${details?.layer}.`;
        
        case CasparCGErrorCodes.SERVER_NOT_RESPONDING:
            return `${serverInfo} is not responding to commands. The server might be overloaded.`;
        
        case CasparCGErrorCodes.VERSION_MISMATCH:
            return `Incompatible server version detected on ${serverInfo}. Please update the server or client.`;
        
        default:
            return `An unexpected error occurred while communicating with ${serverInfo}.`;
    }
}
