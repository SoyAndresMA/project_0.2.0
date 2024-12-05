import { MirasCasparCGServer } from '@/lib/server/casparcg/miras-casparcg-server';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { MirasServerStatus } from '@/lib/server/types/server-status';
import { MirasCasparCGServerConfig } from '@/lib/server/types/server-config';
import { BaseService } from './base-service';
import { BaseEntity } from '../types';

interface CasparCGServerEntity extends BaseEntity {
    name: string;
    host: string;
    port: number;
    enabled: number;
    description?: string;
    version?: string;
    media_library?: string;
    command_timeout?: number;
}

export class CasparCGServerService extends BaseService<CasparCGServerEntity> {
    private static instance: CasparCGServerService;
    private servers: Map<string, MirasCasparCGServer> = new Map();
    private sseService: SSEService;

    private constructor() {
        super('casparcg_servers');
        this.sseService = SSEService.getInstance();
        this.loadServers();
    }

    public static getInstance(): CasparCGServerService {
        if (!CasparCGServerService.instance) {
            CasparCGServerService.instance = new CasparCGServerService();
        }
        return CasparCGServerService.instance;
    }

    protected mapToEntity(row: any): CasparCGServerEntity {
        return {
            id: row.id,
            name: row.name,
            host: row.host,
            port: row.port,
            enabled: row.enabled,
            description: row.description,
            version: row.version,
            media_library: row.media_library,
            command_timeout: row.command_timeout,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    private async loadServers(): Promise<void> {
        try {
            const serverEntities = await this.findAll();
            for (const entity of serverEntities) {
                if (!this.servers.has(entity.id)) {
                    const config: MirasCasparCGServerConfig = {
                        id: entity.id,
                        name: entity.name,
                        host: entity.host,
                        port: entity.port,
                        enabled: Boolean(entity.enabled),
                        description: entity.description,
                        version: entity.version,
                        mediaLibrary: entity.media_library,
                        commandTimeout: entity.command_timeout
                    };
                    const server = new MirasCasparCGServer(config);
                    this.setupServerEvents(server);
                    this.servers.set(entity.id, server);
                }
            }
        } catch (error) {
            console.error('[CasparCGServerService] Error loading servers:', error);
            throw error;
        }
    }

    private getSerializableServer(server: MirasCasparCGServer) {
        return {
            id: server.config.id,
            name: server.config.name,
            host: server.config.host,
            port: server.config.port,
            enabled: server.config.enabled,
            description: server.config.description,
            version: server.config.version,
            mediaLibrary: server.config.mediaLibrary,
            commandTimeout: server.config.commandTimeout,
            status: server.status
        };
    }

    private setupServerEvents(server: MirasCasparCGServer): void {
        // Escuchar cambios de estado del servidor
        server.on('statusChange', (newStatus: MirasServerStatus) => {
            this.sseService.broadcast(SSEEventType.SERVER_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: server.config.id,
                state: { status: newStatus }
            });
        });

        // Escuchar errores del servidor
        server.on('error', (error: Error) => {
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: server.config.id,
                level: 'error',
                message: error.message
            });
        });
    }

    public async findAll(): Promise<any[]> {
        const entities = await super.findAll();
        
        // Asegurarnos de que todos los servidores están cargados
        for (const entity of entities) {
            if (!this.servers.has(entity.id)) {
                const config: MirasCasparCGServerConfig = {
                    id: entity.id,
                    name: entity.name,
                    host: entity.host,
                    port: entity.port,
                    enabled: Boolean(entity.enabled),
                    description: entity.description,
                    version: entity.version,
                    mediaLibrary: entity.media_library,
                    commandTimeout: entity.command_timeout
                };
                const server = new MirasCasparCGServer(config);
                this.setupServerEvents(server);
                this.servers.set(entity.id, server);
            }
        }
        
        // Devolver versiones serializables de los servidores
        return Array.from(this.servers.values()).map(server => this.getSerializableServer(server));
    }

    public findById(id: string): MirasCasparCGServer | null {
        return this.servers.get(id) || null;
    }

    public async create(config: Omit<MirasCasparCGServerConfig, 'id'>): Promise<MirasCasparCGServer> {
        const entity = await super.create({
            name: config.name,
            host: config.host,
            port: config.port,
            enabled: config.enabled ? 1 : 0,
            description: config.description,
            version: config.version,
            media_library: config.mediaLibrary,
            command_timeout: config.commandTimeout
        });

        const serverConfig: MirasCasparCGServerConfig = {
            id: entity.id,
            name: entity.name,
            host: entity.host,
            port: entity.port,
            enabled: Boolean(entity.enabled),
            description: entity.description,
            version: entity.version,
            mediaLibrary: entity.media_library,
            commandTimeout: entity.command_timeout
        };

        const server = new MirasCasparCGServer(serverConfig);
        this.setupServerEvents(server);
        this.servers.set(entity.id, server);

        return server;
    }

    public async playClip(serverId: string, channel: number, layer: number, filename: string): Promise<void> {
        console.log(`[CasparCGServerService] Playing clip`, {
            filename,
            serverId,
            channel,
            layer,
            availableServers: Array.from(this.servers.keys())
        });
        
        const server = await this.getServerInstance(serverId);
        if (!server) {
            const error = `Server ${serverId} not found. Available servers: ${Array.from(this.servers.keys()).join(', ')}`;
            console.error(`[CasparCGServerService] ${error}`);
            throw new Error(error);
        }

        try {
            await server.playClip(channel, layer, filename);
            console.log(`[CasparCGServerService] Play command sent successfully to server ${serverId}`);
            
            // Notificar a los clientes
            this.sseService.broadcast(SSEEventType.CLIP_PLAYED, {
                timestamp: Date.now(),
                clipId: filename,
                serverId,
                channel,
                layer
            });
        } catch (error) {
            const errorMessage = `Error playing clip on server ${serverId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[CasparCGServerService] ${errorMessage}`);
            
            // Notificar error a los clientes
            this.sseService.broadcast(SSEEventType.CLIP_ERROR, {
                timestamp: Date.now(),
                clipId: filename,
                serverId,
                channel,
                layer,
                error: errorMessage
            });
            throw new Error(errorMessage);
        }
    }

    private async getServerInstance(serverId: string): Promise<MirasCasparCGServer | null> {
        return this.servers.get(serverId) || null;
    }

    public async stopClip(serverId: string, channel: number, layer: number): Promise<void> {
        console.log(`[CasparCGServerService] Stopping clip on server ${serverId}, channel ${channel}, layer ${layer}`);
        try {
            const server = await this.getServerInstance(serverId);
            if (!server) {
                const error = `Server ${serverId} not found`;
                console.error(`[CasparCGServerService] ${error}`);
                throw new Error(error);
            }
            await server.stopClip(channel, layer);
            console.log(`[CasparCGServerService] Stop command sent to server`);
        } catch (error) {
            console.error(`[CasparCGServerService] Error stopping clip:`, error);
            throw error;
        }
    }
}
