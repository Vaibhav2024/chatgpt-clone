// features/conversation/components/conversation-view.tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { ChatMessages } from "./chat-messages";
import { ChatEmpty } from "./chat-empty";
import { ChatComposer } from "./chat-composer";
import { BranchSwitcher } from "./branch-switcher";
import { useConversations } from "../hooks/use-conversation";
import { queryKeys } from "../utils/query-keys";

type ConversationViewProps = {
    conversationId: string;
    branches: any[];
    activeBranch: any;
    initialMessages: UIMessage[];
    /** When set, the message is auto-sent on mount (lazy new-chat flow). */
    firstMessage?: string;
};

export const ConversationView = ({
    conversationId,
    branches,
    activeBranch,
    initialMessages,
    firstMessage,
}: ConversationViewProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { data: conversations } = useConversations();
    const hasSentFirstMessage = useRef(false);

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                prepareSendMessagesRequest: ({ messages }) => ({
                    body: {
                        id: conversationId,        // conversation id — what the route expects
                        message: messages.at(-1),
                        branchId: activeBranch.id,
                    },
                }),
            }),
        [conversationId, activeBranch.id]
    );

    const { messages, sendMessage, status } = useChat({
        id: activeBranch.id, // remounts/resets state when switching branches
        messages: initialMessages,
        transport,
        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    // Auto-send the first message when navigating from the new-chat home page.
    // We wait until the chat is ready and guard with a ref to prevent double-sends.
    useEffect(() => {
        if (
            firstMessage &&
            !hasSentFirstMessage.current &&
            status === "ready"
        ) {
            hasSentFirstMessage.current = true;
            void sendMessage({ text: firstMessage });
            // Clean up the URL so refreshing the page doesn't re-send the message
            router.replace(`/c/${conversationId}?branch=${activeBranch.id}`);
        }
    }, [firstMessage, status, sendMessage, router, conversationId, activeBranch.id]);

    const title =
        conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
                <Separator orientation="vertical" className="mx-2 h-4 bg-border/40" />
                <h1 className="flex-1 truncate text-sm font-semibold tracking-tight text-foreground/90">{title}</h1>
                {branches.length > 0 && (
                    <BranchSwitcher
                        conversationId={conversationId}
                        branches={branches}
                        activeBranch={activeBranch}
                    />
                )}
            </header>

            {messages.length === 0 ? (
                <ChatEmpty />
            ) : (
                <ChatMessages
                    messages={messages}
                    conversationId={conversationId}
                    activeBranchId={activeBranch.id}
                />
            )}

            <ChatComposer
                onSend={(text) => {
                    void sendMessage({ text });
                }}
                isSending={status !== "ready"}
                autoFocus
            />
        </div>
    );
};