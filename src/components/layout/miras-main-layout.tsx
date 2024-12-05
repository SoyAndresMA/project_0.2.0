'use client';

import { useState } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { useMirasProject } from '@/hooks/use-miras-project';
import { MirasProjectSelector } from '@/components/projects/miras-project-selector';
import { MirasTopLayout } from '@/components/layout/miras-top-layout';
import { MirasLeftLayout } from '@/components/layout/miras-left-layout';
import { MirasRightLayout } from '@/components/layout/miras-right-layout';
import { SSEProvider } from '@/contexts/sse-context';

export function MirasMainLayout() {
    const { projectState, openProject, closeProject, isLoading } = useMirasProject();
    const [projectSelectorVisible, setProjectSelectorVisible] = useState(false);
    const [showTestCasparCG, setShowTestCasparCG] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const selectedEvent = selectedEventId && projectState?.events?.[selectedEventId]?.data || null;

    return (
        <SSEProvider>
            <div className="miras-layout">
                <MirasTopLayout 
                    onOpenProjectSelector={() => setProjectSelectorVisible(true)}
                    onCloseProject={closeProject}
                    projectName={projectState?.name}
                    onTestCasparCG={() => setShowTestCasparCG(true)}
                />
                
                <div className="miras-content">
                    <Splitter 
                        className="miras-splitter" 
                        layout="horizontal"
                        stateKey="miras-splitter"
                        stateStorage="local"
                        style={{ minWidth: 0 }}
                    >
                        <SplitterPanel 
                            className="flex align-items-stretch" 
                            size={384} 
                            minSize={384} 
                            maxSize={1550}
                            style={{ maxWidth: '1550px' }}
                        >
                            {isLoading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <i className="pi pi-spin pi-spinner text-2xl"></i>
                                        <span>Loading project...</span>
                                    </div>
                                </div>
                            ) : projectState ? (
                                <MirasLeftLayout 
                                    projectState={projectState}
                                    onEventSelect={setSelectedEventId}
                                />
                            ) : null}
                        </SplitterPanel>
                        <SplitterPanel className="flex align-items-stretch">
                            {(projectState || showTestCasparCG) && (
                                <MirasRightLayout 
                                    showTestCasparCG={showTestCasparCG}
                                    selectedEvent={selectedEvent}
                                    isLoading={isLoading}
                                />
                            )}
                        </SplitterPanel>
                    </Splitter>
                </div>

                <MirasProjectSelector
                    visible={projectSelectorVisible}
                    onHide={() => setProjectSelectorVisible(false)}
                    onSelect={openProject}
                />
            </div>
        </SSEProvider>
    );
}
