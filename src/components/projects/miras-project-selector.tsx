'use client';

import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { useSSE } from '@/hooks/use-sse';
import { SSEEventType } from '@/lib/sse/events';

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
    const [searchValue, setSearchValue] = useState('');
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

    useSSE({
        onEvent: (type: SSEEventType, data: any) => {
            switch (type) {
                case SSEEventType.PROJECT_CREATED:
                    setProjects(prev => [...prev, data.entity]);
                    break;
                case SSEEventType.PROJECT_UPDATED:
                    setProjects(prev => prev.map(p => p.id === data.entity.id ? data.entity : p));
                    break;
                case SSEEventType.PROJECT_DELETED:
                    setProjects(prev => prev.filter(p => p.id !== data.projectId));
                    break;
            }
        }
    });

    useEffect(() => {
        if (visible) {
            loadProjects();
        }
    }, [visible]);

    useEffect(() => {
        const filtered = projects.filter(project => 
            project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            project.description.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredProjects(filtered);
    }, [searchValue, projects]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list' })
            });
            if (!response.ok) {
                throw new Error('Failed to load projects');
            }
            const data = await response.json();
            setProjects(data.projects);
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
            <div 
                className="project-card"
                onClick={() => handleSelect(project.id)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-900 m-0 project-title">{project.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-600">
                        <span className="flex items-center gap-1">
                            <i className="pi pi-calendar"></i>
                            {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <i className="pi pi-clock"></i>
                            {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <p className="text-600 text-sm m-0 line-clamp-2">{project.description}</p>
            </div>
        );
    };

    return (
        <Dialog
            header="Select Project"
            visible={visible}
            onHide={onHide}
            style={{ width: '700px', maxWidth: '95vw' }}
            modal
            className="p-fluid project-selector-dialog"
        >
            <div className="mb-4">
                <span className="p-input-icon-left w-full">
                    <i className="pi pi-search" />
                    <InputText
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search by name or description..."
                        className="w-full p-inputtext-sm"
                    />
                </span>
            </div>
            {loading ? (
                <div className="flex items-center justify-center p-6">
                    <i className="pi pi-spin pi-spinner text-2xl text-primary mr-2"></i>
                    <span className="text-600">Loading projects...</span>
                </div>
            ) : (
                <DataView
                    value={filteredProjects}
                    itemTemplate={itemTemplate}
                    paginator={filteredProjects.length > 10}
                    rows={10}
                    emptyMessage="No projects found"
                />
            )}
            <style global jsx>{`
                .project-selector-dialog .p-dialog-content {
                    padding: 1.5rem;
                }

                .project-selector-dialog .p-dataview .p-dataview-content {
                    border: none !important;
                    padding: 0 !important;
                    background: transparent !important;
                }

                .project-selector-dialog .p-paginator {
                    background: transparent !important;
                    border: none !important;
                }

                .project-selector-dialog .p-inputtext {
                    padding: 0.75rem 1rem;
                }

                .project-selector-dialog .p-dialog-header {
                    padding: 1.5rem;
                    background: var(--surface-card);
                    border-bottom: 1px solid var(--surface-border);
                }

                .project-selector-dialog .p-dialog-footer {
                    background: transparent !important;
                    border: none !important;
                }

                .project-card {
                    padding: 1rem;
                    margin-bottom: 1rem;
                    cursor: pointer;
                    border-radius: 12px;
                    background: var(--surface-card);
                    border: 1px solid var(--surface-border);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(8px);
                }

                .project-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: var(--primary-color);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 0;
                }

                .project-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                    border-color: var(--primary-500);
                    background: linear-gradient(145deg, var(--surface-card), var(--surface-ground));
                }

                .project-card:hover::before {
                    opacity: 0.03;
                }

                .project-card:active {
                    transform: translateY(0);
                    transition: all 0.1s ease-in-out;
                }
                
                .project-card > * {
                    position: relative;
                    z-index: 1;
                }

                .project-title {
                    position: relative;
                    display: inline-block;
                }

                .project-title::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -2px;
                    left: 0;
                    background: linear-gradient(90deg, var(--primary-500), var(--primary-300));
                    transition: width 0.4s ease;
                }

                .project-card:hover .project-title::after {
                    width: 100%;
                }

                .project-card .pi {
                    transition: transform 0.3s ease;
                }

                .project-card:hover .pi {
                    transform: scale(1.1);
                    color: var(--primary-500);
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                        filter: blur(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                        filter: blur(0);
                    }
                }

                .p-dataview-content > div > div {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </Dialog>
    );
}