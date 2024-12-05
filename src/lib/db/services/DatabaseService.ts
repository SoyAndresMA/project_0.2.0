import Database from 'better-sqlite3';
import { DATABASE_SCHEMA } from '../schema';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: Database.Database;
    private initialized: boolean = false;

    private constructor() {
        this.db = new Database('data/miras.sqlite');
        this.db.pragma('journal_mode = WAL');
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
            // Ejecutar el schema
            const statements = DATABASE_SCHEMA.split(';').filter(stmt => stmt.trim());
            this.db.transaction(() => {
                statements.forEach(statement => {
                    if (statement.trim()) {
                        this.db.prepare(statement).run();
                    }
                });
            })();

            this.initialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    public getDatabase(): Database.Database {
        if (!this.initialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    public prepare(sql: string): Database.Statement {
        return this.db.prepare(sql);
    }

    public transaction<T>(fn: () => T): () => T {
        return this.db.transaction(fn);
    }

    public close(): void {
        if (this.db) {
            this.db.close();
        }
    }
}
