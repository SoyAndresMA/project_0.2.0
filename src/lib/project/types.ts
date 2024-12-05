import { MirasEvent, MirasEventUnion, MirasCasparClip, MirasItemUnion, TypeItemUnion, TypeItem } from '@/lib/db/types';

// Estado de reproducción de un clip
export interface MirasClipPlaybackState {
    playing: boolean;
    paused: boolean;
    position?: number;
    length?: number;
    error?: string;
}

// Representa un item (CasparClip, etc) con su union
export interface MirasProjectItem {
    data: MirasCasparClip;  // En el futuro podría ser un tipo unión con otros tipos de items
    itemUnion: MirasItemUnion;
    typeItemUnion: TypeItemUnion;
    typeItem: TypeItem;  // Añadimos TypeItem que contiene los colores
    playbackState?: MirasClipPlaybackState;  // Estado de reproducción para clips
}

// Representa una fila de items en un evento
export interface MirasProjectRow {
    items: { [itemId: string]: MirasProjectItem };
}

// Representa un evento completo con su union y filas
export interface MirasProjectEvent {
    data: MirasEvent;
    eventUnion: MirasEventUnion;
    rows: { [rowIndex: number]: MirasProjectRow };
}

// Representa el estado completo de un proyecto en memoria
export interface MirasProjectState {
    id: string;
    name: string;
    description: string;
    events: { [eventId: string]: MirasProjectEvent };
}
