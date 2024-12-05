import { MirasProjectState, MirasProjectEvent, MirasProjectItem, MirasClipPlaybackState } from './types';
import { MirasEvent, MirasEventUnion, MirasCasparClip, MirasItemUnion } from '@/lib/db/types';
import { EventService, EventUnionService, CasparClipService, CasparGraphService, ItemUnionService, TypeItemUnionService, TypeItemService } from '@/lib/db/services';
import { SSEService } from '@/lib/sse/sse-service';
import { SSEEventType } from '@/lib/sse/events';

export class MirasProject {
    private state: MirasProjectState;
    private eventService: EventService;
    private eventUnionService: EventUnionService;
    private casparClipService: CasparClipService;
    private casparGraphService: CasparGraphService;
    private itemUnionService: ItemUnionService;
    private typeItemUnionService: TypeItemUnionService;
    private typeItemService: TypeItemService;
    private sseService: SSEService;

    constructor(
        id: string,
        name: string,
        description: string
    ) {
        this.state = {
            id,
            name,
            description,
            events: {}
        };

        // Inicializar servicios
        this.eventService = EventService.getInstance();
        this.eventUnionService = EventUnionService.getInstance();
        this.casparClipService = CasparClipService.getInstance();
        this.casparGraphService = CasparGraphService.getInstance();
        this.itemUnionService = ItemUnionService.getInstance();
        this.typeItemUnionService = TypeItemUnionService.getInstance();
        this.typeItemService = TypeItemService.getInstance();
        this.sseService = SSEService.getInstance();
    }

    // Obtener el estado completo del proyecto
    public getState(): MirasProjectState {
        return { ...this.state };
    }

    // Cargar todos los datos del proyecto desde la base de datos
    public async load(): Promise<void> {
        try {
            console.log(`[MirasProject] Loading project ${this.state.id}`);
            
            // 1. Cargar eventos
            const events = await this.eventService.findByProjectId(this.state.id);
            console.log(`[MirasProject] Loaded ${events.length} events for project ${this.state.id}`);
            
            // 2. Para cada evento, cargar su union y clips
            for (const event of events) {
                console.log(`[MirasProject] Processing event: ${event.name} (${event.id})`);
                
                const eventUnion = await this.eventUnionService.findById(event.event_union_id);
                if (!eventUnion) {
                    console.log(`[MirasProject] ⚠️ No eventUnion found for event ${event.id}`);
                    continue;
                }

                // Obtener clips y gráficos del evento y organizarlos por filas
                const clips = await this.casparClipService.findByEventId(event.id);
                const graphs = await this.casparGraphService.findByEventId(event.id);
                console.log(`[MirasProject] Found ${clips.length} clips and ${graphs.length} graphs for event ${event.name}`);
                
                const rows: { [key: number]: { items: { [key: string]: MirasProjectItem } } } = {};

                // Organizar clips por filas
                for (const clip of clips) {
                    const itemUnion = await this.itemUnionService.findById(clip.item_union_id);
                    if (!itemUnion) {
                        console.log(`[MirasProject] ⚠️ No itemUnion found for clip ${clip.id}`);
                        continue;
                    }

                    const typeItemUnion = await this.typeItemUnionService.findById(itemUnion.type_item_union_id);
                    if (!typeItemUnion) {
                        console.log(`[MirasProject] ⚠️ No typeItemUnion found for itemUnion ${itemUnion.id}`);
                        continue;
                    }

                    const typeItem = await this.typeItemService.findById(clip.type_item_id);
                    if (!typeItem) {
                        console.log(`[MirasProject] ⚠️ No typeItem found for clip ${clip.id}`);
                        continue;
                    }

                    const row = clip.position_row;
                    if (!rows[row]) {
                        rows[row] = { items: {} };
                    }

                    rows[row].items[clip.id] = {
                        data: clip,
                        itemUnion: itemUnion,
                        typeItemUnion: typeItemUnion,
                        typeItem: typeItem,
                        playbackState: undefined
                    };
                }

                // Organizar gráficos por filas
                for (const graph of graphs) {
                    const itemUnion = await this.itemUnionService.findById(graph.item_union_id);
                    if (!itemUnion) {
                        console.log(`[MirasProject] ⚠️ No itemUnion found for graph ${graph.id}`);
                        continue;
                    }

                    const typeItemUnion = await this.typeItemUnionService.findById(itemUnion.type_item_union_id);
                    if (!typeItemUnion) {
                        console.log(`[MirasProject] ⚠️ No typeItemUnion found for itemUnion ${itemUnion.id}`);
                        continue;
                    }

                    const typeItem = await this.typeItemService.findById(graph.type_item_id);
                    if (!typeItem) {
                        console.log(`[MirasProject] ⚠️ No typeItem found for graph ${graph.id}`);
                        continue;
                    }

                    const row = graph.position_row;
                    if (!rows[row]) {
                        rows[row] = { items: {} };
                    }

                    rows[row].items[graph.id] = {
                        data: graph,
                        itemUnion: itemUnion,
                        typeItemUnion: typeItemUnion,
                        typeItem: typeItem,
                        playbackState: undefined
                    };
                }

                // Añadir evento al estado
                this.state.events[event.id] = {
                    data: event,
                    eventUnion: eventUnion,
                    rows: rows
                };
                
                console.log(`[MirasProject] Added event ${event.name} with ${Object.keys(rows).length} rows`);
            }

            // Notificar que el proyecto se ha cargado
            this.sseService.broadcast(SSEEventType.PROJECT_LOADED, {
                timestamp: Date.now(),
                projectId: this.state.id,
                state: this.getState()
            });

        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        }
    }

    private notifyStateChange(): void {
        this.sseService.broadcast(SSEEventType.PROJECT_STATE_CHANGED, {
            timestamp: Date.now(),
            projectId: this.state.id,
            state: this.getState()
        });
    }

    // Método para limpiar recursos al descargar el proyecto
    public async unload(): Promise<void> {
        // Limpiar el estado
        this.state.events = {};
        
        // Notificar que el proyecto se está descargando
        this.sseService.broadcast(SSEEventType.PROJECT_UNLOADED, {
            timestamp: Date.now(),
            projectId: this.state.id,
        });
    }

    // Obtener un evento específico
    public getEvent(eventId: string): MirasProjectEvent | undefined {
        return this.state.events[eventId];
    }

    // Obtener un item específico
    public getItem(eventId: string, rowIndex: number, itemId: string): MirasProjectItem | undefined {
        return this.state.events[eventId]?.rows[rowIndex]?.items[itemId];
    }

    // Actualizar el estado de reproducción de un clip
    public updateClipPlaybackState(clipId: string, playbackState: MirasClipPlaybackState): void {
        // Buscar el clip en todos los eventos
        for (const event of Object.values(this.state.events)) {
            // Buscar en todas las filas del evento
            for (const row of Object.values(event.rows)) {
                // Buscar en todos los items de la fila
                for (const item of Object.values(row.items)) {
                    if (item.data.id === clipId) {
                        item.playbackState = playbackState;
                        this.notifyStateChange();
                        return;
                    }
                }
            }
        }
    }

    // Obtener el estado de reproducción de un clip
    public getClipPlaybackState(clipId: string): MirasClipPlaybackState | undefined {
        // Buscar el clip en todos los eventos
        for (const event of Object.values(this.state.events)) {
            // Buscar en todas las filas del evento
            for (const row of Object.values(event.rows)) {
                // Buscar en todos los items de la fila
                for (const item of Object.values(row.items)) {
                    if (item.data.id === clipId) {
                        return item.playbackState;
                    }
                }
            }
        }
        return undefined;
    }

    // Obtener un clip por su ID
    public getClip(clipId: string): MirasProjectItem | undefined {
        // Buscar el clip en todos los eventos
        for (const event of Object.values(this.state.events)) {
            // Buscar en todas las filas del evento
            for (const row of Object.values(event.rows)) {
                // Buscar en todos los items de la fila
                for (const item of Object.values(row.items)) {
                    if (item.data.id === clipId) {
                        return item;
                    }
                }
            }
        }
        return undefined;
    }
}
