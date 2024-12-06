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
        logger.info(`[CasparCG] Initializing server instance`, {
            serverName: this.config.name,
            host: this.config.host,
            port: this.config.port
        });

        this.connection = new CasparCG({
            host: config.host,
            port: config.port,
            autoConnect: false,
            debug: true
        });

        // Usar eventos nativos de CasparCG
        this.connection.on('connected', () => {
            // Actualizar estado
            this.status = MirasServerStatus.CONNECTED;

            // Log
            logger.info(`[CasparCG] Server connected`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                status: this.status
            });

            // Notificar cambio de estado
            this.sseService.broadcast(SSEEventType.SERVER_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: this.config.id,
                state: { status: this.status }
            });

            // Log de servidor
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'info',
                message: `Connected to ${this.config.name}`
            });
        });

        this.connection.on('disconnected', () => {
            // Actualizar estado
            this.status = MirasServerStatus.DISCONNECTED;

            // Log
            logger.info(`[CasparCG] Server disconnected`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                status: this.status
            });

            // Notificar cambio de estado
            this.sseService.broadcast(SSEEventType.SERVER_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: this.config.id,
                state: { status: this.status }
            });

            // Log de servidor
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'info',
                message: `Disconnected from ${this.config.name}`
            });
        });

        logger.info(`[CasparCG] Server instance initialized`, {
            serverName: this.config.name,
            currentStatus: this.status
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
        logger.error(`[CasparCG] Connection failed`, {
            serverName: this.config.name,
            host: this.config.host,
            port: this.config.port,
            error: error instanceof Error ? error.message : 'Unknown error',
            context
        });

        this.status = MirasServerStatus.ERROR;
        const errorMessage = `Connection failed to server "${this.config.name}" (${this.config.host}:${this.config.port})`;
        
        // Notificar el error a través de SSE
        this.broadcastStateChange(errorMessage);
        
        // Notificar el error en los logs
        this.sseService.broadcast(SSEEventType.SERVER_LOG, {
            timestamp: Date.now(),
            entityId: this.config.id,
            level: 'error',
            message: errorMessage
        });

        const casparError = new CasparError(
            'Failed to connect to server',
            this.config.id,
            context,
            {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                originalError: error instanceof Error ? error.message : 'Unknown error'
            }
        );

        throw casparError;
    }

    private async checkServerStatus(): Promise<boolean> {
        try {
            // Intentar obtener la versión del servidor
            const versionResponse = await this.connection.version();
            
            // Si tenemos cualquier respuesta del servidor, considerarlo como conectado
            return this.connection.connected;
        } catch (error) {
            logger.warn(`[CasparCG] Failed to get server version`, {
                serverName: this.config.name,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    public async connect(): Promise<void> {
        logger.info(`[CasparCG] Attempting to connect to server`, {
            serverName: this.config.name,
            host: this.config.host,
            port: this.config.port,
            currentStatus: this.status
        });

        if (this.status === MirasServerStatus.CONNECTED) {
            logger.info(`[CasparCG] Server already connected`, {
                serverName: this.config.name
            });
            return;
        }

        // Actualizar estado a CONNECTING y notificar
        this.status = MirasServerStatus.CONNECTING;
        this.broadcastStateChange();

        try {
            // Intentar conectar
            await this.connection.connect();
            
            // Esperar un poco para que la conexión se establezca
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Actualizar estado
            this.status = MirasServerStatus.CONNECTED;
            
            // Log
            logger.info(`[CasparCG] Server connected`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                status: this.status
            });

            // Notificar cambio de estado
            this.broadcastStateChange();

            // Log de servidor
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'info',
                message: `Connected to ${this.config.name}`
            });

            // Verificar la conexión después de conectar
            try {
                await this.verifyConnection();
            } catch (verifyError) {
                logger.warn(`[CasparCG] Connection verification failed, but server is connected`, {
                    serverName: this.config.name,
                    error: verifyError instanceof Error ? verifyError.message : 'Unknown error'
                });
            }
        } catch (error) {
            this.handleConnectionError(error, 'connect');
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.connection.connected) {
            logger.info(`[CasparCG] Server already disconnected`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port
            });
            return;
        }

        try {
            logger.info(`[CasparCG] Attempting to disconnect from server`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                currentStatus: this.status
            });

            await this.connection.disconnect();
            // El evento 'disconnected' se encargará de actualizar el estado
            
            this.sseService.broadcast(SSEEventType.SERVER_LOG, {
                timestamp: Date.now(),
                entityId: this.config.id,
                level: 'info',
                message: `Disconnected from ${this.config.name}`
            });
        } catch (error) {
            logger.error(`[CasparCG] Disconnection failed`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                error: error instanceof Error ? error.message : 'Unknown error'
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

    public async playClip(channel: number, layer: number, file: string): Promise<void> {
        if (this.status !== MirasServerStatus.CONNECTED) {
            const error = `Server is not connected (status: ${this.status})`;
            this.logger.error(`[MirasCasparCGServer] ❌ ${error}`, {
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port,
                currentStatus: this.status
            });
            throw new Error(error);
        }

        if (!file) {
            const error = 'File name is required';
            this.logger.error(`[MirasCasparCGServer] ❌ ${error}`);
            throw new Error(error);
        }

        this.logger.info(`[MirasCasparCGServer] 🎬 Playing file`, {
            file,
            channel,
            layer,
            serverName: this.config.name,
            host: this.config.host,
            port: this.config.port,
            connectionStatus: this.connection.connected ? 'connected' : 'disconnected'
        });

        try {
            const playCommand = { 
                channel, 
                layer, 
                clip: file 
            };
            this.logger.info(`[MirasCasparCGServer] 📝 Sending play command`, {
                command: playCommand,
                serverName: this.config.name
            });
            
            const { error: playError, request } = await this.connection.play(playCommand);

            if (playError) {
                this.logger.error(`[MirasCasparCGServer] ❌ Error in play command`, {
                    error: playError,
                    command: playCommand,
                    serverName: this.config.name
                });
                throw new Error(playError);
            }

            const response = await request;
            this.logger.info(`[MirasCasparCGServer] ✅ Play command executed successfully`, {
                response,
                serverName: this.config.name
            });
            
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
            this.logger.error(`[MirasCasparCGServer] ❌ Error playing file`, {
                file,
                error: error instanceof Error ? error.message : 'Unknown error',
                serverName: this.config.name,
                host: this.config.host,
                port: this.config.port
            });
            
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