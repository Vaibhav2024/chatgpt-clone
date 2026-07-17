// features/conversation/components/conversation-view.tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
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
};

export const ConversationView = ({
    conversationId,
    branches,
    activeBranch,
    initialMessages,
}: ConversationViewProps) => {
    const queryClient = useQueryClient();
    const { data: conversations } = useConversations();

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

    const title =
        conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <h1 className="flex-1 truncate text-sm font-medium">{title}</h1>
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