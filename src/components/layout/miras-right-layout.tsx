'use client';
import { TestCasparCG } from '../test/test-casparcg';

export interface MirasRightLayoutProps {
    showTestCasparCG?: boolean;
}

export const MirasRightLayout = ({ 
    showTestCasparCG = false
}: MirasRightLayoutProps) => {
    if (!showTestCasparCG) {
        return null;
    }

    return (
        <aside className="right-panel w-96 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-gray-800">CasparCG Servers</h2>
                <TestCasparCG />
            </div>
        </aside>
    );
};
