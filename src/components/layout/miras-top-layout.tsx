'use client';

import { Menubar } from 'primereact/menubar';
import { MenuItem } from 'primereact/menuitem';
import { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { TieredMenu } from 'primereact/tieredmenu';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export interface MirasTopLayoutProps {
    onOpenProjectSelector: () => void;
    onCloseProject: () => void;
    projectName?: string;
    onTestCasparCG: () => void;
}

export function MirasTopLayout({ 
    onOpenProjectSelector, 
    onCloseProject,
    projectName,
    onTestCasparCG 
}: MirasTopLayoutProps) {
    const menuRef = useRef<TieredMenu>(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const appName = process.env.NEXT_PUBLIC_MIRAS_APP_NAME || 'Mirâs';

    const fileMenuItems: MenuItem[] = [
        {
            label: 'Open Project',
            icon: 'pi pi-folder-open',
            command: () => {
                onOpenProjectSelector();
                menuRef.current?.hide();
            }
        },
        {
            label: 'Close Project',
            icon: 'pi pi-times',
            command: () => {
                onCloseProject();
                menuRef.current?.hide();
            },
            disabled: !projectName
        },
        {
            separator: true
        },
        {
            label: 'Test CasparCG',
            icon: 'pi pi-server',
            command: () => {
                onTestCasparCG();
                // No cerramos el menú aquí para permitir múltiples pruebas
            }
        }
    ];

    const menuData = [{
        menu: (
            <div className="relative">
                <Button
                    icon="pi pi-bars"
                    text
                    severity="secondary"
                    onClick={(e) => menuRef.current?.toggle(e)}
                    aria-controls="app-menu"
                    aria-haspopup="true"
                    aria-expanded={isMenuVisible}
                    aria-label="Application menu"
                />
                <TieredMenu 
                    model={fileMenuItems} 
                    popup 
                    ref={menuRef} 
                    id="app-menu"
                    onHide={() => setIsMenuVisible(false)}
                    onShow={() => setIsMenuVisible(true)}
                    autoZIndex
                />
            </div>
        ),
        app: (
            <>
                <span className="text-sm font-bold">{appName}</span>
                <span className="text-xs text-500" style={{ fontSize: '0.5rem', marginLeft: '0.5rem' }}>{process.env.NEXT_PUBLIC_MIRAS_APP_VERSION}</span>
            </>
        ),
        project: projectName ? (
            <span className="text-sm font-bold pl-2">{'- ' + projectName}</span>
        ) : null
    }];

    const menuStart = (
        <DataTable 
            value={menuData}
            className="border-none p-0"
            showGridlines={false}
        >
            <Column field="menu" header="" style={{ width: 'min-content', padding: 0 }} />
            <Column field="app" header="" style={{ width: 'min-content', padding: 0, paddingRight: '0.5rem' }} />
            <Column field="project" header="" style={{ width: 'min-content', padding: 0 }} />
        </DataTable>
    );

    return (
        <Menubar 
            start={menuStart}
            className="border-noround"
        />
    );
}
