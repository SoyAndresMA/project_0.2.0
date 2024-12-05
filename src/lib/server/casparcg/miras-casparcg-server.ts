import { CasparCG } from 'casparcg-connection';
import { MirasServerStatus } from '../types/server-status';
import { SSEService } from '../../sse/sse-service';
import { SSEEventType } from '../../sse/events';
import { CasparCGError, CasparCGErrorCodes, getErrorUserMessage } from './errors';
import { CasparError } from '@/lib/errors/caspar-error';
import logger from '@/lib/logger/winston-logger';

export interface MirasCasparCGServerConfig {
    id: string;
    name: string;
    host: string;
    port: number;
}

export class MirasCasparCGServer {
    private connection: CasparCG;
    private status: MirasServerStatus = MirasServerStatus.DISCONNECTED;
    private sseService: SSEService;
    private logger = logger;

    constructor(public readonly config: MirasCasparCGServerConfig) {
        this.sseService = SSEService.getInstance();
        this.connection = new CasparCG({
            host: config.host,
            port: config.port,
            autoConnect: false,
            debug: true,
            onConnected: () => {
                this.status = MirasServerStatus.CONNECTED;
                this.broadcastStateChange();
            },
            onDisconnected: () => {
                this.status = MirasServerStatus.DISCONNECTED;
                this.broadcastStateChange();
            }
        });
    }

    private broadcastStateChange(error?: string) {
        this.sseService.broadcast(SSEEventType.SERVER_STATE_CHANGED, {
            timestamp: Date.now(),
            entityId: this.config.id,
            state: { 
                status: this.status,
                ...(error && { error })
            }
        });
    }

    private handleConnectionError(error: any, context: string): never {
        const errorMessage = `Connection failed to server "${this.config.name}" (${this.config.host}:${this.config.port})`;
        console.log('[MirasCasparCGServer] ❌', errorMessage, error);

        // Actualizar estado
        this.status = MirasServerStatus.ERROR;
        this.broadcastStateChange(errorMessage);

        // Notificar el error
        this.sseService.broadcast(SSEEventType.SERVER_LOG, {
            timestamp: Date.now(),
            entityId: this.config.id,
            level: 'error',
            message: errorMessage
        });

        throw new Error(errorMessage);
    }

    public async connect(): Promise<void> {
        if (this.status === MirasServerStatus.CONNECTED) {
            logger.info(`Already connected to server`, {
                serverName: this.config.name,
                serverId: this.config.id
            });
            return;
        }

        logger.info(`Connecting to server`, {
            serverName: this.config.name,
            host: this.config.host,
            port: this.config.port
        });
        
        try {
            this.status = MirasServerStatus.CONNECTING;
            this.broadcastStateChange();

            await this.connection.connect();
            logger.info(`Successfully connected to server`, {
                serverName: this.config.name,
                serverId: this.config.id
            });
            
            this.status = MirasServerStatus.CONNECTED;
            this.broadcastStateChange();
        } catch (error) {
            this.status = MirasServerStatus.ERROR;
            
            const casparError = new CasparError(
                'Failed to connect to server',
                this.config.id,
                'connect',
                {
                    serverName: this.config.name,
                    host: this.config.host,
                    port: this.config.port,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
            
            logger.error('Connection failed', {
                error: casparError,
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port
            });
            
            this.broadcastStateChange(error instanceof Error ? error.message : 'Unknown error');
            throw casparError;
        }
    }

    private async verifyConnection(): Promise<void> {
        try {
            // 1. Verificar que podemos obtener la versión
            const versionResponse = await this.connection.version();
            if (!versionResponse || !versionResponse.response || !versionResponse.response.data) {
                throw new CasparCGError(
                    CasparCGErrorCodes.VERSION_MISMATCH,
                    'Invalid version response',
                    'Server returned invalid version information',
                    {
                        serverName: this.config.name,
                        host: this.config.host,
                        port: this.config.port
                    }
                );
            }

            // 2. Verificar que podemos obtener información del servidor
            const infoResponse = await this.connection.info();
            if (!infoResponse || !infoResponse.response) {
                throw new CasparCGError(
                    CasparCGErrorCodes.SERVER_NOT_RESPONDING,
                    'Invalid info response',
                    'Server is not responding correctly',
                    {
                        serverName: this.config.name,
                        host: this.config.host,
                        port: this.config.port
                    }
                );
            }

            console.log(`[MirasCasparCGServer] Connection verified successfully`, {
                version: versionResponse.response.data,
                serverInfo: infoResponse.response.data
            });

        } catch (error) {
            console.error(`[MirasCasparCGServer] Connection verification failed:`, error);
            
            // Si el error ya es un CasparCGError, lo relanzamos
            if (error instanceof CasparCGError) {
                throw error;
            }

            // Si no, creamos un nuevo error específico
            throw new CasparCGError(
                CasparCGErrorCodes.SERVER_NOT_RESPONDING,
                'Connection verification failed',
                'Unable to verify server connection',
                {
                    serverName: this.config.name,
                    host: this.config.host,
                    port: this.config.port
                }
            );
        }
    }

    public async disconnect(): Promise<void> {
        if (this.status === MirasServerStatus.DISCONNECTED) {
            return;
        }

        try {
            await this.connection.disconnect();
            console.log('[MirasCasparCGServer] Disconnection successful');

            this.status = MirasServerStatus.DISCONNECTED;
            this.broadcastStateChange();
            
            // Notificar desconexión exitosa
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'info',
                message: `Disconnected from ${this.config.name}`
            });
        } catch (error) {
            console.error('[MirasCasparCGServer] Disconnect failed:', error);
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async playClip(channel: number, layer: number, file: string): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            const error = 'Server is not connected';
            console.error(`[MirasCasparCGServer] ❌ ${error}`);
            throw new Error(error);
        }

        if (!file) {
            const error = 'File name is required';
            console.error(`[MirasCasparCGServer] ❌ ${error}`);
            throw new Error(error);
        }

        console.log(`[MirasCasparCGServer] 🎬 Playing file "${file}" on channel ${channel}, layer ${layer}`);
        try {
            const playCommand = { 
                channel, 
                layer, 
                clip: file 
            };
            console.log(`[MirasCasparCGServer] 📝 Sending play command:`, JSON.stringify(playCommand, null, 2));
            
            const { error: playError, request } = await this.connection.play(playCommand);

            if (playError) {
                console.error(`[MirasCasparCGServer] ❌ Error in play command:`, playError);
                throw new Error(playError);
            }

            const response = await request;
            console.log(`[MirasCasparCGServer] ✅ Play command executed successfully:`, response);
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: file,
                itemType: 'casparclip',
                state: { 
                    playing: true, 
                    paused: false,
                    position: 0,
                    length: 0,
                    error: null
                }
            });
        } catch (error) {
            console.error(`[MirasCasparCGServer] ❌ Error playing file "${file}":`, error);
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: file,
                itemType: 'casparclip',
                state: { 
                    playing: false, 
                    paused: false,
                    position: 0,
                    length: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            
            throw error;
        }
    }

    public async stopClip(channel: number, layer: number): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            const error = 'Server is not connected';
            console.error(`[MirasCasparCGServer] ❌ ${error}`);
            throw new Error(error);
        }

        console.log(`[MirasCasparCGServer] 🛑 Stopping clip on channel ${channel}, layer ${layer}`);
        try {
            const { error: stopError, request } = await this.connection.stop({ 
                channel, 
                layer 
            });

            if (stopError) {
                console.error(`[MirasCasparCGServer] ❌ Error in stop command:`, stopError);
                throw new Error(stopError);
            }

            const response = await request;
            console.log(`[MirasCasparCGServer] ✅ Stop command executed successfully:`, response);
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: `${channel}-${layer}`,
                itemType: 'casparclip',
                state: { 
                    playing: false, 
                    paused: false,
                    position: 0,
                    length: 0,
                    error: null
                }
            });
        } catch (error) {
            console.error(`[MirasCasparCGServer] ❌ Error stopping clip:`, error);
            
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            
            throw error;
        }
    }

    public async loadClip(channel: number, layer: number, file: string): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            throw new Error('Server is not connected');
        }

        try {
            await this.connection.load(channel, layer, file);
            console.log('[MirasCasparCGServer] Load successful');
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: file,
                itemType: 'casparclip',
                state: { 
                    loaded: true,
                    channel,
                    layer
                }
            });
        } catch (error) {
            console.error('[MirasCasparCGServer] Load failed:', error);
            
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            
            throw error;
        }
    }

    public async cgAdd(
        channel: number,
        layer: number,
        template: string,
        data: Record<string, any> = {},
        playOnLoad: boolean = true
    ): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            throw new CasparError(
                'Server is not connected',
                this.config.id,
                'cgAdd',
                { channel, layer, template }
            );
        }

        this.logger.info('Adding CG template', {
            serverId: this.config.id,
            template,
            channel,
            layer,
            data
        });

        try {
            const { error: cgError, request } = await this.connection.cgAdd({
                channel,
                layer,
                template,
                playOnLoad,
                data
            });

            if (cgError) {
                throw new CasparError(
                    cgError,
                    this.config.id,
                    'cgAdd',
                    { channel, layer, template }
                );
            }

            await request;
            this.logger.info('CG template added successfully', {
                serverId: this.config.id,
                template,
                channel,
                layer
            });
        } catch (error) {
            this.logger.error('Error adding CG template', {
                error,
                serverId: this.config.id,
                template,
                channel,
                layer
            });

            throw error instanceof CasparError ? error : new CasparError(
                'Failed to add CG template',
                this.config.id,
                'cgAdd',
                {
                    channel,
                    layer,
                    template,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public async cgUpdate(
        channel: number,
        layer: number,
        data: Record<string, any>
    ): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            throw new CasparError(
                'Server is not connected',
                this.config.id,
                'cgUpdate',
                { channel, layer }
            );
        }

        this.logger.info('Updating CG template', {
            serverId: this.config.id,
            channel,
            layer,
            data
        });

        try {
            const { error: cgError, request } = await this.connection.cgUpdate({
                channel,
                layer,
                data
            });

            if (cgError) {
                throw new CasparError(
                    cgError,
                    this.config.id,
                    'cgUpdate',
                    { channel, layer }
                );
            }

            await request;
            this.logger.info('CG template updated successfully', {
                serverId: this.config.id,
                channel,
                layer
            });
        } catch (error) {
            this.logger.error('Error updating CG template', {
                error,
                serverId: this.config.id,
                channel,
                layer
            });

            throw error instanceof CasparError ? error : new CasparError(
                'Failed to update CG template',
                this.config.id,
                'cgUpdate',
                {
                    channel,
                    layer,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public async cgStop(
        channel: number,
        layer: number
    ): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            throw new CasparError(
                'Server is not connected',
                this.config.id,
                'cgStop',
                { channel, layer }
            );
        }

        this.logger.info('Stopping CG template', {
            serverId: this.config.id,
            channel,
            layer
        });

        try {
            const { error: cgError, request } = await this.connection.cgStop({
                channel,
                layer
            });

            if (cgError) {
                throw new CasparError(
                    cgError,
                    this.config.id,
                    'cgStop',
                    { channel, layer }
                );
            }

            await request;
            this.logger.info('CG template stopped successfully', {
                serverId: this.config.id,
                channel,
                layer
            });
        } catch (error) {
            this.logger.error('Error stopping CG template', {
                error,
                serverId: this.config.id,
                channel,
                layer
            });

            throw error instanceof CasparError ? error : new CasparError(
                'Failed to stop CG template',
                this.config.id,
                'cgStop',
                {
                    channel,
                    layer,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public getStatus(): MirasServerStatus {
        return this.status;
    }

    public on(event: string, listener: (...args: any[]) => void): void {
        // Deprecated: Use SSEService for event handling
        console.warn('Direct event listening is deprecated. Use SSEService instead.');
    }

    public off(event: string, listener: (...args: any[]) => void): void {
        // Deprecated: Use SSEService for event handling
        console.warn('Direct event unsubscription is deprecated. Use SSEService instead.');
    }
}