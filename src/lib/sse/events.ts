export enum SSEEventType {
    // Eventos de Proyecto
    PROJECT_CREATED = 'project_created',
    PROJECT_UPDATED = 'project_updated',
    PROJECT_DELETED = 'project_deleted',
    PROJECT_LOADED = 'project_loaded',
    PROJECT_UNLOADED = 'project_unloaded',
    PROJECT_STATE_CHANGED = 'project_state_changed',

    // Eventos de Items
    ITEM_CREATED = 'item_created',
    ITEM_UPDATED = 'item_updated',
    ITEM_DELETED = 'item_deleted',
    ITEM_STATE_CHANGED = 'item_state_changed',
    ITEM_POSITION_CHANGED = 'item_position_changed',
    ITEM_DATA_UPDATED = 'item_data_updated',

    // Eventos de Clips CasparCG
    CLIP_PLAYED = 'clip_played',
    CLIP_STOPPED = 'clip_stopped',
    CLIP_ERROR = 'clip_error',

    // Eventos de Gráficos CasparCG
    CASPAR_GRAPH_CREATED = 'caspar_graph_created',
    CASPAR_GRAPH_UPDATED = 'caspar_graph_updated',
    CASPAR_GRAPH_DELETED = 'caspar_graph_deleted',
    CASPAR_GRAPH_PLAYED = 'caspar_graph_played',
    CASPAR_GRAPH_STOPPED = 'caspar_graph_stopped',

    // Eventos de Servidor CasparCG
    SERVER_CREATED = 'server_created',
    SERVER_UPDATED = 'server_updated',
    SERVER_DELETED = 'server_deleted',
    SERVER_CONNECTED = 'server_connected',
    SERVER_DISCONNECTED = 'server_disconnected',
    SERVER_STATE_CHANGED = 'server_state_changed',
    SERVER_ERROR = 'server_error',
    SERVER_LOG = 'server_log',

    // Eventos de Sistema
    SYSTEM_ERROR = 'system_error',
    SYSTEM_WARNING = 'system_warning',
    SYSTEM_INFO = 'system_info'
}