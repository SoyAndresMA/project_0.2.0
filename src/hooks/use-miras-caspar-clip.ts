import { useCallback, useState, useRef, useEffect } from 'react';
import { useSSE } from './use-sse';
import { SSEEventType } from '@/lib/sse/events';

interface ClipState {
    playing: boolean;
}

interface UseMirasCasparClipResult {
    playClip: (clipId: string) => Promise<void>;
    stopClip: (clipId: string) => Promise<void>;
    clipStates: Record<string, ClipState>;
}

export function useMirasCasparClip(): UseMirasCasparClipResult {
    const [clipStates, setClipStates] = useState<Record<string, ClipState>>({});
    const pendingRequests = useRef<Map<string, AbortController>>(new Map());

    // Función para cancelar una petición específica
    const cancelRequest = useCallback((clipId: string) => {
        const controller = pendingRequests.current.get(clipId);
        if (controller) {
            controller.abort();
            pendingRequests.current.delete(clipId);
        }
    }, []);

    // Función para cancelar todas las peticiones pendientes
    const cancelAllRequests = useCallback(() => {
        pendingRequests.current.forEach((controller, clipId) => {
            controller.abort();
            pendingRequests.current.delete(clipId);
        });
    }, []);

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            cancelAllRequests();
        };
    }, [cancelAllRequests]);

    useSSE({
        onEvent: useCallback((type: SSEEventType, data: any) => {
            switch (type) {
                case SSEEventType.CLIP_PLAYED:
                    setClipStates(prev => ({
                        ...prev,
                        [data.clipId]: { playing: true }
                    }));
                    break;
                case SSEEventType.CLIP_STOPPED:
                    setClipStates(prev => ({
                        ...prev,
                        [data.clipId]: { playing: false }
                    }));
                    break;
                case SSEEventType.PROJECT_UNLOADED:
                    // Cancelar todas las peticiones pendientes y limpiar estados
                    cancelAllRequests();
                    setClipStates({});
                    break;
            }
        }, [cancelAllRequests])
    });

    const playClip = useCallback(async (clipId: string) => {
        try {
            // Cancelar petición anterior del mismo clip si existe
            cancelRequest(clipId);
            
            // Crear nuevo controlador para esta petición
            const controller = new AbortController();
            pendingRequests.current.set(clipId, controller);
            
            const url = `/api/caspar/clips/${clipId}/play`;
            console.log(`[useMirasCasparClip] 🎬 Making POST request to:`, url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            
            // Limpiar el controlador después de completar
            pendingRequests.current.delete(clipId);
            
            console.log(`[useMirasCasparClip] Response status:`, response.status);
            
            if (!response.ok) {
                const data = await response.json();
                console.error(`[useMirasCasparClip] ❌ Failed to play clip:`, data);
                throw new Error(data.error || 'Failed to play clip');
            }
            console.log(`[useMirasCasparClip] ✅ Play command sent successfully for clip ${clipId}`);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log(`[useMirasCasparClip] Request aborted for clip ${clipId}`);
                return;
            }
            console.error(`[useMirasCasparClip] ❌ Error playing clip:`, error);
            throw error;
        }
    }, [cancelRequest]);

    const stopClip = useCallback(async (clipId: string) => {
        try {
            // Cancelar petición anterior del mismo clip si existe
            cancelRequest(clipId);
            
            // Crear nuevo controlador para esta petición
            const controller = new AbortController();
            pendingRequests.current.set(clipId, controller);
            
            const url = `/api/caspar/clips/${clipId}/stop`;
            console.log(`[useMirasCasparClip] 🛑 Making POST request to:`, url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            
            // Limpiar el controlador después de completar
            pendingRequests.current.delete(clipId);
            
            console.log(`[useMirasCasparClip] Response status:`, response.status);
            
            if (!response.ok) {
                const data = await response.json();
                console.error(`[useMirasCasparClip] ❌ Failed to stop clip:`, data);
                throw new Error(data.error || 'Failed to stop clip');
            }
            console.log(`[useMirasCasparClip] ✅ Stop command sent successfully for clip ${clipId}`);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log(`[useMirasCasparClip] Request aborted for clip ${clipId}`);
                return;
            }
            console.error(`[useMirasCasparClip] ❌ Error stopping clip:`, error);
            throw error;
        }
    }, [cancelRequest]);

    return { playClip, stopClip, clipStates };
}
