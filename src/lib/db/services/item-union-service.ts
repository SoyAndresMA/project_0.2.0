import { BaseService } from './base-service';
import { ItemUnion } from '../types';

export class ItemUnionService extends BaseService<ItemUnion> {
    private static instance: ItemUnionService;

    private constructor() {
        super('item_unions');
    }

    public static getInstance(): ItemUnionService {
        if (!ItemUnionService.instance) {
            ItemUnionService.instance = new ItemUnionService();
        }
        return ItemUnionService.instance;
    }

    protected mapToEntity(row: any): ItemUnion {
        return {
            id: row.id,
            type_item_union_id: row.type_item_union_id,
            delay: row.delay,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async findByTypeUnionId(typeUnionId: string): Promise<ItemUnion[]> {
        const stmt = this.prepareStatement('SELECT * FROM item_unions WHERE type_item_union_id = ?');
        const rows = stmt.all(typeUnionId);
        return rows.map(row => this.mapToEntity(row));
    }
}
