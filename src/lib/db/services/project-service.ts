import { MirasProject } from '@/lib/project/miras-project';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { MirasCasparClip, MirasCasparClipConfig } from '@/lib/items/miras-casparclip';
import { MirasCasparGraph, MirasCasparGraphConfig } from '@/lib/items/miras-caspargraph';
import { BaseService } from './base-service';
import { CasparCGServerService } from './casparcg-server-service';

export interface ProjectEntity {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}
import { ProjectError } from '@/lib/errors/project-error';
import logger from '@/lib/logger/winston-logger';

export class ProjectService extends BaseService<ProjectEntity> {
    private static instance: ProjectService;
    private project: MirasProject | null = null;
    private sseService: SSEService;

    private constructor() {
        super('projects');
        this.sseService = SSEService.getInstance();
    }

    public static getInstance(): ProjectService {
        if (!ProjectService.instance) {
            ProjectService.instance = new ProjectService();
        }
        return ProjectService.instance;
    }

    protected mapToEntity(row: any): ProjectEntity {
        return {
            id: row.id,
            name: row.name,
            description: row.description || '',
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    public setProject(project: MirasProject): void {
        if (!project) {
            logger.error('Attempted to set null project');
            return;
        }

        logger.info('Setting project', {
            projectId: project.getState().id,
            projectName: project.getState().name
        });

        this.project = project;

        // Broadcast del cambio de proyecto
        this.sseService.broadcast(SSEEventType.PROJECT_LOADED, {
            timestamp: Date.now(),
            entityId: project.getState().id,
            state: project.getState()
        });
    }

    public getProject(): MirasProject | null {
        return this.project;
    }

    public findClipInProject(clipId: string): MirasCasparClip | null {
        if (!this.project) {
            logger.error('No project loaded when searching for clip', { clipId });
            return null;
        }

        const projectState = this.project.getState();
        
        logger.debug('Searching for clip in project', {
            clipId,
            projectId: projectState.id,
            projectName: projectState.name,
            eventCount: Object.keys(projectState.events).length
        });
        
        // Buscar en todos los eventos
        for (const [eventId, event] of Object.entries(projectState.events)) {
            logger.debug(`Searching in event`, {
                clipId,
                eventId,
                eventName: event.name,
                rowCount: Object.keys(event.rows).length
            });
            
            // Buscar en todas las filas del evento
            for (const [rowId, row] of Object.entries(event.rows)) {
                logger.debug(`Searching in row`, {
                    clipId,
                    eventId,
                    rowId,
                    itemCount: Object.keys(row.items).length
                });
                
                // Buscar en todos los items de la fila
                for (const [itemId, item] of Object.entries(row.items)) {
                    logger.debug(`Checking item`, {
                        clipId,
                        itemId,
                        itemType: item.typeItem?.item_type,
                        itemName: item.data.name
                    });
                    
                    if (item.data.id === clipId && 
                        item.typeItem?.item_type === 'casparclip') {
                        
                        logger.info('Found clip in project', {
                            clipId: item.data.id,
                            clipName: item.data.name,
                            projectId: this.project.getState().id,
                            eventId,
                            rowId,
                            itemId,
                            serverId: item.data.casparcg_server_id,
                            channel: item.data.channel,
                            layer: item.data.layer
                        });
                        
                        return new MirasCasparClip({
                            id: item.data.id,
                            name: item.data.name,
                            casparcg_server_id: item.data.casparcg_server_id,
                            channel: item.data.channel,
                            layer: item.data.layer
                        });
                    }
                }
            }
        }

        logger.warn('Clip not found in project', {
            clipId,
            projectId: this.project.getState().id,
            projectName: this.project.getState().name,
            eventCount: Object.keys(projectState.events).length
        });

        return null;
    }

    private findGraphInProject(graphId: string): MirasCasparGraph | null {
        if (!this.project) {
            logger.error('No project loaded when searching for graph', { graphId });
            return null;
        }

        const projectState = this.project.getState();
        
        // Buscar en todos los eventos
        for (const event of Object.values(projectState.events)) {
            // Buscar en todas las filas del evento
            for (const row of Object.values(event.rows)) {
                // Buscar en todos los items de la fila
                for (const item of Object.values(row.items)) {
                    if (item.data.id === graphId && 
                        (item.typeItem?.item_type === 'caspar_graph' || 
                         item.typeItem?.item_type === 'caspargraph')) {
                        
                        logger.debug('Found graph in project', {
                            graphId: item.data.id,
                            graphName: item.data.name,
                            projectId: this.project.getState().id,
                            itemType: item.typeItem?.item_type
                        });
                        
                        return new MirasCasparGraph({
                            id: item.data.id,
                            name: item.data.name,
                            casparcg_server_id: item.data.casparcg_server_id,
                            channel: item.data.channel,
                            layer: item.data.layer,
                            duration: item.data.duration,
                            keyvalue: item.data.keyvalue
                        });
                    }
                }
            }
        }

        logger.warn('Graph not found in project', {
            graphId,
            projectId: this.project.getState().id
        });

        return null;
    }

    public async playGraph(graphId: string): Promise<void> {
        if (!this.project) {
            const error = 'No project loaded';
            logger.error(error, { graphId });
            throw new ProjectError(error, 'unknown', 'playGraph', { graphId });
        }

        logger.info('Attempting to play graph', {
            graphId,
            projectId: this.project.getState().id,
            projectName: this.project.getState().name
        });

        const graph = this.findGraphInProject(graphId);
        if (!graph) {
            const error = `Graph ${graphId} not found in project`;
            logger.error(error, {
                graphId,
                projectId: this.project.getState().id
            });
            throw new ProjectError(error, this.project.getState().id, 'playGraph', { graphId });
        }

        // Actualizar el estado de reproducción
        this.project.updateGraphPlaybackState(graphId, 'playing');
        
        try {
            await graph.play();
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: graphId,
                itemType: 'caspargraph',
                state: 'playing'
            });
        } catch (error) {
            logger.error('Error playing graph', {
                error,
                graphId,
                projectId: this.project.getState().id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: graphId,
                itemType: 'caspargraph',
                state: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async stopGraph(graphId: string): Promise<void> {
        if (!this.project) {
            const error = 'No project loaded';
            logger.error(error, { graphId });
            throw new ProjectError(error, 'unknown', 'stopGraph', { graphId });
        }

        logger.info('Attempting to stop graph', {
            graphId,
            projectId: this.project.getState().id,
            projectName: this.project.getState().name
        });

        const graph = this.findGraphInProject(graphId);
        if (!graph) {
            const error = `Graph ${graphId} not found in project`;
            logger.error(error, {
                graphId,
                projectId: this.project.getState().id
            });
            throw new ProjectError(error, this.project.getState().id, 'stopGraph', { graphId });
        }

        // Actualizar el estado de reproducción
        this.project.updateGraphPlaybackState(graphId, 'stopped');
        
        try {
            await graph.stop();
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: graphId,
                itemType: 'caspargraph',
                state: 'stopped'
            });
        } catch (error) {
            logger.error('Error stopping graph', {
                error,
                graphId,
                projectId: this.project.getState().id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: graphId,
                itemType: 'caspargraph',
                state: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async updateGraph(graphId: string, data: Record<string, any>): Promise<void> {
        if (!this.project) {
            const error = 'No project loaded';
            logger.error(error, { graphId });
            throw new ProjectError(error, 'unknown', 'updateGraph', { graphId });
        }

        logger.info('Attempting to update graph', {
            graphId,
            projectId: this.project.getState().id,
            projectName: this.project.getState().name,
            data
        });

        const graph = this.findGraphInProject(graphId);
        if (!graph) {
            const error = `Graph ${graphId} not found in project`;
            logger.error(error, {
                graphId,
                projectId: this.project.getState().id
            });
            throw new ProjectError(error, this.project.getState().id, 'updateGraph', { graphId });
        }
        
        try {
            await graph.update(data);
            
            this.sseService.broadcast(SSEEventType.ITEM_DATA_UPDATED, {
                timestamp: Date.now(),
                entityId: graphId,
                itemType: 'caspargraph',
                data
            });
        } catch (error) {
            logger.error('Error updating graph', {
                error,
                graphId,
                projectId: this.project.getState().id
            });

            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: graphId,
                itemType: 'caspargraph',
                state: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async create(data: Partial<ProjectEntity>): Promise<ProjectEntity> {
        const project = await super.create(data);
        this.sseService.broadcast(SSEEventType.PROJECT_CREATED, {
            timestamp: Date.now(),
            entity: project
        });
        return project;
    }

    public async update(id: string, data: Partial<ProjectEntity>): Promise<ProjectEntity> {
        const project = await super.update(id, data);
        this.sseService.broadcast(SSEEventType.PROJECT_UPDATED, {
            timestamp: Date.now(),
            entity: project
        });
        return project;
    }

    public async delete(id: string): Promise<void> {
        await super.delete(id);
        this.sseService.broadcast(SSEEventType.PROJECT_DELETED, {
            timestamp: Date.now(),
            id
        });
    }

    public async unloadProject(id: string): Promise<void> {
        logger.info('[ProjectService] 🔄 Unloading project', { id });

        const project = this.getProject();
        if (!project) {
            logger.warn('No project to unload');
            return;
        }

        if (project.getState().id !== id) {
            logger.error('Project ID mismatch', {
                requestedId: id,
                loadedProjectId: project.getState().id
            });
            throw new ProjectError('Project ID mismatch');
        }

        try {
            // Detener todas las reproducciones activas
            const projectState = project.getState();
            for (const [eventId, event] of Object.entries(projectState.events)) {
                for (const [rowId, row] of Object.entries(event.rows)) {
                    for (const [itemId, item] of Object.entries(row.items)) {
                        if (item.type === 'clip') {
                            const clip = this.findClipInProject(itemId);
                            if (clip) {
                                try {
                                    await clip.stop();
                                } catch (error) {
                                    logger.warn('Error stopping clip during project unload', {
                                        clipId: itemId,
                                        error: error instanceof Error ? error.message : 'Unknown error'
                                    });
                                }
                            }
                        } else if (item.type === 'graph') {
                            const graph = this.findGraphInProject(itemId);
                            if (graph) {
                                try {
                                    await graph.stop();
                                } catch (error) {
                                    logger.warn('Error stopping graph during project unload', {
                                        graphId: itemId,
                                        error: error instanceof Error ? error.message : 'Unknown error'
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Limpiar el estado del proyecto
            this.project = null;

            // Notificar al frontend
            this.sseService.broadcast(SSEEventType.PROJECT_UNLOADED, {
                timestamp: Date.now(),
                entityId: id
            });

            logger.info('[ProjectService] ✅ Project unloaded successfully', { id });
        } catch (error) {
            logger.error('Error unloading project', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async loadProject(id: string): Promise<void> {
        console.log(`[ProjectService] 🔄 Loading project ${id}`);
        
        try {
            // Obtener datos del proyecto
            const projectData = await this.findById(id);
            if (!projectData) {
                throw new Error(`Project ${id} not found`);
            }

            // Crear y cargar el proyecto
            const project = new MirasProject(
                projectData.id,
                projectData.name,
                projectData.description
            );

            // Cargar todos los datos del proyecto
            await project.load();

            // Establecer el proyecto como actual
            this.setProject(project);

            // Notificar que el proyecto se ha cargado
            this.sseService.broadcast(SSEEventType.PROJECT_LOADED, {
                timestamp: Date.now(),
                projectId: project.getState().id,
                state: project.getState()
            });
        } catch (error) {
            console.error(`[ProjectService] ❌ Error loading project ${id}:`, error);
            throw error;
        }
    }
}