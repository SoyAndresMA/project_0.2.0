import { useState, useEffect, useCallback } from 'react';

interface ClipState {
    playing: boolean;
    paused: boolean;
    position: number;
    length: number;
    error: string | null;
}

interface ClipStates {
    [clipId: string]: ClipState;
}

interface ServerStatus {
    isConnected: boolean;
    error?: string;
}

interface UseMirasCasparClipResult {
    clipStates: ClipStates;
    isServerConnected: boolean;
    playClip: (clipId: string) => Promise<void>;
    stopClip: (clipId: string) => Promise<void>;
}

const globalClipStates: ClipStates = {};

export function useMirasCasparClip(): UseMirasCasparClipResult {
    const [clipStates, setClipStates] = useState<ClipStates>(globalClipStates);
    const [isServerConnected, setIsServerConnected] = useState<boolean>(false);

    useEffect(() => {
        const eventSource = new EventSource('/api/sse');

        // Escuchar eventos de estado del servidor
        eventSource.addEventListener('server_status', (event) => {
            const data = JSON.parse(event.data);
            setIsServerConnected(data.status === 'CONNECTED');
        });

        // Escuchar eventos de estado de clip
        eventSource.addEventListener('clip_state', (event) => {
            const data = JSON.parse(event.data);
            console.log('[useMirasCasparClip] 📥 Received clip state:', data);
            setClipStates(prevStates => ({
                ...prevStates,
                [data.clipId]: {
                    playing: data.playing,
                    paused: data.paused,
                    position: data.position,
                    length: data.length,
                    error: data.error
                }
            }));
        });

        // Escuchar errores
        eventSource.onerror = (error) => {
            console.error('[useMirasCasparClip] ❌ SSE connection error:', error);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const playClip = useCallback(async (clipId: string) => {
        console.log('[useMirasCasparClip] 📤 Sending play request for clip', { clipId });
        try {
            const response = await fetch(`/api/caspar-clips/${clipId}/play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to play clip');
            }
            return response.json();
        } catch (error) {
            console.error('[useMirasCasparClip] ❌ Error playing clip:', error);
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const stopClip = useCallback(async (clipId: string) => {
        try {
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/caspar-clips/${clipId}/stop`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error stopping clip');
            }
        } catch (error) {
            setClipStates(prevStates => ({
                ...prevStates,
                [clipId]: {
                    ...prevStates[clipId],
                    error: error.message
                }
            }));
            throw error;
        }
    }, []);

    return {
        clipStates,
        isServerConnected,
        playClip,
        stopClip
    };
}
