import { MirasServerStatus } from '../server/types/server-status';

/**
 * API Response type for Server
 * Represents the server data as it will be sent to the frontend
 */
export interface MirasServerResponse {
    // Base fields
    id: string;
    name: string;
    host: string;
    port: number;
    enabled: boolean;           // Converted from DB's number (0/1)
    description?: string;
    
    // Server state
    status: MirasServerStatus;
    version?: string;
    mediaLibrary?: string;
    lastError?: string;
    lastConnectionAttempt?: string;    // ISO date string
    
    // Audit fields
    createdAt: string;         // ISO date string
    updatedAt: string;         // ISO date string
}

/**
 * API Request type for connecting to Server
 */
export interface MirasServerConnectRequest {
    id: string;
}

/**
 * API Response for connection attempts
 */
export interface MirasServerConnectResponse {
    connected: boolean;
    error?: string;
}

/**
 * Server log message format for API responses
 */
export interface MirasServerLogMessage {
    timestamp: string;          // ISO date string
    type: 'info' | 'error' | 'warning';
    message: string;
}

/**
 * API types for Clips
 */
export interface MirasClipResponse {
    id: string;
    eventId: string;
    typeItemId: string;
    itemUnionId: string;
    name: string;
    description?: string;
    positionRow: number;
    positionColumn: number;
    label?: string;
    loop?: boolean;
    delay?: number;
    transitionType?: string;
    transitionDuration?: number;
    createdAt: string;
    updatedAt: string;
    state?: MirasClipState;
}

export interface MirasClipState {
    playing: boolean;
    paused: boolean;
    position?: number;
    length?: number;
    error?: string;
}

export interface MirasClipPlayRequest {
    clipId: string;
}

export interface MirasClipPlayResponse {
    success: boolean;
    error?: string;
    state?: MirasClipState;
}

export interface MirasClipStopRequest {
    clipId: string;
}

export interface MirasClipStopResponse {
    success: boolean;
    error?: string;
    state?: MirasClipState;
}

/**
 * API types for Graph (Templates)
 */
export interface MirasGraphResponse {
    id: string;
    eventId: string;
    typeItemId: string;
    itemUnionId: string;
    name: string;
    description?: string;
    positionRow: number;
    positionColumn: number;
    label?: string;
    delay?: number;
    duration?: number;
    keyvalue?: string;
    createdAt: string;
    updatedAt: string;
    state?: MirasGraphState;
}

export interface MirasGraphState {
    playing: boolean;
    paused: boolean;
    error?: string;
    data?: Record<string, any>;
}

export interface MirasGraphPlayRequest {
    graphId: string;
}

export interface MirasGraphPlayResponse {
    success: boolean;
    error?: string;
    state?: MirasGraphState;
}

export interface MirasGraphStopRequest {
    graphId: string;
}

export interface MirasGraphStopResponse {
    success: boolean;
    error?: string;
    state?: MirasGraphState;
}

export interface MirasGraphUpdateRequest {
    graphId: string;
    data: Record<string, any>;
}

export interface MirasGraphUpdateResponse {
    success: boolean;
    error?: string;
    state?: MirasGraphState;
}
