'use client';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { MirasCasparGraph, MirasItemUnion, TypeItemUnion, TypeItem } from '@/lib/db/types';
import { useMirasCasparGraph } from '@/hooks/use-miras-caspar-graph';
import { useState, useCallback } from 'react';

interface MirasCasparGraphComponentProps {
    graph: MirasCasparGraph;
    itemUnion: MirasItemUnion;
    typeItemUnion: TypeItemUnion;
    typeItem: TypeItem;
}

export function MirasCasparGraphComponent({ 
    graph, 
    itemUnion, 
    typeItemUnion, 
    typeItem
}: MirasCasparGraphComponentProps) {
    const { playGraph, stopGraph, graphStates } = useMirasCasparGraph();
    const graphState = graphStates[graph?.id || ''];
    const isPlaying = graphState?.playing || false;

    const handlePlayClick = useCallback(async () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[MirasCasparGraph] 🖱️ Play button clicked', {
                graphId: graph?.id,
                graphName: graph?.name,
                currentState: isPlaying ? 'playing' : 'stopped',
                action: isPlaying ? 'stop' : 'play'
            });
        }
        
        try {
            if (!graph) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('[MirasCasparGraph] ❌ No graph provided');
                }
                return;
            }

            if (!graph.id) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('[MirasCasparGraph] ❌ Graph has no ID', graph);
                }
                return;
            }

            if (isPlaying) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[MirasCasparGraph] 🛑 Stopping graph', {
                        graphId: graph.id,
                        graphName: graph.name
                    });
                }
                await stopGraph(graph.id);
            } else {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[MirasCasparGraph] ▶️ Playing graph', {
                        graphId: graph.id,
                        graphName: graph.name
                    });
                }
                await playGraph(graph.id);
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[MirasCasparGraph] ❌ Error controlling graph:', error);
            }
        }
    }, [graph, isPlaying, playGraph, stopGraph]);

    if (!graph) {
        return null;
    }

    // Asegurarnos de que el icono tenga el prefijo "pi"
    const iconClass = typeItemUnion?.icon ? 
        (typeItemUnion.icon.startsWith('pi ') ? typeItemUnion.icon : `pi ${typeItemUnion.icon}`) : 
        'pi pi-file';

    return (
        <Card 
            className="miras-caspargraph-card"
            pt={{
                root: { 
                    className: 'relative z-1',
                    style: { 
                        width: '180px',
                        height: '48px',
                        padding: 0,
                        overflow: 'hidden',
                        backgroundColor: typeItem?.color_disabled || 'var(--primary-900)',
                        border: `1px solid ${typeItem?.color_disabled || 'var(--primary-900)'}`,
                        transition: 'all 0.2s ease-in-out'
                    }
                },
                body: { 
                    style: { 
                        padding: 0,
                        height: '100%'
                    }
                },
                content: { 
                    style: { 
                        padding: 0,
                        height: '100%'
                    }
                }
            }}
        >
            <div
                style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%'
                }}
            >
                {/* Primera fila - Nombre */}
                <div
                    style={{
                        borderBottom: '1px solid var(--primary-700)',
                        color: 'var(--primary-color-text)',
                        fontSize: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        padding: '0 2px',
                        height: '50%'
                    }}
                >
                    {graph.name}
                </div>

                {/* Segunda fila - Controles */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        height: '50%'
                    }}
                >
                    {/* PLAY/STOP */}
                    <div
                        style={{
                            flex: 1,
                            borderRight: '1px solid var(--primary-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 2
                        }}
                    >
                        <Button
                            icon={`pi ${isPlaying ? 'pi-stop' : 'pi-play'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlayClick();
                            }}
                            pt={{
                                root: {
                                    className: 'relative z-2 hover:cursor-pointer',
                                    style: {
                                        width: '24px',
                                        height: '24px',
                                        padding: 0,
                                        margin: 0,
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'var(--primary-color)'
                                    }
                                },
                                label: { className: 'hidden' },
                                icon: { className: 'text-sm' }
                            }}
                        />
                    </div>

                    {/* Icono del tipo de unión */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className={iconClass} style={{ fontSize: '1rem' }} />
                    </div>
                </div>
            </div>
        </Card>
    );
}