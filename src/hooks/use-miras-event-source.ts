import { useEffect, useRef } from 'react';
import { SSEEventType } from '@/lib/sse/events';

type EventCallback = (data: any) => void;

interface EventSourceOptions {
    onError?: (error: Event) => void;
}

export function useMirasEventSource(
    eventTypes: string[] | SSEEventType[],
    callbacks: Record<string, EventCallback>,
    options: EventSourceOptions = {}
) {
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const eventSource = new EventSource('/api/events/sse');
        eventSourceRef.current = eventSource;

        eventSource.onerror = options.onError;

        const eventTypeStrings = eventTypes.map(type => 
            typeof type === 'string' ? type : type.toString()
        );

        eventTypeStrings.forEach(eventType => {
            const callback = callbacks[eventType];
            if (callback) {
                eventSource.addEventListener(eventType, (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        callback(data);
                    } catch (error) {
                        console.error(`Error parsing SSE data for event ${eventType}:`, error);
                    }
                });
            }
        });

        return () => {
            eventSource.close();
        };
    }, [eventTypes, callbacks, options]);
}
