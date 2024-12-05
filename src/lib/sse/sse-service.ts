import { SSEClient, SSEEventBase } from './types';
import { SSEEventType } from './events';
import { SSEError } from '@/lib/errors/sse-error';
import logger from '@/lib/logger/winston-logger';

export class SSEService {
    private static instance: SSEService;
    private clients: Map<string, SSEClient>;

    private constructor() {
        this.clients = new Map();
    }

    public static getInstance(): SSEService {
        if (!SSEService.instance) {
            SSEService.instance = new SSEService();
        }
        return SSEService.instance;
    }

    public addClient(client: SSEClient): void {
        logger.debug('New SSE client connected', { clientId: client.id });
        this.clients.set(client.id, client);
        this.sendToClient(client.id, SSEEventType.SYSTEM_INFO, {
            message: 'SSE connection established',
            timestamp: Date.now()
        });
    }

    public removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            logger.debug('SSE client disconnected', { clientId });
            client.writer.close().catch(console.error);
            this.clients.delete(clientId);
        }
    }

    private async sendToClient(clientId: string, type: SSEEventType, data: SSEEventBase): Promise<void> {
        const client = this.clients.get(clientId);
        if (client) {
            logger.debug('Sending SSE event to client', { 
                clientId,
                eventType: type,
                data 
            });

            try {
                const eventData = {
                    type,
                    data
                };
                const message = `data: ${JSON.stringify(eventData)}\n\n`;
                await client.writer.write(client.encoder.encode(message));
            } catch (error) {
                logger.error('Error sending SSE event to client', {
                    error,
                    clientId,
                    eventType: type
                });
                throw new SSEError(
                    'Failed to send event to client',
                    clientId,
                    type,
                    { error: error instanceof Error ? error.message : 'Unknown error' }
                );
                this.removeClient(clientId);
            }
        }
    }

    public broadcast(type: SSEEventType, data: SSEEventBase): void {
        const event = {
            ...data,
            timestamp: data.timestamp || Date.now()
        };

        logger.debug('Broadcasting SSE event', { 
            eventType: type,
            clientCount: this.clients.size,
            data: event 
        });
        
        for (const clientId of this.clients.keys()) {
            this.sendToClient(clientId, type, event);
        }
    }

    public getConnectedClients(): number {
        return this.clients.size;
    }
}