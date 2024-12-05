'use client';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { MirasCasparClip, MirasItemUnion, TypeItemUnion, TypeItem } from '@/lib/db/types';
import { useMirasCasparControl } from '@/hooks/use-miras-caspar-control';
import { useState, useCallback } from 'react';

interface MirasCasparClipComponentProps {
    clip: MirasCasparClip;
    itemUnion: MirasItemUnion;
    typeItemUnion: TypeItemUnion;
    typeItem: TypeItem;
}

export function MirasCasparClipComponent({ 
    clip, 
    itemUnion, 
    typeItemUnion, 
    typeItem
}: MirasCasparClipComponentProps) {
    const { playClip, stopClip } = useMirasCasparControl();
    const [isPlaying, setIsPlaying] = useState(false);

    if (!clip) {
        return null;
    }

    // Asegurarnos de que el icono tenga el prefijo "pi"
    const iconClass = typeItemUnion?.icon ? 
        (typeItemUnion.icon.startsWith('pi ') ? typeItemUnion.icon : `pi ${typeItemUnion.icon}`) : 
        'pi pi-file';

    const handlePlayClick = useCallback(async () => {
        console.log('[MirasCasparClip] 🖱️ Play button clicked', {
            clipId: clip.id,
            clipName: clip.name,
            currentState: isPlaying ? 'playing' : 'stopped',
            action: isPlaying ? 'stop' : 'play'
        });
        
        try {
            if (isPlaying) {
                await stopClip(clip.id);
                setIsPlaying(false);
            } else {
                await playClip(clip.id);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('[MirasCasparClip] ❌ Error controlling clip:', error);
        }
    }, [clip.id, clip.name, isPlaying, playClip, stopClip]);

    return (
        <Card 
            className="miras-casparclip-card"
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
                    {clip.name}
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
