import { useState, useCallback, useEffect, useRef } from 'react';
import { useSSE } from './use-sse';
import { SSEEventType } from '@/lib/sse/events';
import { MirasProjectState, MirasProjectEvent } from '@/lib/project/types';

// Estado del proyecto con eventos como array en lugar de objeto
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

// Función para transformar el estado del proyecto
const transformProjectState = (state: MirasProjectState): MirasProjectStateFormatted => {
    return {
        ...state,
        events: Object.entries(state.events).map(([id, event]) => ({
            ...event,
            id
        }))
    };
};

export function useMirasProject(projectId?: string): UseMirasProjectResult {
    const [projectState, setProjectState] = useState<MirasProjectStateFormatted | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const loadingRef = useRef<string | null>(null);

    const { isConnected } = useSSE({
        onEvent: (type, data) => {
            console.log('[useMirasProject] Received SSE event:', type, data);
            switch (type) {
                case SSEEventType.PROJECT_LOADED:
                    if (data.state) {
                        console.log('[useMirasProject] Setting project state from SSE');
                        setProjectState(transformProjectState(data.state));
                        setIsLoading(false);
                        loadingRef.current = null;
                    } else {
                        console.error('[useMirasProject] No state received in PROJECT_LOADED event');
                        setError(new Error('Failed to load project state'));
                        setIsLoading(false);
                        loadingRef.current = null;
                    }
                    break;
                case SSEEventType.PROJECT_STATE_CHANGED:
                    if (data.state && (!projectState || data.projectId === projectState.id)) {
                        console.log('[useMirasProject] Updating project state from SSE');
                        setProjectState(transformProjectState(data.state));
                    }
                    break;
                case SSEEventType.PROJECT_UNLOADED:
                    if (!projectState || data.projectId === projectState.id) {
                        console.log('[useMirasProject] Clearing project state from SSE');
                        setProjectState(null);
                        setIsLoading(false);
                        loadingRef.current = null;
                    }
                    break;
            }
        },
        onError: (error) => {
            console.error('[useMirasProject] SSE error:', error);
            setError(error instanceof Error ? error : new Error('Unknown error'));
            setIsLoading(false);
            loadingRef.current = null;
        }
    });

    const closeProject = useCallback(async () => {
        if (!projectState?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/projects/unload/${projectState.id}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to unload project');
            }

            setProjectState(null);
        } catch (err) {
            console.error('[useMirasProject] Error closing project:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            throw err;
        } finally {
            setIsLoading(false);
            loadingRef.current = null;
        }
    }, [projectState?.id]);

    const openProject = useCallback(async (id: string) => {
        // Evitar cargar el mismo proyecto múltiples veces
        if (loadingRef.current === id) {
            console.log(`[useMirasProject] Project ${id} is already loading`);
            return;
        }

        // Si hay un proyecto abierto y es diferente al que queremos abrir
        if (projectState?.id && projectState.id !== id) {
            console.log(`[useMirasProject] Closing project ${projectState.id} before opening ${id}`);
            try {
                await closeProject();
            } catch (err) {
                console.error('[useMirasProject] Error closing previous project:', err);
                setError(err instanceof Error ? err : new Error('Failed to close previous project'));
                return;
            }
        }

        console.log(`[useMirasProject] Starting to open project ${id}`);
        setIsLoading(true);
        setError(null);
        loadingRef.current = id;

        try {
            const loadResponse = await fetch(`/api/projects/load/${id}`, {
                method: 'POST'
            });
            if (!loadResponse.ok) {
                throw new Error('Failed to load project');
            }
            console.log(`[useMirasProject] Project load request sent`);
        } catch (err) {
            console.error('[useMirasProject] Error opening project:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsLoading(false);
            loadingRef.current = null;
            throw err;
        }
    }, [projectState?.id, closeProject]);

    // Cargar proyecto automáticamente si se proporciona projectId
    useEffect(() => {
        if (projectId && !projectState && !isLoading) {
            console.log(`[useMirasProject] Auto-loading project ${projectId}`);
            openProject(projectId).catch(err => {
                console.error('[useMirasProject] Error auto-loading project:', err);
            });
        }
    }, [projectId, projectState, isLoading, openProject]);

    // Efecto para manejar la reconexión
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && projectId && !projectState) {
                console.log('[useMirasProject] Page became visible, reloading project');
                openProject(projectId).catch(err => {
                    console.error('[useMirasProject] Error reloading project:', err);
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [projectId, projectState, openProject]);

    return {
        projectState,
        isLoading,
        error,
        openProject,
        closeProject
    };
}
