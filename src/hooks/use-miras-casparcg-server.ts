import { useState, useRef } from 'react';
import { Toast } from 'primereact/toast';

interface UseMirasCasparCGServerResult {
    error: string | null;
    connectServer: (id: string) => Promise<boolean>;
    toastRef: React.RefObject<Toast>;
}

export function useMirasCasparCGServer(): UseMirasCasparCGServerResult {
    const [error, setError] = useState<string | null>(null);
    const toastRef = useRef<Toast>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const connectServer = async (id: string): Promise<boolean> => {
        // Si ya estamos intentando conectar, no hacer nada
        if (isConnecting) return false;
        
        try {
            setIsConnecting(true);
            setError(null);
            
            const response = await fetch(`/api/casparcg-servers/${id}/connect`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                let errorMessage = data.error || 'Could not connect to server';
                // Si tenemos información adicional del servidor, la incluimos en el mensaje
                if (data.serverName) {
                    errorMessage = `Connection failed to server "${data.serverName}" (${data.host}:${data.port})`;
                }
                
                setError(errorMessage);
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'Connection Error',
                    detail: errorMessage,
                    life: 5000
                });
                return false;
            }

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error while connecting to server';
            setError(errorMessage);
            toastRef.current?.show({
                severity: 'error',
                summary: 'Connection Error',
                detail: errorMessage,
                life: 5000
            });
            return false;
        } finally {
            setIsConnecting(false);
        }
    };

    return {
        error,
        connectServer,
        toastRef
    };
}
