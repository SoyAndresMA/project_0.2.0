import { BaseService } from './base-service';
import { CasparGraph } from '../types';
import logger from '@/lib/logger/winston-logger';
import { DatabaseError } from '@/lib/errors/database-error';

export class CasparGraphService extends BaseService<CasparGraph> {
    private static instance: CasparGraphService;

    private constructor() {
        super('caspar_graph');
    }

    public static getInstance(): CasparGraphService {
        if (!CasparGraphService.instance) {
            CasparGraphService.instance = new CasparGraphService();
        }
        return CasparGraphService.instance;
    }

    protected mapToEntity(row: any): CasparGraph {
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
            delay: row.delay,
            duration: row.duration,
            keyvalue: row.keyvalue,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async findByEventId(eventId: string): Promise<CasparGraph[]> {
        try {
            const stmt = this.prepareStatement(
                'SELECT * FROM caspar_graph WHERE event_id = ? ORDER BY position_row, position_column'
            );
            const rows = stmt.all(eventId);
            
            logger.debug('Found graphs for event', {
                eventId,
                count: rows.length
            });
            
            return rows.map(row => this.mapToEntity(row));
        } catch (error) {
            logger.error('Error finding graphs by event', {
                error,
                eventId
            });
            throw new DatabaseError(
                'Failed to find graphs by event',
                'findByEventId',
                'caspar_graph',
                { eventId }
            );
        }
    }

    async findByServerId(serverId: string): Promise<CasparGraph[]> {
        try {
            const stmt = this.prepareStatement(
                'SELECT * FROM caspar_graph WHERE casparcg_server_id = ?'
            );
            const rows = stmt.all(serverId);
            
            logger.debug('Found graphs for server', {
                serverId,
                count: rows.length
            });
            
            return rows.map(row => this.mapToEntity(row));
        } catch (error) {
            logger.error('Error finding graphs by server', {
                error,
                serverId
            });
            throw new DatabaseError(
                'Failed to find graphs by server',
                'findByServerId',
                'caspar_graph',
                { serverId }
            );
        }
    }

    async updatePosition(
        graphId: string,
        position: { row: number; column: number }
    ): Promise<CasparGraph | null> {
        try {
            logger.info('Updating graph position', {
                graphId,
                position
            });
            
            return this.update(graphId, {
                position_row: position.row,
                position_column: position.column
            });
        } catch (error) {
            logger.error('Error updating graph position', {
                error,
                graphId,
                position
            });
            throw new DatabaseError(
                'Failed to update graph position',
                'updatePosition',
                'caspar_graph',
                { graphId, position }
            );
        }
    }

    async findByUnionId(unionId: string): Promise<CasparGraph | null> {
        try {
            const stmt = this.prepareStatement(
                'SELECT * FROM caspar_graph WHERE item_union_id = ?'
            );
            const row = stmt.get(unionId);
            
            if (row) {
                logger.debug('Found graph by union ID', { unionId });
            } else {
                logger.debug('No graph found for union ID', { unionId });
            }
            
            return row ? this.mapToEntity(row) : null;
        } catch (error) {
            logger.error('Error finding graph by union', {
                error,
                unionId
            });
            throw new DatabaseError(
                'Failed to find graph by union',
                'findByUnionId',
                'caspar_graph',
                { unionId }
            );
        }
    }

    async updateKeyValue(graphId: string, keyvalue: string): Promise<CasparGraph | null> {
        try {
            logger.info('Updating graph keyvalue', {
                graphId,
                keyvalue
            });
            
            return this.update(graphId, { keyvalue });
        } catch (error) {
            logger.error('Error updating graph keyvalue', {
                error,
                graphId
            });
            throw new DatabaseError(
                'Failed to update graph keyvalue',
                'updateKeyValue',
                'caspar_graph',
                { graphId }
            );
        }
    }
}