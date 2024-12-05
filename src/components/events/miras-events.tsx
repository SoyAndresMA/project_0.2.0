'use client';

import { Accordion, AccordionTab } from 'primereact/accordion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MirasProjectState, MirasProjectEvent } from '@/lib/project/types';
import { MirasCasparClipComponent } from '@/components/items/miras-casparclip';
import { MirasCasparGraphComponent } from '@/components/items/miras-caspargraph';
import { useState, useCallback } from 'react';
import { useSSE } from '@/hooks/use-sse';
import { SSEEventType } from '@/lib/sse/events';

interface MirasEventsProps {
    projectState: MirasProjectState;
    onEventSelect?: (eventId: string) => void;
    onItemStateChange?: (itemId: string, state: any) => void;
}

export function MirasEvents({ projectState, onEventSelect, onItemStateChange }: MirasEventsProps) {
    const [activeIndexes, setActiveIndexes] = useState<number[]>([]);
    
    useSSE({
        onEvent: useCallback((type, data) => {
            if (type === SSEEventType.ITEM_STATE_CHANGED && 
                (data.itemType === 'casparclip' || data.itemType === 'caspargraph')) {
                console.log('[MirasEvents] Item state changed:', {
                    type: data.itemType,
                    id: data.entityId,
                    state: data.state
                });
                onItemStateChange?.(data.entityId, data.state);
            }
        }, [onItemStateChange])
    });

    if (!projectState?.events) return null;
    
    console.log("Project State Events:", JSON.stringify(projectState.events, null, 2));

    const headerTemplate = (event: MirasProjectEvent) => {
        if (!event?.data) return null;

        return (
            <div className="w-full">
                <DataTable
                    value={[{ name: event.data.name }]}
                    className="text-[10px]"
                    showGridlines={false}
                    pt={{
                        root: { className: 'overflow-visible', style: { margin: 0, padding: 0 }},
                        table: { className: 'border-none', style: { margin: 0, padding: 0 }},
                        wrapper: { className: 'border-none', style: { margin: 0, padding: 0 }},
                        row: { className: 'border-none', style: { margin: 0, padding: 0 }},
                        cell: { className: 'border-none', style: { margin: 0, padding: 0 }},
                        tbody: { style: { margin: 0, padding: 0 }}
                    }}
                >
                    <Column
                        body={() => (
                            <button 
                                className="w-6 h-6 flex items-center justify-center transition-colors"
                                style={{
                                    color: 'var(--primary-color)',
                                    ':hover': { backgroundColor: 'var(--surface-100)' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i className="pi pi-play text-[10px]"></i>
                            </button>
                        )}
                        style={{ width: '24px', padding: 0 }}
                    />
                    <Column
                        body={() => <div className="w-2"></div>}
                        style={{ width: '8px', padding: 0 }}
                    />
                    <Column
                        body={() => (
                            <div className="w-6 h-6 flex items-center justify-center">
                                <i className="pi pi-file text-[10px]" style={{ color: 'var(--text-color-secondary)' }}></i>
                            </div>
                        )}
                        style={{ width: '24px', padding: 0 }}
                    />
                    <Column
                        field="name"
                        bodyClassName="truncate pl-2"
                        style={{ padding: 0, color: 'var(--text-color)' }}
                    />
                </DataTable>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="min-w-[1527px]">
                <Accordion 
                    multiple 
                    activeIndex={activeIndexes}
                    className="w-full"
                    onTabChange={(e) => {
                        const indexes = e.index as number[];
                        setActiveIndexes(indexes);
                        
                        const events = Object.values(projectState.events);
                        const newlyOpenedIndexes = indexes.filter(index => !activeIndexes.includes(index));
                        if (newlyOpenedIndexes.length > 0) {
                            const lastOpenedIndex = newlyOpenedIndexes[newlyOpenedIndexes.length - 1];
                            const selectedEvent = events[lastOpenedIndex];
                            if (selectedEvent?.data) {
                                onEventSelect?.(selectedEvent.data.id);
                            }
                        }
                    }}
                    pt={{ root: { className: 'border-none px-4 pt-4' }}}
                >
                    {Object.values(projectState.events).map((event, index) => (
                        <AccordionTab
                            key={event.data.id}
                            headerTemplate={() => headerTemplate(event)}
                            pt={{
                                root: {
                                    className: '',
                                    style: {
                                        borderColor: 'var(--surface-300)',
                                        marginBottom: '1.125rem',
                                        overflow: 'hidden',
                                        borderRadius: '4px',
                                        ...(index === 0 ? { marginTop: '0.5rem' } : {})
                                    }
                                },
                                header: {
                                    className: 'transition-colors',
                                    style: {
                                        minHeight: '28px',
                                        lineHeight: '28px',
                                        backgroundColor: 'var(--primary-700)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        ':hover': { backgroundColor: 'var(--primary-800)' }
                                    }
                                },
                                headerAction: {
                                    className: 'flex items-center w-full',
                                    style: { padding: 0, backgroundColor: 'transparent' }
                                },
                                headerTitle: {
                                    className: 'leading-none w-full',
                                    style: { color: 'var(--primary-50)' }
                                },
                                headerIcon: {
                                    className: 'text-[8px] w-6 flex items-center justify-center',
                                    style: { color: 'var(--primary-200)' }
                                },
                                content: {
                                    style: {
                                        backgroundColor: 'var(--surface-0)',
                                        color: 'var(--text-color-secondary)',
                                        padding: 0,
                                        margin: 0,
                                        overflow: 'hidden',
                                        borderBottomLeftRadius: '4px',
                                        borderBottomRightRadius: '4px'
                                    }
                                }
                            }}
                        >
                            <DataTable
                                value={Object.entries(event.rows).map(([rowIndex, row]) => ({
                                    rowIndex: parseInt(rowIndex),
                                    ...row
                                }))}
                                className="p-0"
                                showGridlines={false}
                                pt={{
                                    root: { className: 'overflow-hidden', style: { margin: 0, padding: 0 }},
                                    table: { className: 'border-none', style: { margin: 0, padding: 0 }},
                                    wrapper: { className: 'border-none', style: { margin: 0, padding: 0, overflow: 'hidden' }},
                                    row: { className: 'border-none', style: { margin: 0, padding: 0 }}
                                }}
                                style={{ tableLayout: 'fixed', width: '1527px', minWidth: '1527px' }}
                            >
                                <Column
                                    body={() => (
                                        <div className="flex items-center justify-center">
                                            <button 
                                                className="w-6 h-6 flex items-center justify-center transition-colors"
                                                style={{
                                                    color: 'var(--primary-color)',
                                                    ':hover': { backgroundColor: 'var(--surface-100)' }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <i className="pi pi-play text-[10px]"></i>
                                            </button>
                                        </div>
                                    )}
                                    style={{ width: '32px', padding: '3px' }}
                                />
                                {Array.from({ length: 8 }).map((_, columnIndex) => (
                                    <Column
                                        key={columnIndex}
                                        body={(rowData) => {
                                            if (!rowData?.items) return null;
                                            
                                            const item = Object.values(rowData.items).find(
                                                item => item.data.position_column === (columnIndex + 1)
                                            );
                                            
                                            if (item) {
                                                console.log('Item type:', item.typeItem?.item_type, 'Item:', item);
                                            }
                                            
                                            return (
                                                <div 
                                                    className="flex items-center justify-center" 
                                                    style={{ 
                                                        padding: '3px', 
                                                        overflow: 'hidden',
                                                        pointerEvents: 'auto'
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {item ? (
                                                        <div style={{ pointerEvents: 'auto' }}>
                                                            {item.typeItem?.item_type === 'casparclip' && (
                                                                <MirasCasparClipComponent
                                                                    clip={item.data}
                                                                    itemUnion={item.itemUnion}
                                                                    typeItemUnion={item.typeItemUnion}
                                                                    typeItem={item.typeItem}
                                                                />
                                                            )}
                                                            {item.typeItem?.item_type === 'caspargraph' && item.data && (
                                                                <MirasCasparGraphComponent
                                                                    graph={item.data}
                                                                    itemUnion={item.itemUnion}
                                                                    typeItemUnion={item.typeItemUnion}
                                                                    typeItem={item.typeItem}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className="card"
                                                            style={{
                                                                width: '180px', 
                                                                height: '24px',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        }}
                                        style={{ width: '186px', padding: 0 }}
                                    />
                                ))}
                            </DataTable>
                        </AccordionTab>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}