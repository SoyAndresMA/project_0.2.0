import { CasparCGServer } from '@/lib/db/types';
import { MirasServerState } from '../types/server-status';

/**
 * Configuración para reproducir un clip en CasparCG
 */
export interface MirasCasparCGClipConfig {
    clipId: string;
    channel: number;
    layer: number;
    filename: string;
    loop?: boolean;
    transition?: {
        type: string;
        duration: number;
    };
}

/**
 * Estado de un clip en CasparCG
 */
export interface MirasCasparCGClipState {
    channel: number;
    layer: number;
    playing: boolean;
    paused: boolean;
    position?: number;
    length?: number;
    error?: string;
    filename: string;
}

/**
 * Configuración del servidor CasparCG
 */
export interface MirasCasparCGServerConfig extends CasparCGServer {
    reconnectInterval?: number;  // ms entre intentos de reconexión
    maxReconnectAttempts?: number;
    commandTimeout?: number;  // ms para timeout de comandos
}

/**
 * Respuesta del servidor CasparCG
 */
export interface MirasCasparCGServerResponse {
    success: boolean;
    error?: string;
    data?: any;
}
