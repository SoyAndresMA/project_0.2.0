import { BaseService } from './base-service';
import { TypeItemUnion } from '../types';

export class TypeItemUnionService extends BaseService<TypeItemUnion> {
    private static instance: TypeItemUnionService;

    private constructor() {
        super('type_item_union');
    }

    public static getInstance(): TypeItemUnionService {
        if (!TypeItemUnionService.instance) {
            TypeItemUnionService.instance = new TypeItemUnionService();
        }
        return TypeItemUnionService.instance;
    }

    protected mapToEntity(row: any): TypeItemUnion {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            compatible_items: row.compatible_items,
            icon: row.icon,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async findByCompatibility(itemType: string): Promise<TypeItemUnion[]> {
        const stmt = this.prepareStatement(
            "SELECT * FROM type_item_union WHERE compatible_items = 'all' OR compatible_items LIKE ?"
        );
        const rows = stmt.all(`%${itemType}%`);
        return rows.map(row => this.mapToEntity(row));
    }
}
