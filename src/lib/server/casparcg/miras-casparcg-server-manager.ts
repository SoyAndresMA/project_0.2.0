import { CasparCGServerService } from '@/lib/db/services/casparcg-server-service';
import { MirasCasparCGServer } from './miras-casparcg-server';
import { EventEmitter } from 'events';
import { MirasServerState } from '../types/server-status';
import { MirasCasparCGClipState } from './types';

export class MirasCasparCGServerManager {
    private static instance: MirasCasparCGServerManager;
    private servers: Map<string, MirasCasparCGServer> = new Map();
    private events: EventEmitter = new EventEmitter();
    private casparCGServerService: CasparCGServerService;
    private isInitialized: boolean = false;
    private initPromise: Promise<void> | null = null;

    private constructor() {
        this.casparCGServerService = CasparCGServerService.getInstance();
    }

    public static getInstance(): MirasCasparCGServerManager {
        if (!MirasCasparCGServerManager.instance) {
            MirasCasparCGServerManager.instance = new MirasCasparCGServerManager();
        }
        return MirasCasparCGServerManager.instance;
    }

    public async initialize(): Promise<void> {
        // Si ya hay una inicialización en progreso, retornamos esa promesa
        if (this.initPromise) {
            return this.initPromise;
        }

        // Si ya estamos inicializados, retornamos inmediatamente
        if (this.isInitialized) {
            return Promise.resolve();
        }

        try {
            console.log('[MirasCasparCGServerManager] Starting initialization...');
            this.initPromise = this.initializeServers();
            await this.initPromise;
            this.isInitialized = true;
            console.log('[MirasCasparCGServerManager] Initialization complete');
        } catch (error) {
            console.error('[MirasCasparCGServerManager] Initialization failed:', error);
            throw error;
        } finally {
            this.initPromise = null;
        }
    }

    private async initializeServers(): Promise<void> {
        console.log('[MirasCasparCGServerManager] Initializing servers...');
        
        // Limpiar servidores existentes
        for (const server of this.servers.values()) {
            await server.disconnect();
        }
        this.servers.clear();

        try {
            // Cargar servidores habilitados de la BD
            const enabledServers = await this.casparCGServerService.findEnabled();
            console.log(`[MirasCasparCGServerManager] Found ${enabledServers.length} enabled servers`);
            
            // Crear instancias de MirasCasparCGServer
            for (const serverConfig of enabledServers) {
                console.log(`[MirasCasparCGServerManager] Creating server instance for: ${serverConfig.name}`);
                const server = new MirasCasparCGServer(serverConfig);
                
                // Suscribirse a eventos del servidor
                server.onStateChange((state) => {
                    console.log(`[MirasCasparCGServerManager] Server ${serverConfig.id} state changed:`, state);
                    this.events.emit('serverStateChanged', state);
                });

                server.onClipStateChange((state) => {
                    console.log(`[MirasCasparCGServerManager] Server ${serverConfig.id} clip state changed:`, state);
                    this.events.emit('clipStateChanged', {
                        serverId: serverConfig.id,
                        ...state
                    });
                });

                server.onLog((log) => {
                    console.log(`[MirasCasparCGServerManager] Server ${serverConfig.id} log:`, log);
                    this.events.emit('serverLog', {
                        serverId: serverConfig.id,
                        timestamp: new Date(),
                        ...log
                    });
                });

                this.servers.set(serverConfig.id, server);
            }

            console.log('[MirasCasparCGServerManager] Server instances created successfully');
        } catch (error) {
            console.error('[MirasCasparCGServerManager] Error initializing servers:', error);
            throw error;
        }
    }

    public getServer(id: string): MirasCasparCGServer | undefined {
        if (!this.isInitialized) {
            console.warn('[MirasCasparCGServerManager] Attempting to get server before initialization');
        }
        return this.servers.get(id);
    }

    public getAllServers(): MirasCasparCGServer[] {
        return Array.from(this.servers.values());
    }

    public async connectServer(id: string): Promise<void> {
        const server = this.getServer(id);
        if (!server) {
            throw new Error(`Server ${id} not found`);
        }

        try {
            console.log(`[MirasCasparCGServerManager] Connecting server ${id}...`);
            await server.connect();
            console.log(`[MirasCasparCGServerManager] Server ${id} connected successfully`);
        } catch (error) {
            console.error(`[MirasCasparCGServerManager] Failed to connect server ${id}:`, error);
            throw error;
        }
    }

    public async disconnectServer(id: string): Promise<void> {
        const server = this.getServer(id);
        if (!server) {
            throw new Error(`Server ${id} not found`);
        }

        try {
            console.log(`[MirasCasparCGServerManager] Disconnecting server ${id}...`);
            await server.disconnect();
            console.log(`[MirasCasparCGServerManager] Server ${id} disconnected successfully`);
        } catch (error) {
            console.error(`[MirasCasparCGServerManager] Failed to disconnect server ${id}:`, error);
            throw error;
        }
    }

    // Eventos
    public onServerStateChange(callback: (state: MirasServerState) => void): void {
        this.events.on('serverStateChanged', callback);
    }

    public onClipStateChange(
        callback: (state: MirasCasparCGClipState & { serverId: string }) => void
    ): void {
        this.events.on('clipStateChanged', callback);
    }

    public onServerLog(callback: (log: any & { serverId: string, timestamp: Date }) => void): void {
        this.events.on('serverLog', callback);
    }
}
