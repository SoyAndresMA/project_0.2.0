import { 
    MirasCasparCGServerResponse, 
    MirasCasparCGClipResponse,
    MirasCasparCGClipState,
    MirasCasparCGClipPlayResponse,
    MirasCasparCGClipStopResponse,
    MirasCasparCGServerLogMessage 
} from '../lib/api/types';

/**
 * Hook state for CasparCG Server management
 */
export interface UseMirasCasparCGServerState {
    servers: MirasCasparCGServerResponse[];
    selectedServer: MirasCasparCGServerResponse | null;
    isLoading: boolean;
    error: string | null;
    serverLogs: MirasCasparCGServerLogMessage[];
}

/**
 * Hook result interface for CasparCG Server management
 */
export interface UseMirasCasparCGServerResult {
    // State
    servers: MirasCasparCGServerResponse[];
    selectedServer: MirasCasparCGServerResponse | null;
    isLoading: boolean;
    error: string | null;
    serverLogs: MirasCasparCGServerLogMessage[];

    // Actions
    fetchServers: () => Promise<void>;
    selectServer: (server: MirasCasparCGServerResponse) => void;
    createServer: (data: Partial<MirasCasparCGServerResponse>) => Promise<MirasCasparCGServerResponse>;
    updateServer: (id: string, data: Partial<MirasCasparCGServerResponse>) => Promise<MirasCasparCGServerResponse>;
    deleteServer: (id: string) => Promise<void>;
    connectServer: (id: string) => Promise<void>;
    disconnectServer: (id: string) => Promise<void>;
}

/**
 * Hook result interface for CasparCG Clip management
 */
export interface UseMirasCasparCGClipResult {
    clips: MirasCasparCGClipResponse[];
    selectedClip: MirasCasparCGClipResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchClips: (eventId?: string, serverId?: string) => Promise<void>;
    selectClip: (clip: MirasCasparCGClipResponse) => void;
    createClip: (data: Partial<MirasCasparCGClipResponse>) => Promise<MirasCasparCGClipResponse>;
    updateClip: (id: string, data: Partial<MirasCasparCGClipResponse>) => Promise<MirasCasparCGClipResponse>;
    updatePosition: (id: string, position: { row: number; column: number }) => Promise<MirasCasparCGClipResponse>;
    deleteClip: (id: string) => Promise<void>;
    playClip: (clipId: string) => Promise<MirasCasparCGClipPlayResponse>;
    stopClip: (clipId: string) => Promise<MirasCasparCGClipStopResponse>;
    clipStates: Record<string, MirasCasparCGClipState>;
    checkServerStatus: (serverId: string) => Promise<{ isConnected: boolean; lastError?: string }>;
}

/**
 * Props for CasparCG Server components
 */
export interface MirasCasparCGServerProps {
    server: MirasCasparCGServerResponse;
    onConnect?: (id: string) => Promise<void>;
    onDisconnect?: (id: string) => Promise<void>;
    onSelect?: (server: MirasCasparCGServerResponse) => void;
    selected?: boolean;
}
