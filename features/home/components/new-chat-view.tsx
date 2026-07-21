"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { ChatEmpty } from "@/features/conversation/components/chat-empty";
import { ChatComposer } from "@/features/conversation/components/chat-composer";
import { startNewChat } from "@/features/home/actions/start-new-chat";

/**
 * Landing view for new chats — shown at "/" without eagerly creating a
 * DB record.  A conversation is only persisted once the user sends their
 * first message, eliminating ghost empty-chat entries in the sidebar.
 */
export function NewChatView() {
    const router = useRouter();
    const [isSending, setIsSending] = React.useState(false);

    async function handleSend(text: string) {
        if (!text.trim() || isSending) return;
        setIsSending(true);
        try {
            // Create the conversation lazily — only on first message
            const { conversationId, branchId } = await startNewChat();
            // Navigate to the new conversation, carrying the first message as a
            // query param so the ConversationPage can auto-send it on mount.
            router.push(
                `/c/${conversationId}?branch=${branchId}&firstMessage=${encodeURIComponent(text)}`
            );
        } catch (err) {
            toast.error("Could not start a new chat. Please try again.");
            setIsSending(false);
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
                <Separator orientation="vertical" className="mx-2 h-4 bg-border/40" />
                <h1 className="flex-1 truncate text-sm font-semibold tracking-tight text-foreground/90">
                    New Chat
                </h1>
            </header>

            <ChatEmpty />

            <ChatComposer
                onSend={handleSend}
                isSending={isSending}
                autoFocus
            />
        </div>
    );
}
