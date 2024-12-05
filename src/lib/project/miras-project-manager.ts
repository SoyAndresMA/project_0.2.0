import { MirasProject } from './miras-project';
import { ProjectService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { ProjectError } from '@/lib/errors/project-error';
import { CasparGraphService } from '@/lib/db/services/caspar-graph-service';
import logger from '@/lib/logger/winston-logger';

export class MirasProjectManager {
    private static instance: MirasProjectManager;
    private projects: Map<string, MirasProject>;
    private projectService: ProjectService;
    private graphService: CasparGraphService;
    private sseService: SSEService;
    private initialized: boolean = false;

    private constructor() {
        this.projects = new Map();
        this.projectService = ProjectService.getInstance();
        this.graphService = CasparGraphService.getInstance();
        this.sseService = SSEService.getInstance();
        logger.info('MirasProjectManager initialized');
    }

    public static getInstance(): MirasProjectManager {
        if (!MirasProjectManager.instance) {
            MirasProjectManager.instance = new MirasProjectManager();
        }
        return MirasProjectManager.instance;
    }

    private async createProject(projectId: string): Promise<MirasProject> {
        logger.info('Creating project instance', { projectId });

        try {
            const projectData = await this.projectService.findById(projectId);
            if (!projectData) {
                const error = `Project ${projectId} not found`;
                logger.error(error, { projectId });
                throw new ProjectError(error, projectId, 'createProject');
            }

            const project = new MirasProject(
                projectData.id,
                projectData.name,
                projectData.description
            );

            // Cargar clips y graphs
            await project.load();
            const graphs = await this.graphService.findByEventId(projectId);
            project.loadGraphs(graphs);
            logger.info('Project instance created and loaded', {
                projectId,
                projectName: projectData.name,
                graphsCount: graphs.length
            });

            return project;
        } catch (error) {
            logger.error('Failed to create project instance', {
                projectId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error instanceof ProjectError ? error : 
                new ProjectError(
                    'Failed to create project instance',
                    projectId,
                    'createProject',
                    { originalError: error instanceof Error ? error.message : 'Unknown error' }
                );
        }
    }

    public async loadProject(projectId: string): Promise<MirasProject> {
        logger.info('Loading project', { projectId });

        try {
            // Si el proyecto ya está cargado, lo devolvemos
            const existingProject = this.projects.get(projectId);
            if (existingProject) {
                logger.info('Project already loaded', { projectId });
                return existingProject;
            }

            const project = await this.createProject(projectId);
            this.projects.set(projectId, project);
            
            this.sseService.broadcast(SSEEventType.PROJECT_LOADED, {
                timestamp: Date.now(),
                entityId: projectId,
                state: project.getState()
            });
            
            logger.info('Project loaded successfully', {
                projectId,
                projectName: project.getState().name
            });

            return project;
        } catch (error) {
            logger.error('Failed to load project', {
                projectId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error instanceof ProjectError ? error :
                new ProjectError(
                    'Failed to load project',
                    projectId,
                    'loadProject',
                    { originalError: error instanceof Error ? error.message : 'Unknown error' }
                );
        }
    }

    public getProject(projectId: string): MirasProject | undefined {
        const project = this.projects.get(projectId);
        if (!project) {
            logger.debug('Project not found in memory', { projectId });
        }
        return project;
    }

    public async unloadProject(projectId: string): Promise<void> {
        logger.info('Unloading project', { projectId });

        try {
            const project = this.projects.get(projectId);
            if (!project) {
                logger.warn('Project not found for unloading', { projectId });
                return;
            }

            // Detener todos los graphs activos
            const graphs = await this.graphService.findByEventId(projectId);
            for (const graph of graphs) {
                try {
                    await project.stopGraph(graph.id);
                } catch (error) {
                    logger.warn('Error stopping graph during unload', {
                        projectId,
                        graphId: graph.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            await project.unload();
            this.projects.delete(projectId);
            
            this.sseService.broadcast(SSEEventType.PROJECT_UNLOADED, {
                timestamp: Date.now(),
                entityId: projectId
            });
            
            logger.info('Project unloaded successfully', { projectId });
        } catch (error) {
            logger.error('Failed to unload project', {
                projectId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new ProjectError(
                'Failed to unload project',
                projectId,
                'unloadProject',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    public async unloadAllProjects(): Promise<void> {
        logger.info('Unloading all projects');

        const errors: Error[] = [];
        for (const [projectId, project] of this.projects) {
            try {
                // Detener todos los graphs activos
                const graphs = await this.graphService.findByEventId(projectId);
                for (const graph of graphs) {
                    try {
                        await project.stopGraph(graph.id);
                    } catch (error) {
                        logger.warn('Error stopping graph during unload', {
                            projectId,
                            graphId: graph.id,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }

                await project.unload();
                this.projects.delete(projectId);
                
                this.sseService.broadcast(SSEEventType.PROJECT_UNLOADED, {
                    timestamp: Date.now(),
                    entityId: projectId
                });
                
                logger.info('Project unloaded successfully', { projectId });
            } catch (error) {
                logger.error('Failed to unload project', {
                    projectId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                errors.push(error instanceof Error ? error : new Error('Unknown error'));
            }
        }

        if (errors.length > 0) {
            throw new ProjectError(
                'Failed to unload some projects',
                'multiple',
                'unloadAllProjects',
                { errors: errors.map(e => e.message) }
            );
        }
    }
}