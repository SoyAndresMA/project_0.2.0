'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { OrderList } from 'primereact/orderlist';
import { useMirasProject } from '@/hooks/use-miras-project';

interface Project {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

interface MirasProjectSelectorProps {
    visible: boolean;
    onHide: () => void;
    onSelect: (projectId: string) => void;
}

export function MirasProjectSelector({ visible, onHide, onSelect }: MirasProjectSelectorProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadProjects();
        }
    }, [visible]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error('Failed to load projects');
            }
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (projectId: string) => {
        onSelect(projectId);
        onHide();
    };

    const itemTemplate = (project: Project) => {
        return (
            <div className="flex flex-col p-3 w-full cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0" onClick={() => handleSelect(project.id)}>
                <table className="w-full border-separate border-spacing-0">
                    <tbody>
                        <tr>
                            <td className="w-[70%] align-top">
                                <h3 className="text-xl font-bold m-0">{project.name}</h3>
                            </td>
                            <td className="w-[30%] align-top">
                                <div className="text-[11px] text-gray-500 text-right">
                                    <div className="text-right">Created: {new Date(project.created_at).toLocaleDateString()}</div>
                                    <div className="text-right">Updated: {new Date(project.updated_at).toLocaleDateString()}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2}>
                                <p className="text-gray-600 m-0 text-sm mt-2">{project.description}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Dialog
            header="Select Project"
            visible={visible}
            onHide={onHide}
            style={{ width: '50vw' }}
            modal
            className="p-fluid"
        >
            <OrderList
                value={projects}
                itemTemplate={itemTemplate}
                filter
                filterBy="name,description"
                className="w-full miras-project-selector"
                listStyle={{ maxHeight: '70vh' }}
                dragdrop={false}
                loading={loading.toString()}
                header=""
            />
            <style jsx global>{`
                .miras-project-selector .p-orderlist-controls {
                    display: none;
                }
                .miras-project-selector .p-orderlist-filter-container {
                    border: none;
                    padding: 0;
                    margin-bottom: 1rem;
                }
                .miras-project-selector .p-orderlist-list {
                    border: none;
                }
                .miras-project-selector .p-orderlist-item {
                    border-bottom: 1px solid #e5e7eb;
                }
                .miras-project-selector .p-orderlist-item:last-child {
                    border-bottom: none;
                }
            `}</style>
        </Dialog>
    );
}
