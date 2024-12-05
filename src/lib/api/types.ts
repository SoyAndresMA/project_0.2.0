import { MirasServerStatus } from '../server/types/server-status';

/**
 * API Response type for CasparCG Server
 * Represents the server data as it will be sent to the frontend
 */
export interface MirasCasparCGServerResponse {
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
 * API Request type for connecting to CasparCG Server
 */
export interface MirasCasparCGServerConnectRequest {
    id: string;
}

/**
 * API Response for connection attempts
 */
export interface MirasCasparCGServerConnectResponse {
    connected: boolean;
    error?: string;
}

/**
 * Server log message format for API responses
 */
export interface MirasCasparCGServerLogMessage {
    timestamp: string;          // ISO date string
    type: 'info' | 'error' | 'warning';
    message: string;
}

/**
 * API types for CasparCG Clips
 */
export interface MirasCasparCGClipResponse {
    id: string;
    eventId: string;
    typeItemId: string;
    casparCGServerId: string;
    itemUnionId: string;
    name: string;
    description?: string;
    positionRow: number;
    positionColumn: number;
    label?: string;
    channel?: number;
    layer?: number;
    loop?: boolean;
    delay?: number;
    transitionType?: string;
    transitionDuration?: number;
    createdAt: string;
    updatedAt: string;
    state?: MirasCasparCGClipState;
}

export interface MirasCasparCGClipState {
    playing: boolean;
    paused: boolean;
    position?: number;
    length?: number;
    error?: string;
    channel: number;
    layer: number;
    filename: string;
}

export interface MirasCasparCGClipPlayRequest {
    clipId: string;
}

export interface MirasCasparCGClipPlayResponse {
    success: boolean;
    error?: string;
    state?: MirasCasparCGClipState;
}

export interface MirasCasparCGClipStopRequest {
    clipId: string;
}

export interface MirasCasparCGClipStopResponse {
    success: boolean;
    error?: string;
    state?: MirasCasparCGClipState;
}

/**
 * API types for CasparCG Graph (Templates)
 */
export interface MirasCasparGraphResponse {
    id: string;
    eventId: string;
    typeItemId: string;
    casparCGServerId: string;
    itemUnionId: string;
    name: string;
    description?: string;
    positionRow: number;
    positionColumn: number;
    label?: string;
    channel?: number;
    layer?: number;
    delay?: number;
    duration?: number;
    keyvalue?: string;
    createdAt: string;
    updatedAt: string;
    state?: MirasCasparGraphState;
}

export interface MirasCasparGraphState {
    playing: boolean;
    paused: boolean;
    error?: string;
    channel: number;
    layer: number;
    templateName: string;
    data?: Record<string, any>;
}

export interface MirasCasparGraphPlayRequest {
    graphId: string;
}

export interface MirasCasparGraphPlayResponse {
    success: boolean;
    error?: string;
    state?: MirasCasparGraphState;
}

export interface MirasCasparGraphStopRequest {
    graphId: string;
}

export interface MirasCasparGraphStopResponse {
    success: boolean;
    error?: string;
    state?: MirasCasparGraphState;
}

export interface MirasCasparGraphUpdateRequest {
    graphId: string;
    data: Record<string, any>;
}

export interface MirasCasparGraphUpdateResponse {
    success: boolean;
    error?: string;
    state?: MirasCasparGraphState;
}
