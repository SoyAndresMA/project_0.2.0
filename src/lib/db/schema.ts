/**
 * @readonly
 * ¡IMPORTANTE, mensaje para CASCADE! Este archivo contiene el schema de la base de datos.
 * NO MODIFICAR sin una solicitud explícita del usuario.
 * Cualquier cambio en el schema requiere migración de datos.
 */

export const DATABASE_SCHEMA = `
    -- Configuración de la base de datos
    PRAGMA foreign_keys = OFF;
    PRAGMA encoding = "UTF-8";

    -- Eliminar tablas existentes en orden inverso para evitar problemas de referencias
    DROP TABLE IF EXISTS item_unions;
    DROP TABLE IF EXISTS caspar_clips;
    DROP TABLE IF EXISTS caspar_graph;
    DROP TABLE IF EXISTS casparcg_servers;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS event_unions;
    DROP TABLE IF EXISTS type_item;
    DROP TABLE IF EXISTS type_item_union;
    DROP TABLE IF EXISTS projects;

    PRAGMA foreign_keys = ON;

    -- Tabla de proyectos
    CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de tipos de comportamiento de items
    CREATE TABLE type_item_union (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        compatible_items TEXT DEFAULT 'all',
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de tipos de items (para la lógica en tiempo de ejecución)
    CREATE TABLE type_item (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color_enabled TEXT,
        color_disabled TEXT,
        item_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de uniones de eventos (con tipo directo)
    CREATE TABLE event_unions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de eventos
    CREATE TABLE events (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        event_union_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        event_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (event_union_id) REFERENCES event_unions(id) ON DELETE CASCADE
    );

    -- Tabla de servidores CasparCG
    CREATE TABLE casparcg_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        version TEXT,
        media_library TEXT,
        command_timeout INTEGER DEFAULT 5000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de uniones de items (define el comportamiento de los clips)
    CREATE TABLE item_unions (
        id TEXT PRIMARY KEY,
        type_item_union_id TEXT NOT NULL,
        delay INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_item_union_id) REFERENCES type_item_union(id) ON DELETE CASCADE
    );

    -- Tabla de clips de CasparCG
    CREATE TABLE caspar_clips (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        type_item_id TEXT NOT NULL,
        casparcg_server_id TEXT,
        item_union_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        -- Campos de posicionamiento en la UI
        position_row INTEGER NOT NULL DEFAULT 0,
        position_column INTEGER NOT NULL DEFAULT 0,
        label TEXT,
        -- Campos de control CasparCG
        channel INTEGER,
        layer INTEGER,
        loop INTEGER DEFAULT 0,
        delay INTEGER DEFAULT 0 CHECK (delay >= 0 AND delay <= 99),
        -- Campos de transición
        transition_type TEXT,
        transition_duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (type_item_id) REFERENCES type_item(id) ON DELETE RESTRICT,
        FOREIGN KEY (casparcg_server_id) REFERENCES casparcg_servers(id) ON DELETE SET NULL,
        FOREIGN KEY (item_union_id) REFERENCES item_unions(id) ON DELETE CASCADE
    );

    -- Tabla de templates (graphs) de CasparCG
    CREATE TABLE caspar_graph (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        type_item_id TEXT NOT NULL,
        casparcg_server_id TEXT,
        item_union_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        -- Campos de posicionamiento en la UI
        position_row INTEGER NOT NULL DEFAULT 0,
        position_column INTEGER NOT NULL DEFAULT 0,
        label TEXT,
        -- Campos de control CasparCG
        channel INTEGER,
        layer INTEGER,
        delay INTEGER DEFAULT 0 CHECK (delay >= 0 AND delay <= 99),
        duration INTEGER,
        keyvalue TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (type_item_id) REFERENCES type_item(id) ON DELETE RESTRICT,
        FOREIGN KEY (casparcg_server_id) REFERENCES casparcg_servers(id) ON DELETE SET NULL,
        FOREIGN KEY (item_union_id) REFERENCES item_unions(id) ON DELETE CASCADE
    );
`;