import { BaseService } from './base-service';
import { Event, EventUnion } from '../types';

export class EventService extends BaseService<Event> {
    private static instance: EventService;

    private constructor() {
        super('events');
    }

    public static getInstance(): EventService {
        if (!EventService.instance) {
            EventService.instance = new EventService();
        }
        return EventService.instance;
    }

    protected mapToEntity(row: any): Event {
        const event: Event = {
            id: row.id,
            project_id: row.project_id,
            event_union_id: row.event_union_id,
            name: row.name,
            description: row.description,
            event_order: row.event_order,
            created_at: row.created_at,
            updated_at: row.updated_at
        };

        if (row.event_union_id) {
            event.event_union = {
                id: row.eu_id,
                name: row.eu_name,
                description: row.eu_description,
                type: row.eu_type,
                icon: row.eu_icon,
                created_at: row.eu_created_at,
                updated_at: row.eu_updated_at
            };
        }

        return event;
    }

    async findByProjectId(projectId: string): Promise<Event[]> {
        const stmt = this.prepareStatement(`
            SELECT 
                e.*,
                eu.id as eu_id,
                eu.name as eu_name,
                eu.description as eu_description,
                eu.type as eu_type,
                eu.icon as eu_icon,
                eu.created_at as eu_created_at,
                eu.updated_at as eu_updated_at
            FROM events e
            LEFT JOIN event_unions eu ON e.event_union_id = eu.id
            WHERE e.project_id = ?
            ORDER BY e.event_order
        `);
        const rows = stmt.all(projectId);
        return rows.map(row => this.mapToEntity(row));
    }

    async findById(id: string): Promise<Event | null> {
        const stmt = this.prepareStatement(`
            SELECT 
                e.*,
                eu.id as eu_id,
                eu.name as eu_name,
                eu.description as eu_description,
                eu.type as eu_type,
                eu.icon as eu_icon,
                eu.created_at as eu_created_at,
                eu.updated_at as eu_updated_at
            FROM events e
            LEFT JOIN event_unions eu ON e.event_union_id = eu.id
            WHERE e.id = ?
        `);
        const row = stmt.get(id);
        return row ? this.mapToEntity(row) : null;
    }

    async updateOrder(eventId: string, newOrder: number): Promise<Event | null> {
        return this.update(eventId, { event_order: newOrder });
    }

    async findByUnionId(unionId: string): Promise<Event | null> {
        const stmt = this.prepareStatement(`
            SELECT 
                e.*,
                eu.id as eu_id,
                eu.name as eu_name,
                eu.description as eu_description,
                eu.type as eu_type,
                eu.icon as eu_icon,
                eu.created_at as eu_created_at,
                eu.updated_at as eu_updated_at
            FROM events e
            LEFT JOIN event_unions eu ON e.event_union_id = eu.id
            WHERE e.event_union_id = ?
        `);
        const row = stmt.get(unionId);
        return row ? this.mapToEntity(row) : null;
    }
}
