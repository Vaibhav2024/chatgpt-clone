// features/conversation/components/chat-messages.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Globe, Check, GitBranchPlus } from "lucide-react";
import { createBranch } from "@/features/conversation/actions/branch-actions";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../utils/query-keys";

function MessagePart({ part }: { part: any }) {
    if (part.type === "text") {
        return <p className="whitespace-pre-wrap">{part.text}</p>;
    }

    // Tool invocation part shape (AI SDK v5/v6): part.type === "tool-webSearch"
    if (part.type === "tool-webSearch" || part.type === "tool-invocation") {
        const state = part.state ?? part.toolInvocation?.state;
        const input = part.input ?? part.toolInvocation?.args;
        const output = part.output ?? part.toolInvocation?.result;

        if (state === "input-streaming" || state === "input-available" || state === "call") {
            return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border px-3 py-2 my-1 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching the web{input?.query ? ` for "${input.query}"` : "..."}</span>
                </div>
            );
        }

        if (state === "output-available" || state === "result") {
            return (
                <div className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 my-1 bg-muted/50">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">{output?.query ?? input?.query}</span>
                    <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />
                    <span className="text-xs text-muted-foreground">
                        {output?.results?.length ?? 0} sources
                    </span>
                </div>
            );
        }
    }

    return null;
}

function BranchFromHereButton({
    conversationId,
    messageId,
}: {
    conversationId: string;
    messageId: string;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const result = await createBranch(conversationId, messageId);
            
            // Invalidate conversations list query so that the sidebar refreshes instantly
            await queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });

            // Redirect to the newly created conversation
            router.push(`/c/${result.conversationId}?branch=${result.branchId}`);
            router.refresh();
        } catch (err) {
            console.error("[BranchFromHereButton] createBranch failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Branch from here"
        >
            {isLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <GitBranchPlus className="h-3.5 w-3.5" />}
            Branch from here
        </button>
    );
}

export function ChatMessages({
    messages,
    conversationId,
    activeBranchId,
}: {
    messages: UIMessage[];
    conversationId: string;
    activeBranchId: string;
}) {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={cn(
                        "group flex flex-col gap-1",
                        message.role === "user" ? "items-end" : "items-start"
                    )}
                >
                    <div
                        className={cn(
                            "rounded-lg px-4 py-2 max-w-[80%]",
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                    >
                        {message.parts.map((part, i) => (
                            <MessagePart key={i} part={part} />
                        ))}
                    </div>

                    <BranchFromHereButton conversationId={conversationId} messageId={message.id} />
                </div>
            ))}
        </div>
    );
}