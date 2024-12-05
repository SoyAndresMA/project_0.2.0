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
            switch (type) {
                case SSEEventType.SERVER_STATE_CHANGED:
                    if (data.state) {
                        setServers(prevServers => 
                            prevServers.map(server => 
                                server.id === data.entityId 
                                    ? { ...server, ...data.state }
                                    : server
                            )
                        );
                    }
                    break;
                case SSEEventType.SERVER_LOG:
                    if (data.message) {
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
            console.error('SSE Error:', error);
            toastRef.current?.show({
                severity: 'error',
                summary: 'Connection Error',
                detail: 'Lost connection to server',
                life: 3000
            });
        }
    });
    const [servers, setServers] = useState<any[]>([]);
    const { error, connectServer, toastRef } = useMirasCasparCGServer();

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

    }, []);

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
        return (
            <Button
                icon={server.status === 'CONNECTED' ? 'pi pi-power-off' : 'pi pi-play'}
                className={`p-button-${server.status === 'CONNECTED' ? 'danger' : 'success'} p-button-sm`}
                onClick={async () => {
                    await connectServer(server.id);
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
