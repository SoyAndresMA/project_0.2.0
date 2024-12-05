import { DatabaseService } from './services/DatabaseService';

export async function initializeDatabase() {
    try {
        const db = DatabaseService.getInstance();
        await db.initialize();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Run if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
    initializeDatabase()
        .catch(() => process.exit(1));
}
