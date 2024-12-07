import { NextRequest, NextResponse } from 'next/server';
import { CasparCGServerService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';
import logger from '@/lib/logger/winston-logger';

const serverService = CasparCGServerService.getInstance();
const sseService = SSEService.getInstance();

export async function GET() {
    try {
        const servers = await serverService.findAll();
        return NextResponse.json({
            success: true,
            servers: servers
        });
    } catch (error) {
        logger.error('Failed to get CasparCG servers', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to get CasparCG servers', servers: [] },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        
        if (data.action === 'connect') {
            const server = await serverService.connect(data.id);
            if (!server) {
                throw new Error(`Server ${data.id} not found`);
            }
            
            sseService.broadcast(SSEEventType.SERVER_CONNECTED, {
                timestamp: Date.now(),
                entityId: server.config.id,
                entity: {
                    id: server.config.id,
                    name: server.config.name,
                    host: server.config.host,
                    port: server.config.port,
                    status: server.getStatus()
                }
            });
            
            logger.info('Connected to CasparCG server', { serverId: data.id });
            return NextResponse.json({ success: true });
        }
        
        if (data.action === 'disconnect') {
            const server = await serverService.disconnect(data.id);
            if (!server) {
                throw new Error(`Server ${data.id} not found`);
            }
            
            sseService.broadcast(SSEEventType.SERVER_DISCONNECTED, {
                timestamp: Date.now(),
                entityId: server.config.id,
                entity: {
                    id: server.config.id,
                    name: server.config.name,
                    host: server.config.host,
                    port: server.config.port,
                    status: server.getStatus()
                }
            });
            
            logger.info('Disconnected from CasparCG server', { serverId: data.id });
            return NextResponse.json({ success: true });
        }
        
        // Create new server
        const server = await serverService.create(data);

        sseService.broadcast(SSEEventType.SERVER_CREATED, {
            timestamp: Date.now(),
            entityId: server.config.id,
            entity: {
                id: server.config.id,
                name: server.config.name,
                host: server.config.host,
                port: server.config.port,
                status: server.getStatus()
            }
        });

        logger.info('CasparCG server created successfully', { serverId: server.config.id });
        return NextResponse.json({
            success: true,
            server: {
                id: server.config.id,
                name: server.config.name,
                host: server.config.host,
                port: server.config.port,
                status: server.getStatus()
            }
        }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create CasparCG server', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json(
            { success: false, error: 'Failed to create CasparCG server' },
            { status: 500 }
        );
    }
}
