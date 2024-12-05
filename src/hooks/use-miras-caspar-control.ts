import { useCallback } from 'react';
import { SSEEventType } from '@/lib/sse/events';

interface UseMirasCasparControlResult {
    playClip: (clipId: string) => Promise<void>;
    stopClip: (clipId: string) => Promise<void>;
}

export function useMirasCasparControl(): UseMirasCasparControlResult {
    const playClip = useCallback(async (clipId: string) => {
        console.log('[useMirasCasparControl] 📤 Sending PLAY request', {
            clipId,
            endpoint: `/api/caspar-clips/${clipId}/play`
        });
        
        try {
            const response = await fetch(`/api/caspar-clips/${clipId}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error('Failed to play clip');
            }

            console.log('[useMirasCasparControl] ✅ PLAY request successful', {
                clipId,
                status: response.status
            });
        } catch (error) {
            console.error(`[useMirasCasparControl] ❌ Error playing clip ${clipId}:`, error);
            throw error;
        }
    }, []);

    const stopClip = useCallback(async (clipId: string) => {
        console.log('[useMirasCasparControl] 📤 Sending STOP request', {
            clipId,
            endpoint: `/api/caspar-clips/${clipId}/stop`
        });

        try {
            const response = await fetch(`/api/caspar-clips/${clipId}/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to stop clip');
            }

            console.log('[useMirasCasparControl] ✅ STOP request successful', {
                clipId,
                status: response.status
            });
        } catch (error) {
            console.error(`[useMirasCasparControl] ❌ Error stopping clip ${clipId}:`, error);
            throw error;
        }
    }, []);

    return {
        playClip,
        stopClip
    };
}
