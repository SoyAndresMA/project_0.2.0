import Database from 'better-sqlite3';
import path from 'path';
import { DatabaseError } from '@/lib/errors/database-error';
import logger from '@/lib/logger/winston-logger';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: Database.Database;
    private initialized: boolean = false;

    private constructor() {
        try {
            this.db = new Database('data/miras.sqlite');
            this.db.pragma('journal_mode = WAL');
            logger.info('Database connection initialized');
        } catch (error) {
            logger.error('Failed to initialize database connection', { error });
            throw new DatabaseError(
                'Failed to initialize database connection',
                'initialize',
                undefined,
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            logger.info('Starting database initialization');
            // Ejecutar el schema
            const statements = DATABASE_SCHEMA.split(';').filter(stmt => stmt.trim());
            this.db.transaction(() => {
                statements.forEach(stmt => this.db.prepare(stmt).run());
            })();

            this.initialized = true;
            logger.info('Database initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize database', { error });
            throw new DatabaseError(
                'Failed to initialize database',
                'initialize',
                undefined,
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    public getDatabase(): Database.Database {
        if (!this.initialized) {
            const error = 'Database not initialized. Call initialize() first.';
            logger.error(error);
            throw new DatabaseError(error, 'getDatabase');
        }
        return this.db;
    }

    public prepare(sql: string): Database.Statement {
        try {
            return this.db.prepare(sql);
        } catch (error) {
            logger.error('Failed to prepare SQL statement', { 
                error,
                sql 
            });
            throw new DatabaseError(
                'Failed to prepare SQL statement',
                'prepare',
                undefined,
                { sql, error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    public transaction<T>(fn: () => T): T {
        return this.db.transaction(fn)();
    }

    public close(): void {
        if (this.db) {
            try {
                this.db.close();
                logger.info('Database connection closed');
            } catch (error) {
                logger.error('Error closing database connection', { error });
                throw new DatabaseError(
                    'Failed to close database connection',
                    'close',
                    undefined,
                    { error: error instanceof Error ? error.message : 'Unknown error' }
                );
            }
        }
    }
}