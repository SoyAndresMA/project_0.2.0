import { useEffect, useRef } from 'react';
import { SSEEventType } from '@/lib/sse/events';

interface UseSSEOptions {
    onEvent?: (type: SSEEventType, data: any) => void;
    onError?: (error: any) => void;
    debug?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const { debug = false } = options;

    useEffect(() => {
        const eventSource = new EventSource('/api/sse');
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            if (debug) {
                console.log('[SSE] Connected');
            }
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (debug) {
                    console.log('[SSE] Received event:', data);
                }
                
                if (!data.type) {
                    console.warn('[SSE] Event missing type:', data);
                    return;
                }

                options.onEvent?.(data.type, data.data);
            } catch (error) {
                console.error('[SSE] Error parsing event:', error);
                options.onError?.(error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[SSE] Connection error:', error);
            options.onError?.(error);
        };

        return () => {
            if (debug) {
                console.log('[SSE] Closing connection');
            }
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [options, debug]);

    return {
        isConnected: !!eventSourceRef.current
    };
}