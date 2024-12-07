'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef, useState, useEffect } from 'react';
import { useSSE } from '@/hooks/use-sse';
import { SSEEventType } from '@/lib/sse/events';
import { useMirasCasparCGServer } from '@/hooks/use-miras-casparcg-server';

export function TestCasparCG() {
    const { onEvent } = useSSE({
        onEvent: (type, data) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[TestCasparCG] Received event:', { type, data });
            }
            
            switch (type) {
                case SSEEventType.SERVER_STATE_CHANGED:
                    if (data.state?.status) {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('[TestCasparCG] Server state changed:', { 
                                entityId: data.entityId, 
                                newStatus: data.state.status,
                                timestamp: data.timestamp
                            });
                        }
                        
                        setServers(prevServers => 
                            prevServers.map(server => 
                                server.id === data.entityId 
                                    ? { ...server, status: data.state.status }
                                    : server
                            )
                        );
                    }
                    break;
                    
                case SSEEventType.SERVER_LOG:
                    if (data.message) {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('[TestCasparCG] Server log:', {
                                entityId: data.entityId,
                                level: data.level,
                                message: data.message,
                                timestamp: data.timestamp
                            });
                        }
                        
                        toastRef.current?.show({
                            severity: data.level,
                            summary: 'Server Log',
                            detail: data.message,
                            life: 3000
                        });
                    }
                    break;
            }
        },
        onError: (error) => {
            console.error('[TestCasparCG] SSE Error:', error);
            toastRef.current?.show({
                severity: 'error',
                summary: 'Connection Error',
                detail: 'Lost connection to server',
                life: 3000
            });
        },
        debug: process.env.NODE_ENV === 'development'
    });
    const [servers, setServers] = useState<any[]>([]);
    const { error, connectServer, disconnectServer, toastRef } = useMirasCasparCGServer();

    // Suscribirse a eventos SSE
    useEffect(() => {
        // Cargar servidores inicialmente
        fetch('/api/casparcg-servers')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.servers)) {
                    setServers(data.servers);
                } else {
                    setServers([]);
                }
            })
            .catch(err => {
                console.error('Error loading servers:', err);
                toastRef.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load servers',
                    life: 3000
                });
                setServers([]);
            });

    }, [toastRef]);

    const statusBodyTemplate = (server: any) => {
        const severity = server.status === 'CONNECTED' ? 'success' : 
                        server.status === 'CONNECTING' ? 'warning' : 'danger';
        return (
            <span className={`status-badge status-${severity.toLowerCase()}`}>
                {server.status}
            </span>
        );
    };

    const actionsBodyTemplate = (server: any) => {
        const isConnected = server.status === 'CONNECTED';
        
        return (
            <Button
                icon={isConnected ? 'pi pi-power-off' : 'pi pi-play'}
                className={`p-button-${isConnected ? 'danger' : 'success'} p-button-sm`}
                onClick={async () => {
                    if (isConnected) {
                        await disconnectServer(server.id);
                    } else {
                        await connectServer(server.id);
                    }
                }}
            />
        );
    };

    return (
        <div className="card">
            <Toast ref={toastRef} />
            <DataTable
                value={servers}
                tableStyle={{ minWidth: '50rem' }}
                scrollable
                scrollHeight="400px"
                className="mt-4"
            >
                <Column field="name" header="Name" />
                <Column field="host" header="Host" />
                <Column field="port" header="Port" />
                <Column field="status" header="Status" body={statusBodyTemplate} />
                <Column header="Actions" body={actionsBodyTemplate} />
            </DataTable>
        </div>
    );
}
