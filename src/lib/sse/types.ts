import { MirasServerState } from '../server/types/server-status';
import { MirasProjectState } from '../project/types';

export interface SSEClient {
    id: string;
    writer: WritableStreamDefaultWriter<Uint8Array>;
    encoder: TextEncoder;
}

export interface SSEEventBase {
    timestamp: number;
    entityId?: string;
}

export interface ProjectEvent extends SSEEventBase {
    state?: MirasProjectState;
}

export interface ItemEvent extends SSEEventBase {
    itemType: string;
    state?: any;
}

export interface ServerEvent extends SSEEventBase {
    state?: MirasServerState;
    message?: string;
}

export interface SystemEvent extends SSEEventBase {
    message: string;
    level: 'info' | 'warning' | 'error';
}