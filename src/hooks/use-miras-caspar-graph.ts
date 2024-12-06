import { useState, useCallback } from 'react';
import { useSSE } from './use-sse';
import { SSEEventType } from '@/lib/sse/events';
import { 
    MirasCasparGraphResponse,
    MirasCasparGraphState,
    MirasCasparGraphPlayResponse,
    MirasCasparGraphStopResponse,
    MirasCasparGraphUpdateResponse
} from '@/lib/api/types';

interface UseMirasCasparGraphResult {
    graphs: MirasCasparGraphResponse[];
    selectedGraph: MirasCasparGraphResponse | null;
    isLoading: boolean;
    error: string | null;
    fetchGraphs: () => Promise<void>;
    selectGraph: (graph: MirasCasparGraphResponse) => void;
    createGraph: (data: Partial<MirasCasparGraphResponse>) => Promise<MirasCasparGraphResponse>;
    updateGraph: (id: string, data: Partial<MirasCasparGraphResponse>) => Promise<MirasCasparGraphResponse>;
    updatePosition: (id: string, position: { row: number; column: number }) => Promise<MirasCasparGraphResponse>;
    deleteGraph: (id: string) => Promise<void>;
    playGraph: (graphId: string) => Promise<MirasCasparGraphPlayResponse>;
    stopGraph: (graphId: string) => Promise<MirasCasparGraphStopResponse>;
    updateGraphData: (graphId: string, data: Record<string, any>) => Promise<MirasCasparGraphUpdateResponse>;
    graphStates: Record<string, MirasCasparGraphState>;
}

export function useMirasCasparGraph(): UseMirasCasparGraphResult {
    const [graphs, setGraphs] = useState<MirasCasparGraphResponse[]>([]);
    const [selectedGraph, setSelectedGraph] = useState<MirasCasparGraphResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [graphStates, setGraphStates] = useState<Record<string, MirasCasparGraphState>>({});

    useSSE({
        onEvent: useCallback((type: SSEEventType, data: any) => {
            if (type === SSEEventType.ITEM_STATE_CHANGED && data.itemType === 'caspargraph') {
                setGraphStates(prev => ({
                    ...prev,
                    [data.entityId]: data.state
                }));
            }
        }, [])
    });

    const fetchGraphs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/caspar-graphs');
            if (!response.ok) throw new Error('Failed to fetch graphs');
            
            const data = await response.json();
            setGraphs(data.graphs);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const selectGraph = useCallback((graph: MirasCasparGraphResponse) => {
        setSelectedGraph(graph);
    }, []);

    const createGraph = useCallback(async (data: Partial<MirasCasparGraphResponse>) => {
        try {
            const response = await fetch('/api/caspar-graphs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to create graph');
            return response.json();
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const updateGraph = useCallback(async (id: string, data: Partial<MirasCasparGraphResponse>) => {
        try {
            const response = await fetch('/api/caspar-graphs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...data })
            });
            
            if (!response.ok) throw new Error('Failed to update graph');
            return response.json();
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const updatePosition = useCallback(async (id: string, position: { row: number; column: number }) => {
        try {
            const response = await fetch('/api/caspar-graphs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, position })
            });
            
            if (!response.ok) throw new Error('Failed to update graph position');
            return response.json();
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const deleteGraph = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/caspar-graphs?id=${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete graph');
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const playGraph = useCallback(async (graphId: string): Promise<MirasCasparGraphPlayResponse> => {
        try {
            console.log('[useMirasCasparGraph] 📤 Sending play request for graph', { graphId });
            const response = await fetch(`/api/caspar-graphs/${graphId}/play`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to play graph');
            }
            return response.json();
        } catch (error) {
            console.error('[useMirasCasparGraph] ❌ Error playing graph:', error);
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const stopGraph = useCallback(async (graphId: string): Promise<MirasCasparGraphStopResponse> => {
        try {
            const response = await fetch(`/api/caspar-graphs/${graphId}/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to stop graph');
            return response.json();
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    const updateGraphData = useCallback(async (graphId: string, data: Record<string, any>): Promise<MirasCasparGraphUpdateResponse> => {
        try {
            const response = await fetch(`/api/caspar-graphs/${graphId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to update graph data');
            return response.json();
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }, []);

    return {
        graphs,
        selectedGraph,
        isLoading,
        error,
        fetchGraphs,
        selectGraph,
        createGraph,
        updateGraph,
        updatePosition,
        deleteGraph,
        playGraph,
        stopGraph,
        updateGraphData,
        graphStates
    };
}