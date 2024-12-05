import { BaseService } from './base-service';
import { TypeItem } from '../types';

export class TypeItemService extends BaseService<TypeItem> {
    private static instance: TypeItemService;

    private constructor() {
        super('type_item');
    }

    public static getInstance(): TypeItemService {
        if (!TypeItemService.instance) {
            TypeItemService.instance = new TypeItemService();
        }
        return TypeItemService.instance;
    }

    protected mapToEntity(row: any): TypeItem {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            color_enabled: row.color_enabled,
            color_disabled: row.color_disabled,
            item_type: row.item_type,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async findByItemType(itemType: string): Promise<TypeItem[]> {
        const stmt = this.prepareStatement('SELECT * FROM type_item WHERE item_type = ?');
        const rows = stmt.all(itemType);
        return rows.map(row => this.mapToEntity(row));
    }
}
