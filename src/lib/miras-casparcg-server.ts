import { CasparCG } from 'casparcg-connection';
import { SSEService } from './sse/sse-service';
import { SSEEventType } from './sse/events';
import { CasparCGServer } from './db/types';
import {
    TransitionType,
    TransitionTween,
    Direction,
    Version,
    BlendMode
} from './enums';

export interface PlayOptions {
    loop?: boolean
    seek?: number
    length?: number
    transition?: {
        type: TransitionType
        duration: number
        tween?: TransitionTween
        direction?: Direction
    }
}

export interface InfoChannelState {
    channel: number
    format: string
    frameRate: number
    status: string
    layers: {
        layer: number
        foreground: {
            type: string
            file?: string
            paused: boolean
            loop: boolean
            length: number
            frame: number
            framerate: number
            time: number
            position: number
        }
        background?: {
            type: string
            file?: string
        }
    }[]
}

export class MirasCasparCGServer {
    private connection: CasparCG | null = null;
    private sseService = SSEService.getInstance();
    private isInitialized = false;

    constructor(private readonly config: CasparCGServer) {
        this.connection = new CasparCG({
            host: config.host,
            port: config.port,
            autoConnect: false,
            onConnected: () => {
                this.isInitialized = true;
                console.log(`[MirasCasparCG] Connection established with ${config.name}`);
                this.broadcastLog('server', `Connection established with ${config.name}`);
            },
            onDisconnected: () => {
                this.isInitialized = false;
                console.log(`[MirasCasparCG] Disconnected from ${config.name}`);
                this.broadcastLog('server', `Disconnected from ${config.name}`);
            },
            onError: (error) => {
                console.error(`[MirasCasparCG] Connection error with ${config.name}:`, error);
                this.broadcastLog('error', `Connection error: ${error.message}`);
            },
            onLog: (message) => {
                console.log(`[MirasCasparCG] Server message from ${config.name}:`, message);
                this.broadcastLog('server', `${message}`);
            }
        });
    }

    // Server Info Methods
    getId(): string {
        return this.config.id;
    }

    getName(): string {
        return this.config.name;
    }

    getHost(): string {
        return this.config.host;
    }

    getPort(): number {
        return this.config.port;
    }

    isEnabled(): boolean {
        return this.config.enabled;
    }

    getConfig(): CasparCGServer {
        return { ...this.config };
    }

    private broadcastLog(type: SSEEventType, message: string): void {
        this.sseService.broadcast({
            type,
            data: {
                serverId: this.config.id,
                message
            }
        });
    }

    // Connection Methods
    isConnected(): boolean {
        return this.isInitialized && (this.connection?.connected ?? false);
    }

    async connect(): Promise<void> {
        if (!this.connection) {
            throw new Error('Connection not initialized');
        }
        if (this.isConnected()) {
            throw new Error('Already connected');
        }
        if (!this.isEnabled()) {
            throw new Error('Server is disabled');
        }
        try {
            await this.connection.connect();
        } catch (error) {
            this.isInitialized = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected()) {
            return;
        }
        try {
            await this.connection?.disconnect();
            this.isInitialized = false;
        } catch (error) {
            console.error(`[MirasCasparCG] Error during disconnect:`, error);
            throw error;
        }
    }

    // Version and Info Methods
    async getVersion(): Promise<{ version: Version; fullVersion: string }> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        const response = await this.connection!.version();
        return response.response?.data || { version: '0.0.0' as Version, fullVersion: 'unknown' };
    }

    async getInfo(): Promise<InfoChannelState[]> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        const response = await this.connection!.info();
        return response.response?.data || [];
    }

    async getChannelInfo(channel: number): Promise<InfoChannelState | null> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        const response = await this.connection!.info({ channel });
        return response.response?.data || null;
    }

    // Media Methods
    async play(
        channel: number,
        layer: number,
        file: string,
        options: PlayOptions = {}
    ): Promise<void> {
        if (!this.isConnected()) {
            console.error(`[MirasCasparCG] Cannot play: not connected to server ${this.config.name}`);
            throw new Error('Not connected to server');
        }

        console.log(`[MirasCasparCG] Playing file on server ${this.config.name}:`, {
            channel,
            layer,
            file,
            options
        });

        try {
            await this.connection!.play(channel, layer, file, options.loop, {
                seek: options.seek,
                length: options.length,
                transition: options.transition ? {
                    type: options.transition.type,
                    duration: options.transition.duration,
                    tween: options.transition.tween,
                    direction: options.transition.direction
                } : undefined
            });
            console.log(`[MirasCasparCG] Play command sent successfully to server ${this.config.name}`);
        } catch (error) {
            console.error(`[MirasCasparCG] Error playing file on server ${this.config.name}:`, error);
            throw error;
        }
    }

    async loadbg(
        channel: number,
        layer: number,
        file: string,
        options: PlayOptions & { auto?: boolean } = {}
    ): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }

        await this.connection!.loadbg(channel, layer, file, options.loop, {
            seek: options.seek,
            length: options.length,
            transition: options.transition ? {
                type: options.transition.type,
                duration: options.transition.duration,
                tween: options.transition.tween,
                direction: options.transition.direction
            } : undefined,
            auto: options.auto
        });
    }

    async stop(channel: number, layer: number): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        await this.connection!.stop(channel, layer);
    }

    async pause(channel: number, layer: number): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        await this.connection!.pause(channel, layer);
    }

    async resume(channel: number, layer: number): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        await this.connection!.resume(channel, layer);
    }

    async clear(channel: number, layer?: number): Promise<void> {
        if (!this.isConnected()) {
            throw new Error('Not connected to server');
        }
        await this.connection!.clear(channel, layer);
    }

    async dispose(): Promise<void> {
        await this.disconnect();
        this.connection = null;
        this.isInitialized = false;
    }
}
