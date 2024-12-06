import { useCallback } from 'react';

export function useCasparClip() {
    const playClip = useCallback(async (clipId: string) => {
        const response = await fetch(`/api/caspar/clips/${clipId}/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to play clip: ${response.statusText}`);
        }

        return response.json();
    }, []);

    const stopClip = useCallback(async (clipId: string) => {
        const response = await fetch(`/api/caspar/clips/${clipId}/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to stop clip: ${response.statusText}`);
        }

        return response.json();
    }, []);

    return { playClip, stopClip };
}
