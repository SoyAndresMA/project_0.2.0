'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { SSEEventType } from '@/lib/sse/events';

type SSEEventHandler = (event: SSEEventType, data: any) => void;

interface SSEContextType {
    subscribe: (handler: SSEEventHandler) => () => void;
}

const SSEContext = createContext<SSEContextType | null>(null);

export function SSEProvider({ children }: { children: ReactNode }) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const handlersRef = useRef<Set<SSEEventHandler>>(new Set());

    useEffect(() => {
        if (!eventSourceRef.current) {
            console.log('[SSE] Connecting...');
            const eventSource = new EventSource('/api/sse');
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('[SSE] Connected');
            };

            eventSource.onerror = (error) => {
                console.error('[SSE] Error:', error);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handlersRef.current.forEach(handler => handler(data.type, data.data));
                } catch (error) {
                    console.error('[SSE] Error parsing event:', error);
                }
            };
        }

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, []);

    const subscribe = (handler: SSEEventHandler) => {
        handlersRef.current.add(handler);
        return () => {
            handlersRef.current.delete(handler);
        };
    };

    return (
        <SSEContext.Provider value={{ subscribe }}>
            {children}
        </SSEContext.Provider>
    );
}

export function useSSE() {
    const context = useContext(SSEContext);
    if (!context) {
        throw new Error('useSSE must be used within an SSEProvider');
    }
    return context;
}
