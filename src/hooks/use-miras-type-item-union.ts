import { useState, useEffect } from 'react';
import { TypeItemUnion } from '@/lib/db/types';

export function useMirasTypeItemUnion(typeItemUnionId: string | undefined) {
    const [typeItemUnion, setTypeItemUnion] = useState<TypeItemUnion | null>(null);

    useEffect(() => {
        if (!typeItemUnionId) {
            setTypeItemUnion(null);
            return;
        }

        fetch(`/api/type-item-unions/${typeItemUnionId}`)
            .then(response => response.json())
            .then(data => setTypeItemUnion(data))
            .catch(error => {
                console.error('Error fetching TypeItemUnion:', error);
                setTypeItemUnion(null);
            });
    }, [typeItemUnionId]);

    return typeItemUnion;
}
