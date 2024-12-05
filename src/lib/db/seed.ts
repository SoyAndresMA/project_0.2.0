import { DatabaseService } from './services/DatabaseService';
import { v4 as uuidv4 } from 'uuid';

// Función para generar delays realistas
function generateRealisticDelay(): number {
    const random = Math.random();
    if (random < 0.6) return 0;  // 60% probabilidad de delay 0
    return Math.floor(Math.random() * 10) + 3;  // Resto entre 3 y 12
}

export async function seedDatabase() {
    try {
        console.log('Seeding database...');
        const db = DatabaseService.getInstance();
        await db.initialize();
        const database = db.getDatabase();

        // Perform all seeding in a single transaction
        database.transaction(() => {
            // 1. Create default type_item_unions (comportamientos)
            const typeItemUnions = [
                {
                    id: uuidv4(),
                    name: 'Paralelo',
                    description: 'Los elementos se reproducen simultáneamente',
                    compatible_items: 'all',
                    icon: 'pi pi-arrows-v'
                },
                {
                    id: uuidv4(),
                    name: 'Lineal',
                    description: 'Se detiene después de cada fila',
                    compatible_items: 'all',
                    icon: 'pi pi-step-forward'
                },
                {
                    id: uuidv4(),
                    name: 'Secuencial',
                    description: 'Reproducción automática fila tras fila',
                    compatible_items: 'all',
                    icon: 'pi pi-sort-numeric-down'
                }
            ];

            typeItemUnions.forEach(union => {
                database.prepare(`
                    INSERT INTO type_item_union (id, name, description, compatible_items, icon)
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    union.id,
                    union.name,
                    union.description,
                    union.compatible_items,
                    union.icon
                );
                console.log(`Created type_item_union: ${union.name}`);
            });

            // 2. Create default type_item for CasparClip
            const typeItemId = uuidv4();
            const graphTypeItemId = uuidv4();

            database.prepare(`
                INSERT INTO type_item (id, name, description, color_enabled, color_disabled, item_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                typeItemId,
                'CasparClip',
                'Clip de vídeo para CasparCG',
                '#27AE60',
                '#526B58',
                'casparclip'
            );
            console.log('Created CasparClip type_item');

            database.prepare(`
                INSERT INTO type_item (id, name, description, color_enabled, color_disabled, item_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                graphTypeItemId,
                'CasparGraph',
                'Template gráfico para CasparCG',
                '#2E86C1',
                '#21618C',
                'caspargraph'
            );
            console.log('Created CasparGraph type_item');

            // 3. Create test servers
            const serverId = uuidv4();
            database.prepare(`
                INSERT INTO casparcg_servers (id, name, host, port, enabled, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                serverId,
                'Playout Principal',
                'amadell',
                5250,
                1,
                'Servidor principal de emisión'
            );
            console.log('Created CasparCG server');

            // 4. Create test projects
            const projects = [
                {
                    id: uuidv4(),
                    name: 'Informativo Tarde',
                    description: 'Informativo diario de la tarde'
                },
                {
                    id: uuidv4(),
                    name: 'Magazine Mañana',
                    description: 'Programa magazine de actualidad'
                },
                {
                    id: uuidv4(),
                    name: 'Debate Semanal',
                    description: 'Programa de debate político'
                }
            ];

            projects.forEach(project => {
                database.prepare(`
                    INSERT INTO projects (id, name, description)
                    VALUES (?, ?, ?)
                `).run(
                    project.id,
                    project.name,
                    project.description
                );
                console.log(`Created project: ${project.name}`);
            });

            // 5. Create event unions for each project (3-7 events per project)
            const eventUnionsTemplate = [
                // Informativo
                [
                    { name: 'Cabecera', type: 'Paralelo', icon: 'pi pi-arrows-v' },
                    { name: 'Noticias', type: 'Lineal', icon: 'pi pi-step-forward' },
                    { name: 'Deportes', type: 'Secuencial', icon: 'pi pi-angle-double-down' },
                    { name: 'Internacional', type: 'Lineal', icon: 'pi pi-step-forward' },
                    { name: 'Economía', type: 'Secuencial', icon: 'pi pi-angle-double-down' },
                    { name: 'Cultura', type: 'Paralelo', icon: 'pi pi-arrows-v' },
                    { name: 'Cierre', type: 'Lineal', icon: 'pi pi-step-forward' }
                ],
                // Magazine
                [
                    { name: 'Intro Magazine', type: 'Paralelo', icon: 'pi pi-arrows-v' },
                    { name: 'Entrevista', type: 'Lineal', icon: 'pi pi-step-forward' },
                    { name: 'Música', type: 'Secuencial', icon: 'pi pi-angle-double-down' },
                    { name: 'Reportaje', type: 'Lineal', icon: 'pi pi-step-forward' },
                    { name: 'Tertulia', type: 'Paralelo', icon: 'pi pi-arrows-v' },
                    { name: 'Despedida', type: 'Secuencial', icon: 'pi pi-angle-double-down' }
                ],
                // Debate
                [
                    { name: 'Intro Debate', type: 'Paralelo', icon: 'pi pi-arrows-v' },
                    { name: 'Tema Principal', type: 'Lineal', icon: 'pi pi-step-forward' },
                    { name: 'Análisis', type: 'Secuencial', icon: 'pi pi-angle-double-down' },
                    { name: 'Opinión', type: 'Lineal', icon: 'pi pi-step-forward' },
                    { name: 'Conclusiones', type: 'Paralelo', icon: 'pi pi-arrows-v' }
                ]
            ];

            const allEventUnions = [];
            projects.forEach((project, projectIndex) => {
                const projectEventUnions = eventUnionsTemplate[projectIndex].map(template => ({
                    id: uuidv4(),
                    name: template.name,
                    description: `${template.name} - ${project.name}`,
                    type: template.type,
                    icon: template.icon
                }));

                projectEventUnions.forEach(union => {
                    database.prepare(`
                        INSERT INTO event_unions (id, name, description, type, icon)
                        VALUES (?, ?, ?, ?, ?)
                    `).run(
                        union.id,
                        union.name,
                        union.description,
                        union.type,
                        union.icon
                    );
                    console.log(`Created event_union: ${union.name}`);
                });

                allEventUnions.push(projectEventUnions);
            });

            // 6. Create events linked to event_unions (1:1)
            const allEvents = [];
            projects.forEach((project, projectIndex) => {
                const projectEvents = allEventUnions[projectIndex].map((union, index) => ({
                    id: uuidv4(),
                    project_id: project.id,
                    event_union_id: union.id,
                    name: union.name,
                    description: union.description,
                    event_order: index
                }));

                projectEvents.forEach(event => {
                    database.prepare(`
                        INSERT INTO events (id, project_id, event_union_id, name, description, event_order)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `).run(
                        event.id,
                        event.project_id,
                        event.event_union_id,
                        event.name,
                        event.description,
                        event.event_order
                    );
                    console.log(`Created event: ${event.name}`);
                });

                allEvents.push(projectEvents);
            });

            // 7. Create item_unions for each event (3-7 rows × 2-6 clips per row)
            allEvents.forEach(projectEvents => {
                projectEvents.forEach(event => {
                    // Generar entre 3 y 7 filas
                    const numRows = Math.floor(Math.random() * 5) + 3;
                    
                    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                        // Generar entre 2 y 6 columnas para esta fila
                        const numColumns = Math.floor(Math.random() * 5) + 2;
                        
                        for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
                            const itemUnionId = uuidv4();
                            const isGraph = Math.random() < 0.3; // 30% probabilidad de ser un graph

                            // Create item_union
                            database.prepare(`
                                INSERT INTO item_unions (id, type_item_union_id, delay)
                                VALUES (?, ?, ?)
                            `).run(
                                itemUnionId,
                                typeItemUnions[Math.floor(Math.random() * typeItemUnions.length)].id,
                                generateRealisticDelay()
                            );

                            if (isGraph) {
                                // Create caspar_graph
                                database.prepare(`
                                    INSERT INTO caspar_graph (
                                        id, event_id, type_item_id, casparcg_server_id,
                                        item_union_id, name, description,
                                        position_row, position_column,
                                        channel, layer, delay, duration, keyvalue
                                    )
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).run(
                                    uuidv4(),
                                    event.id,
                                    graphTypeItemId,
                                    serverId,
                                    itemUnionId,
                                    `Graph ${rowIndex + 1}-${columnIndex + 1}`,
                                    `Template gráfico de prueba ${rowIndex + 1}-${columnIndex + 1}`,
                                    rowIndex,
                                    columnIndex + 1,
                                    1,
                                    20 + rowIndex,
                                    0,
                                    5000,
                                    JSON.stringify({
                                        title: `Título ${rowIndex + 1}-${columnIndex + 1}`,
                                        subtitle: 'Subtítulo de prueba',
                                        text: 'Texto de ejemplo para el template'
                                    })
                                );
                            } else {
                            // Create caspar_clip
                            database.prepare(`
                                INSERT INTO caspar_clips (
                                    id, event_id, type_item_id, casparcg_server_id,
                                    item_union_id, name, description,
                                    position_row, position_column,
                                    channel, layer, loop, delay
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).run(
                                uuidv4(),
                                event.id,
                                typeItemId,
                                serverId,
                                itemUnionId,
                                `Clip ${rowIndex + 1}-${columnIndex + 1}`,
                                `Clip de prueba ${rowIndex + 1}-${columnIndex + 1}`,
                                rowIndex,
                                columnIndex + 1,
                                1,
                                10 + rowIndex,
                                0,
                                0
                            );
                            }
                        }
                    }
                    console.log(`Created items for event: ${event.name}`);
                });
            });
        })();

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

// Run if this is the main module
if (import.meta.url === new URL(import.meta.url).href) {
    seedDatabase()
        .catch(() => process.exit(1));
}
