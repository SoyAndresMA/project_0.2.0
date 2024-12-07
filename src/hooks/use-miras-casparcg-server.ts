import { useState, useRef } from 'react';
import { useSSE } from './use-sse';
import { SSEEventType } from '@/lib/sse/events';
import { Toast } from 'primereact/toast';

interface UseMirasCasparCGServerResult {
    error: string | null;
    connectServer: (id: string) => Promise<void>;
    disconnectServer: (id: string) => Promise<void>;
    toastRef: React.RefObject<Toast>;
}

export function useMirasCasparCGServer(): UseMirasCasparCGServerResult {
    const [error, setError] = useState<string | null>(null);
    const toastRef = useRef<Toast>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useSSE({
        onEvent: (type: SSEEventType, data: any) => {
            switch (type) {
                case SSEEventType.SERVER_CONNECTED:
                    toastRef.current?.show({
                        severity: 'success',
                        summary: 'Connected',
                        detail: `Connected to server "${data.entity.name}"`,
                        life: 3000
                    });
                    break;
                case SSEEventType.SERVER_DISCONNECTED:
                    toastRef.current?.show({
                        severity: 'info',
                        summary: 'Disconnected',
                        detail: `Disconnected from server "${data.entity.name}"`,
                        life: 3000
                    });
                    break;
                case SSEEventType.SERVER_ERROR:
                    setError(data.error);
                    toastRef.current?.show({
                        severity: 'error',
                        summary: 'Server Error',
                        detail: data.error,
                        life: 5000
                    });
                    break;
            }
        }
    });

    const connectServer = async (id: string): Promise<void> => {
        if (isConnecting) return;
        
        try {
            setIsConnecting(true);
            setError(null);
            
            const response = await fetch('/api/casparcg-servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'connect', id })
            });
            
            if (!response.ok) {
                throw new Error('Failed to connect to server');
            }
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectServer = async (id: string): Promise<void> => {
        if (isConnecting) return;
        
        try {
            setIsConnecting(true);
            setError(null);
            
            const response = await fetch('/api/casparcg-servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect', id })
            });
            
            if (!response.ok) {
                throw new Error('Failed to disconnect from server');
            }
        } catch (error) {
            throw error instanceof Error ? error : new Error('Unknown error');
        } finally {
            setIsConnecting(false);
        }
    };

    return {
        error,
        connectServer,
        disconnectServer,
        toastRef
    };
}
