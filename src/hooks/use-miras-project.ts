import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';
import { SSEEventType } from '@/lib/sse/events';
import { MirasProjectState, MirasProjectEvent } from '@/lib/project/types';

interface MirasProjectStateFormatted extends Omit<MirasProjectState, 'events'> {
    events: Array<MirasProjectEvent & { id: string }>;
}

interface UseMirasProjectResult {
    projectState: MirasProjectStateFormatted | null;
    isLoading: boolean;
    error: Error | null;
    openProject: (id: string) => Promise<void>;
    closeProject: () => Promise<void>;
}

const transformProjectState = (state: MirasProjectState): MirasProjectStateFormatted => {
    return {
        ...state,
        events: Object.entries(state.events).map(([id, event]) => ({
            ...event,
            id
        }))
    };
};

export function useMirasProject(): UseMirasProjectResult {
    const [projectState, setProjectState] = useState<MirasProjectStateFormatted | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useSSE({
        onEvent: useCallback((type: SSEEventType, data: any) => {
            switch (type) {
                case SSEEventType.PROJECT_LOADED:
                    if (data.state) {
                        setProjectState(transformProjectState(data.state));
                        setIsLoading(false);
                    } else {
                        setError(new Error('Failed to load project state'));
                        setIsLoading(false);
                    }
                    break;
                case SSEEventType.PROJECT_STATE_CHANGED:
                    if (data.state && (!projectState || data.projectId === projectState.id)) {
                        setProjectState(transformProjectState(data.state));
                    }
                    break;
                case SSEEventType.PROJECT_UNLOADED:
                    if (!projectState || data.projectId === projectState.id) {
                        setProjectState(null);
                        setIsLoading(false);
                    }
                    break;
                case SSEEventType.PROJECT_ERROR:
                    setError(new Error(data.error));
                    setIsLoading(false);
                    break;
            }
        }, [projectState])
    });

    const openProject = useCallback(async (id: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/projects/load/${id}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to load project');
            }
        } catch (error) {
            setError(error instanceof Error ? error : new Error('Unknown error'));
            setIsLoading(false);
            throw error;
        }
    }, []);

    const closeProject = useCallback(async () => {
        if (!projectState?.id) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/projects/unload/${projectState.id}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to unload project');
            }
        } catch (error) {
            setError(error instanceof Error ? error : new Error('Unknown error'));
            setIsLoading(false);
            throw error;
        }
    }, [projectState?.id]);

    return {
        projectState,
        isLoading,
        error,
        openProject,
        closeProject
    };
}
