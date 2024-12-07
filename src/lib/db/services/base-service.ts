import { DatabaseService } from '../database-service';
import { BaseEntity } from '../types';
import { Statement } from 'better-sqlite3';
import { DatabaseError } from '@/lib/errors/database-error';
import logger from '@/lib/logger/winston-logger';

export abstract class BaseService<T extends BaseEntity> {
    protected db: DatabaseService;
    protected tableName: string;

    constructor(tableName: string) {
        this.db = DatabaseService.getInstance();
        this.tableName = tableName;
    }

    protected abstract mapToEntity(row: any): T;

    async findById(id: string): Promise<T | null> {
        try {
            const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
            const row = stmt.get(id);
            return row ? this.mapToEntity(row) : null;
        } catch (error) {
            logger.error('Database findById error', {
                error,
                table: this.tableName,
                id
            });
            throw new DatabaseError(
                'Error finding record by ID',
                'findById',
                this.tableName,
                { id }
            );
        }
    }

    async findAll(): Promise<T[]> {
        try {
            const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`);
            const rows = stmt.all();
            return rows.map(row => this.mapToEntity(row));
        } catch (error) {
            logger.error('Database findAll error', {
                error,
                table: this.tableName
            });
            throw new DatabaseError(
                'Error finding all records',
                'findAll',
                this.tableName
            );
        }
    }

    async create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
        try {
            const id = crypto.randomUUID();
            const columns = Object.keys(entity);
            const values = Object.values(entity);
            
            const sql = `
                INSERT INTO ${this.tableName} (id, ${columns.join(', ')})
                VALUES (?, ${columns.map(() => '?').join(', ')})
                RETURNING *
            `;
            
            const stmt = this.db.prepare(sql);
            const result = stmt.get(id, ...values);
            
            if (!result) {
                throw new DatabaseError(
                    'Failed to create record: No result returned',
                    'create',
                    this.tableName,
                    { entity }
                );
            }
            
            logger.info('Record created successfully', {
                table: this.tableName,
                id,
                operation: 'create'
            });
            
            return this.mapToEntity(result);
        } catch (error) {
            logger.error('Failed to create record', {
                error,
                table: this.tableName,
                entity
            });
            throw new DatabaseError(
                'Failed to create record',
                'create',
                this.tableName,
                { entity }
            );
        }
    }

    async update(id: string, entity: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T | null> {
        try {
            const updates = Object.entries(entity)
                .map(([key]) => `${key} = ?`)
                .join(', ');
            
            const sql = `
                UPDATE ${this.tableName}
                SET ${updates}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...Object.values(entity), id);
            
            if (result.changes === 0) {
                logger.warn('No records updated', {
                    table: this.tableName,
                    id,
                    operation: 'update'
                });
                return null;
            }
            
            logger.info('Record updated successfully', {
                table: this.tableName,
                id,
                operation: 'update'
            });
            
            return this.findById(id);
        } catch (error) {
            logger.error('Failed to update record', {
                error,
                table: this.tableName,
                id,
                entity
            });
            throw new DatabaseError(
                'Failed to update record',
                'update',
                this.tableName,
                { id, entity }
            );
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
            const result = stmt.run(id);
            
            if (result.changes === 0) {
                logger.warn('No records deleted', {
                    table: this.tableName,
                    id,
                    operation: 'delete'
                });
            } else {
                logger.info('Record deleted successfully', {
                    table: this.tableName,
                    id,
                    operation: 'delete'
                });
            }
            
            return result.changes > 0;
        } catch (error) {
            logger.error('Failed to delete record', {
                error,
                table: this.tableName,
                id
            });
            throw new DatabaseError(
                'Failed to delete record',
                'delete',
                this.tableName,
                { id }
            );
        }
    }

    protected prepareStatement(sql: string): Statement {
        return this.db.prepare(sql);
    }
}
