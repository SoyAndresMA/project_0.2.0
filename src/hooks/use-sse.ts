import { useEffect, useRef } from 'react';
import { SSEEventType } from '@/lib/sse/events';

interface UseSSEOptions {
    onEvent?: (type: SSEEventType, data: any) => void;
    onError?: (error: any) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const eventSource = new EventSource('/api/sse');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log('[SSE] Connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                options.onEvent?.(data.type, data.data);
            } catch (error) {
                console.error('[SSE] Error parsing event:', error);
                options.onError?.(error);
            }
        };

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [options]);

    return {
        isConnected: !!eventSourceRef.current
    };
}