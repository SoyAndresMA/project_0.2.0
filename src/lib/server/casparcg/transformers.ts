import { CasparCGServer } from '@/lib/db/types';
import { MirasCasparCGServerResponse } from '@/lib/api/types';
import { MirasCasparCGServerState, MirasServerStatus } from '../types/server-status';
import { CasparClip } from '@/lib/db/types';
import { 
    MirasCasparCGClipResponse, 
    MirasCasparCGClipState 
} from '@/lib/api/types';

/**
 * Transforms a database server record and its state into an API response
 */
export function transformToApiResponse(
    dbServer: CasparCGServer, 
    serverState?: MirasCasparCGServerState
): MirasCasparCGServerResponse {
    return {
        id: dbServer.id,
        name: dbServer.name,
        host: dbServer.host,
        port: dbServer.port,
        enabled: dbServer.enabled === 1,
        description: dbServer.description,
        version: serverState?.version || dbServer.version,
        mediaLibrary: dbServer.media_library,
        status: serverState?.status || MirasServerStatus.DISCONNECTED,
        lastError: serverState?.lastError,
        lastConnectionAttempt: serverState?.lastConnectionAttempt,
        createdAt: dbServer.created_at || new Date().toISOString(),
        updatedAt: dbServer.updated_at || new Date().toISOString()
    };
}

/**
 * Creates a new server state object
 */
export function createServerState(
    id: string, 
    status: MirasServerStatus,
    options?: Partial<MirasCasparCGServerState>
): MirasCasparCGServerState {
    return {
        id,
        status,
        lastConnectionAttempt: new Date().toISOString(),
        ...options
    };
}

/**
 * Updates an existing server state
 */
export function updateServerState(
    currentState: MirasCasparCGServerState,
    updates: Partial<MirasCasparCGServerState>
): MirasCasparCGServerState {
    return {
        ...currentState,
        ...updates,
        lastConnectionAttempt: updates.lastConnectionAttempt || new Date().toISOString()
    };
}

/**
 * Transforms a database clip record and its state into an API response
 */
export function transformClipToApiResponse(
    dbClip: CasparClip, 
    clipState?: MirasCasparCGClipState
): MirasCasparCGClipResponse {
    return {
        id: dbClip.id,
        eventId: dbClip.event_id,
        typeItemId: dbClip.type_item_id,
        casparCGServerId: dbClip.casparcg_server_id || '',
        itemUnionId: dbClip.item_union_id,
        name: dbClip.name,
        description: dbClip.description,
        positionRow: dbClip.position_row,
        positionColumn: dbClip.position_column,
        label: dbClip.label,
        channel: dbClip.channel,
        layer: dbClip.layer,
        loop: dbClip.loop === 1,
        delay: dbClip.delay,
        transitionType: dbClip.transition_type,
        transitionDuration: dbClip.transition_duration,
        createdAt: dbClip.created_at || new Date().toISOString(),
        updatedAt: dbClip.updated_at || new Date().toISOString(),
        state: clipState
    };
}

/**
 * Creates a new clip state object
 */
export function createClipState(
    clipId: string,
    channel: number,
    layer: number,
    filename: string,
    options?: Partial<MirasCasparCGClipState>
): MirasCasparCGClipState {
    return {
        playing: false,
        paused: false,
        channel,
        layer,
        filename,
        ...options
    };
}

/**
 * Updates an existing clip state
 */
export function updateClipState(
    currentState: MirasCasparCGClipState,
    updates: Partial<MirasCasparCGClipState>
): MirasCasparCGClipState {
    return {
        ...currentState,
        ...updates
    };
}
