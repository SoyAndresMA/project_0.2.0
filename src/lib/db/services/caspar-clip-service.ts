import { BaseService } from './base-service';
import { CasparClip } from '../types';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import { MirasCasparClip } from '@/lib/items/miras-casparclip';
import { ProjectService } from './project-service';
import logger from '@/lib/logger/winston-logger';

export class CasparClipService extends BaseService<CasparClip> {
    private static instance: CasparClipService;
    private sseService: SSEService;
    private projectService: ProjectService;

    private constructor() {
        super('caspar_clips');
        this.sseService = SSEService.getInstance();
        this.projectService = ProjectService.getInstance();
    }

    public static getInstance(): CasparClipService {
        if (!CasparClipService.instance) {
            CasparClipService.instance = new CasparClipService();
        }
        return CasparClipService.instance;
    }

    protected mapToEntity(row: any): CasparClip {
        return {
            id: row.id,
            event_id: row.event_id,
            type_item_id: row.type_item_id,
            casparcg_server_id: row.casparcg_server_id,
            item_union_id: row.item_union_id,
            name: row.name,
            description: row.description,
            position_row: row.position_row,
            position_column: row.position_column,
            label: row.label,
            channel: row.channel,
            layer: row.layer,
            loop: row.loop,
            delay: row.delay,
            transition_type: row.transition_type,
            transition_duration: row.transition_duration,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async findByEventId(eventId: string): Promise<CasparClip[]> {
        const stmt = this.prepareStatement(
            'SELECT * FROM caspar_clips WHERE event_id = ? ORDER BY position_row, position_column'
        );
        const rows = stmt.all(eventId);
        return rows.map(row => this.mapToEntity(row));
    }

    async findByServerId(serverId: string): Promise<CasparClip[]> {
        const stmt = this.prepareStatement('SELECT * FROM caspar_clips WHERE casparcg_server_id = ?');
        const rows = stmt.all(serverId);
        return rows.map(row => this.mapToEntity(row));
    }

    async updatePosition(
        clipId: string,
        position: { row: number; column: number }
    ): Promise<CasparClip | null> {
        return this.update(clipId, {
            position_row: position.row,
            position_column: position.column
        });
    }

    async findByUnionId(unionId: string): Promise<CasparClip | null> {
        const stmt = this.prepareStatement('SELECT * FROM caspar_clips WHERE item_union_id = ?');
        const row = stmt.get(unionId);
        return row ? this.mapToEntity(row) : null;
    }

    public async playClip(clipId: string): Promise<void> {
        logger.info('Attempting to play clip', { clipId });

        const project = this.projectService.getProject();
        if (!project) {
            const error = 'No project loaded';
            logger.error(error, { clipId });
            throw new Error(error);
        }

        const clip = project.getClip(clipId);
        if (!clip) {
            const error = `Clip ${clipId} not found in project`;
            logger.error(error, { clipId });
            throw new Error(error);
        }

        // Actualizar el estado de reproducción en el proyecto
        project.updateClipPlaybackState(clipId, 'playing');
        
        try {
            // Usar la instancia de MirasCasparClip para reproducir
            await clip.play();
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: clipId,
                itemType: 'casparclip',
                state: 'playing'
            });
        } catch (error) {
            console.error(`[CasparClipService] ❌ Error playing clip ${clipId}:`, error);
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: clipId,
                itemType: 'casparclip',
                state: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async stopClip(clipId: string): Promise<void> {
        logger.info('Attempting to stop clip', { clipId });

        const project = this.projectService.getProject();
        if (!project) {
            const error = 'No project loaded';
            logger.error(error, { clipId });
            throw new Error(error);
        }

        const clip = project.getClip(clipId);
        if (!clip) {
            const error = `Clip ${clipId} not found in project`;
            logger.error(error, { clipId });
            throw new Error(error);
        }

        // Actualizar el estado de reproducción en el proyecto
        project.updateClipPlaybackState(clipId, 'stopped');
        
        try {
            // Usar la instancia de MirasCasparClip para detener
            await clip.stop();
            
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: clipId,
                itemType: 'casparclip',
                state: 'stopped'
            });
        } catch (error) {
            console.error(`[CasparClipService] ❌ Error stopping clip ${clipId}:`, error);
            this.sseService.broadcast(SSEEventType.ITEM_STATE_CHANGED, {
                timestamp: Date.now(),
                entityId: clipId,
                itemType: 'casparclip',
                state: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}
