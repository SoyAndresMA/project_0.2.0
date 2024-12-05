import { z } from 'zod';

// Esquema base para IDs
const idSchema = z.string().uuid();

// Esquemas para Project
export const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
});

export const updateProjectSchema = createProjectSchema.partial();

// Esquemas para Event
export const createEventSchema = z.object({
    project_id: idSchema,
    event_union_id: idSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    event_order: z.number().int().min(0).optional()
});

export const updateEventSchema = createEventSchema.partial();

// Esquemas para EventUnion
export const createEventUnionSchema = z.object({
    event_id: idSchema,
    project_id: idSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    position_row: z.number().int().min(0),
    position_column: z.number().int().min(0)
});

export const updateEventUnionSchema = createEventUnionSchema.partial();

// Esquemas para CasparClip
export const createCasparClipSchema = z.object({
    event_id: idSchema,
    type_item_id: idSchema,
    casparcg_server_id: idSchema.optional(),
    item_union_id: idSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    position_row: z.number().int().min(0),
    position_column: z.number().int().min(0),
    label: z.string().optional(),
    channel: z.number().int().positive().optional(),
    layer: z.number().int().min(0).optional(),
    loop: z.number().int().min(0).max(1).optional(),
    delay: z.number().int().min(0).max(99).optional(),
    transition_type: z.string().optional(),
    transition_duration: z.number().int().positive().optional()
});

export const updateCasparClipSchema = createCasparClipSchema.partial();

// Esquemas para CasparGraph
export const createCasparGraphSchema = z.object({
    event_id: idSchema,
    type_item_id: idSchema,
    casparcg_server_id: idSchema.optional(),
    item_union_id: idSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    position_row: z.number().int().min(0),
    position_column: z.number().int().min(0),
    label: z.string().optional(),
    channel: z.number().int().positive().optional(),
    layer: z.number().int().min(0).optional(),
    delay: z.number().int().min(0).max(99).optional(),
    duration: z.number().int().positive().optional(),
    keyvalue: z.string().optional()
});

export const updateCasparGraphSchema = createCasparGraphSchema.partial();

// Esquemas para CasparCG Server
export const createServerSchema = z.object({
    name: z.string().min(1),
    host: z.string().min(1),
    port: z.number().int().positive(),
    enabled: z.boolean().optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    media_library: z.string().optional(),
    command_timeout: z.number().int().positive().optional()
});

export const updateServerSchema = createServerSchema.partial();
