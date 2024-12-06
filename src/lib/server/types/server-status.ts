export enum MirasServerStatus {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    DISCONNECTING = 'DISCONNECTING',
    CONNECTED = 'CONNECTED',
    ERROR = 'ERROR'
}

/**
 * Base server state interface
 */
export interface MirasServerState {
    id: string;
    status: MirasServerStatus;
    lastError?: string;
    lastConnectionAttempt?: string;    // ISO date string
}

/**
 * CasparCG specific server state
 * Extends base state with CasparCG specific fields
 */
export interface MirasCasparCGServerState extends MirasServerState {
    version?: string;
    mediaPath?: string;
    isReconnecting?: boolean;
    reconnectAttempts?: number;
}
