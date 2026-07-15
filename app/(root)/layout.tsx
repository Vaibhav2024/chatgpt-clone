import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { onBoard } from '@/features/auth/action/onboard';

const RootGroupLayout = async ({ children }: { children: React.ReactNode }) => {
    await auth.protect()
    await onBoard()
    return (
        <div>
            {children}
        </div>
    )
}

export default RootGroupLayout