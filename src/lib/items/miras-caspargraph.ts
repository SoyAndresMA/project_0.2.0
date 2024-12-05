import { CasparCGServerService } from '../db/services/casparcg-server-service';
import { SSEService } from '../sse/sse-service';
import { SSEEventType } from '../sse/events';
import { CasparError } from '@/lib/errors/caspar-error';
import logger from '@/lib/logger/winston-logger';

export interface MirasCasparGraphConfig {
    id: string;
    name: string;
    casparcg_server_id?: string;
    channel?: number;
    layer?: number;
    duration?: number;
    keyvalue?: string;
}

export class MirasCasparGraph {
    private serverService: CasparCGServerService;
    private sseService: SSEService;

    constructor(private config: MirasCasparGraphConfig) {
        this.serverService = CasparCGServerService.getInstance();
        this.sseService = SSEService.getInstance();
    }

    public async play(): Promise<void> {
        if (!this.config.casparcg_server_id) {
            throw new CasparError(
                'Server ID is required',
                'unknown',
                'play',
                { graphId: this.config.id }
            );
        }

        if (!this.config.name) {
            throw new CasparError(
                'Template name is required',
                this.config.casparcg_server_id,
                'play',
                { graphId: this.config.id }
            );
        }

        logger.info('Playing template', {
            templateName: this.config.name,
            serverId: this.config.casparcg_server_id,
            graphId: this.config.id
        });

        try {
            const server = await this.serverService.findById(this.config.casparcg_server_id);
            if (!server) {
                throw new CasparError(
                    'Server not found',
                    this.config.casparcg_server_id,
                    'play',
                    { graphId: this.config.id }
                );
            }

            // Enviar comando CG ADD para cargar y mostrar el template
            await server.cgAdd(
                this.config.channel || 1,
                this.config.layer || 10,
                this.config.name,
                this.config.keyvalue ? JSON.parse(this.config.keyvalue) : {},
                this.config.duration || 0
            );

            logger.info('Template played successfully', {
                templateName: this.config.name,
                graphId: this.config.id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: this.config.id,
                itemType: 'caspargraph',
                state: { 
                    playing: true,
                    paused: false,
                    error: null
                }
            });
        } catch (error) {
            logger.error('Error playing template', {
                error,
                templateName: this.config.name,
                graphId: this.config.id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: this.config.id,
                itemType: 'caspargraph',
                state: { 
                    playing: false,
                    paused: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });

            throw error instanceof CasparError ? error : new CasparError(
                'Failed to play template',
                this.config.casparcg_server_id || 'unknown',
                'play',
                { 
                    graphId: this.config.id,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public async stop(): Promise<void> {
        if (!this.config.casparcg_server_id) {
            throw new CasparError(
                'Server ID is required',
                'unknown',
                'stop',
                { graphId: this.config.id }
            );
        }

        logger.info('Stopping template', {
            templateName: this.config.name,
            graphId: this.config.id
        });

        try {
            const server = await this.serverService.findById(this.config.casparcg_server_id);
            if (!server) {
                throw new CasparError(
                    'Server not found',
                    this.config.casparcg_server_id,
                    'stop',
                    { graphId: this.config.id }
                );
            }

            // Enviar comando CG STOP para detener el template
            await server.cgStop(
                this.config.channel || 1,
                this.config.layer || 10
            );

            logger.info('Template stopped successfully', {
                templateName: this.config.name,
                graphId: this.config.id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: this.config.id,
                itemType: 'caspargraph',
                state: { 
                    playing: false,
                    paused: false,
                    error: null
                }
            });
        } catch (error) {
            logger.error('Error stopping template', {
                error,
                templateName: this.config.name,
                graphId: this.config.id
            });

            throw error instanceof CasparError ? error : new CasparError(
                'Failed to stop template',
                this.config.casparcg_server_id || 'unknown',
                'stop',
                { 
                    graphId: this.config.id,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public async update(data: Record<string, any>): Promise<void> {
        if (!this.config.casparcg_server_id) {
            throw new CasparError(
                'Server ID is required',
                'unknown',
                'update',
                { graphId: this.config.id }
            );
        }

        logger.info('Updating template data', {
            templateName: this.config.name,
            graphId: this.config.id,
            data
        });

        try {
            const server = await this.serverService.findById(this.config.casparcg_server_id);
            if (!server) {
                throw new CasparError(
                    'Server not found',
                    this.config.casparcg_server_id,
                    'update',
                    { graphId: this.config.id }
                );
            }

            // Enviar comando CG UPDATE para actualizar los datos del template
            await server.cgUpdate(
                this.config.channel || 1,
                this.config.layer || 10,
                data
            );

            logger.info('Template data updated successfully', {
                templateName: this.config.name,
                graphId: this.config.id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: this.config.id,
                itemType: 'caspargraph',
                state: { 
                    updated: true,
                    data
                }
            });
        } catch (error) {
            logger.error('Error updating template data', {
                error,
                templateName: this.config.name,
                graphId: this.config.id
            });

            throw error instanceof CasparError ? error : new CasparError(
                'Failed to update template data',
                this.config.casparcg_server_id || 'unknown',
                'update',
                { 
                    graphId: this.config.id,
                    originalError: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public getId(): string {
        return this.config.id;
    }

    public getName(): string {
        return this.config.name;
    }

    public getServerId(): string | undefined {
        return this.config.casparcg_server_id;
    }
}