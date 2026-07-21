import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { onBoard } from '@/features/auth/action/onboard';
import { ChatShell } from '@/features/conversation/components/chat-shell';

const RootGroupLayout = async ({ children }: { children: React.ReactNode }) => {
    await auth.protect()
    // Attempt to onboard the user. After a fresh sign-up Clerk's session token
    // may not have fully propagated on the very first server request, so we
    // swallow errors here. requireUser() inside every action will lazily retry
    // onboarding once the session is ready.
    try {
        await onBoard()
    } catch {
        // Transient Clerk session propagation — safe to ignore here.
    }
    return (
        <ChatShell>
            {children}
        </ChatShell>
    )
}

export default RootGroupLayout