'use client';

import { ScrollPanel } from 'primereact/scrollpanel';
import { MirasEvents } from '@/components/events/miras-events';
import { MirasProjectStateFormatted } from '@/hooks/use-miras-project';

interface MirasLeftLayoutProps {
   projectState: MirasProjectStateFormatted;
   onEventSelect: (eventId: string) => void;
}

export function MirasLeftLayout({ projectState, onEventSelect }: MirasLeftLayoutProps) {
   const containerStyle = { 
       maxWidth: '1550px',
       width: '100%',
       height: '100%'
   };

   if (!projectState) {
       return <ScrollPanel className="w-full h-full" style={containerStyle}>Loading...</ScrollPanel>;
   }

   if (!projectState.events || Object.keys(projectState.events).length === 0) {
       return <ScrollPanel className="w-full h-full" style={containerStyle}>No events available</ScrollPanel>;
   }

   return (
       <ScrollPanel className="w-full h-full" style={containerStyle}>
           <MirasEvents projectState={projectState} onEventSelect={onEventSelect} />
       </ScrollPanel>
   );
}