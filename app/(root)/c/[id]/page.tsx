// app/(root)/c/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { listBranches, getOrCreateDefaultBranch } from "@/features/conversation/actions/branch-actions";
import { loadChatMessages } from "@/features/ai/actions/chat-store";
import { getConversation } from "@/features/conversation/actions/conversation-actions";
import { ConversationView } from "@/features/conversation/components/conversation-view";

export default async function ConversationPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ branch?: string; firstMessage?: string }>;
}) {
    const { id: conversationId } = await params;
    const { branch: activeBranchId, firstMessage } = await searchParams;

    // Guard against stale /c/undefined URLs
    if (!conversationId || conversationId === "undefined") {
        notFound();
    }

    // Verify the conversation exists and belongs to the current user
    try {
        await getConversation(conversationId);
    } catch {
        notFound();
    }

    // If no branch param, get/create the default branch and redirect with it
    if (!activeBranchId) {
        const defaultBranch = await getOrCreateDefaultBranch(conversationId);
        redirect(`/c/${conversationId}?branch=${defaultBranch.id}`);
    }

    const [branches, messages] = await Promise.all([
        listBranches(conversationId),
        loadChatMessages(conversationId, activeBranchId),
    ]);

    // activeBranch must always be defined — fall back to creating the default if needed
    const activeBranch =
        branches.find((b) => b.id === activeBranchId) ??
        (await getOrCreateDefaultBranch(conversationId));

    return (
        <ConversationView
            key={`${conversationId}-${activeBranch.id}`}
            conversationId={conversationId}
            branches={branches}
            activeBranch={activeBranch}
            initialMessages={messages}
            firstMessage={firstMessage}
        />
    );
}