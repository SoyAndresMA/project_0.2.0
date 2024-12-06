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

interface UseMirasCasparClipResult {
    clipStates: ClipStates;
    playClip: (clipId: string) => Promise<void>;
    stopClip: (clipId: string) => Promise<void>;
}

const globalClipStates: ClipStates = {};

export function useMirasCasparClip(): UseMirasCasparClipResult {
    const [clipStates, setClipStates] = useState<ClipStates>(globalClipStates);

    useEffect(() => {
        const eventSource = new EventSource('/api/sse');

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

        return () => {
            eventSource.close();
        };
    }, []);

    const playClip = useCallback(async (clipId: string) => {
        console.log('[useMirasCasparClip] 📤 Sending play request for clip', { clipId });
        try {
            console.log('[useMirasCasparClip] 🌐 Making fetch request to', `/api/caspar/clips/${clipId}/play`);
            const response = await fetch(`/api/caspar/clips/${clipId}/play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log('[useMirasCasparClip] ✅ Received response', { 
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            });
            
            if (!response.ok) {
                const data = await response.json();
                console.error('[useMirasCasparClip] ❌ Response not OK', { 
                    status: response.status,
                    data 
                });
                throw new Error(data.message || 'Failed to play clip');
            }

            const result = await response.json();
            console.log('[useMirasCasparClip] 📥 Received response data', { result });
            return result;
        } catch (error) {
            console.error('[useMirasCasparClip] ❌ Error playing clip:', error);
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const stopClip = useCallback(async (clipId: string) => {
        console.log('[useMirasCasparClip] 📤 Sending stop request for clip', { clipId });
        try {
            const response = await fetch(`/api/caspar/clips/${clipId}/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to stop clip');
            }
            return response.json();
        } catch (error) {
            console.error('[useMirasCasparClip] ❌ Error stopping clip:', error);
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    return {
        clipStates,
        playClip,
        stopClip
    };
}
