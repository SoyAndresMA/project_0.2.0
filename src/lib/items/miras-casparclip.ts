import { CasparCGServerService } from '../db/services/casparcg-server-service';
import { SSEService } from '../sse/sse-service';
import { SSEEventType } from '../sse/events';

export interface MirasCasparClipConfig {
    id: string;
    name: string;
    casparcg_server_id?: string;
    channel?: number;
    layer?: number;
    loop?: number;
}

export class MirasCasparClip {
    private serverService: CasparCGServerService;
    private sseService: SSEService;

    constructor(private config: MirasCasparClipConfig) {
        this.serverService = CasparCGServerService.getInstance();
        this.sseService = SSEService.getInstance();
    }

    public async play(): Promise<void> {
        if (!this.config.casparcg_server_id) {
            const error = 'Server ID is required';
            console.error(`[MirasCasparClip] ❌ ${error}`);
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                clipId: this.config.id,
                error,
                timestamp: Date.now()
            });
            throw new Error(error);
        }

        if (!this.config.name) {
            const error = 'Clip name is required';
            console.error(`[MirasCasparClip] ❌ ${error}`);
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                clipId: this.config.id,
                error,
                timestamp: Date.now()
            });
            throw new Error(error);
        }

        // Verificar el estado del servidor antes de intentar reproducir
        const server = await this.serverService.findById(this.config.casparcg_server_id);
        if (!server) {
            const error = `Server ${this.config.casparcg_server_id} not found`;
            console.error(`[MirasCasparClip] ❌ ${error}`);
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                clipId: this.config.id,
                error,
                timestamp: Date.now()
            });
            throw new Error(error);
        }

        if (server.getStatus() === 'DISCONNECTED') {
            const error = `Cannot play clip: Server ${this.config.casparcg_server_id} is disconnected`;
            console.error(`[MirasCasparClip] ❌ ${error}`);
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                clipId: this.config.id,
                error,
                timestamp: Date.now()
            });
            throw new Error(error);
        }

        console.log(`[MirasCasparClip] 🎬 Playing clip ${this.config.name} on server ${this.config.casparcg_server_id}`);

        try {
            await this.serverService.playClip(
                this.config.casparcg_server_id,
                this.config.channel || 1,
                this.config.layer || 10,
                this.config.name
            );
            console.log(`[MirasCasparClip] ✅ Play command executed successfully for clip ${this.config.name}`);

            this.sseService.broadcast(SSEEventType.CLIP_PLAYED, {
                clipId: this.config.id,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error(`[MirasCasparClip] ❌ Error playing clip ${this.config.name}:`, error);
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                clipId: this.config.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            });
            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (!this.config.casparcg_server_id) {
            throw new Error('Server ID is required');
        }

        console.log(`[MirasCasparClip] 🛑 Stopping clip ${this.config.name} on server ${this.config.casparcg_server_id}`);

        try {
            await this.serverService.stopClip(
                this.config.casparcg_server_id,
                this.config.channel || 1,
                this.config.layer || 10
            );
            console.log(`[MirasCasparClip] ✅ Stop command executed successfully for clip ${this.config.name}`);

            this.sseService.broadcast(SSEEventType.CLIP_STOPPED, {
                clipId: this.config.id,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error(`[MirasCasparClip] ❌ Error stopping clip ${this.config.name}:`, error);
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                clipId: this.config.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            });
            throw error;
        }
    }

    public getId(): string {
        return this.config.id;
    }

    public getName(): string {
        return this.config.name;
    }

    public getServerId(): string {
        return this.config.casparcg_server_id;
    }
}
