// Tipos base para todas las tablas
export interface BaseEntity {
    id: string;
    created_at?: string;
    updated_at?: string;
}

// Tipos para cada tabla
export interface Project extends BaseEntity {
    name: string;
    description?: string;
}

export interface TypeItemUnion extends BaseEntity {
    name: string;
    description?: string;
    compatible_items?: string;
    icon?: string;
}

export interface TypeItem extends BaseEntity {
    name: string;
    description?: string;
    color_enabled?: string;
    color_disabled?: string;
    item_type: string;
}

export interface EventUnion extends BaseEntity {
    name: string;
    description?: string;
    type: string;
    icon?: string;
}

export interface Event extends BaseEntity {
    project_id: string;
    event_union_id: string;
    name: string;
    description?: string;
    event_order: number;
}

export interface CasparCGServer extends BaseEntity {
    name: string;
    host: string;
    port: number;
    enabled: number;
    description?: string;
    version?: string;
    media_library?: string;
    command_timeout?: number;
}

export interface ItemUnion extends BaseEntity {
    type_item_union_id: string;
    delay?: number;
}

export interface CasparClip extends BaseEntity {
    event_id: string;
    type_item_id: string;
    casparcg_server_id?: string;
    item_union_id: string;
    name: string;
    description?: string;
    position_row: number;
    position_column: number;
    label?: string;
    channel?: number;
    layer?: number;
    loop?: number;
    delay?: number;
    transition_type?: string;
    transition_duration?: number;
}

export interface CasparGraph extends BaseEntity {
    event_id: string;
    type_item_id: string;
    casparcg_server_id?: string;
    item_union_id: string;
    name: string;
    description?: string;
    position_row: number;
    position_column: number;
    label?: string;
    channel?: number;
    layer?: number;
    delay?: number;
    duration?: number;
    keyvalue?: string;
}
