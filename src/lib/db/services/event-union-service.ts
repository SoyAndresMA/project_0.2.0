import { BaseService } from './base-service';
import { EventUnion } from '../types';

export class EventUnionService extends BaseService<EventUnion> {
    private static instance: EventUnionService;

    private constructor() {
        super('event_unions');
    }

    public static getInstance(): EventUnionService {
        if (!EventUnionService.instance) {
            EventUnionService.instance = new EventUnionService();
        }
        return EventUnionService.instance;
    }

    protected mapToEntity(row: any): EventUnion {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            type: row.type,
            icon: row.icon,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async findByType(type: string): Promise<EventUnion[]> {
        const stmt = this.prepareStatement('SELECT * FROM event_unions WHERE type = ?');
        const rows = stmt.all(type);
        return rows.map(row => this.mapToEntity(row));
    }
}
