"use server"

import { isTextUIPart, type UIMessage } from "ai"
import type { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"
import { getOrCreateDefaultBranch } from "@/features/conversation/actions/branch-actions"

function getMessageText(message: UIMessage) {
    return message.parts.filter(isTextUIPart).map((part) => part.text).join("")
}

function toUIMessageParts(parts: Prisma.JsonValue | null, content: string): UIMessage["parts"] {
    const stored = parts as UIMessage["parts"] | null;
    if (Array.isArray(stored) && stored.length > 0) {
        return stored
    }
    return [{ type: "text", text: content }]
}

export async function loadChatMessages(conversationId: string, branchId?: string): Promise<UIMessage[]> {
    const branch = branchId
        ? await prisma.branch.findUniqueOrThrow({ where: { id: branchId } })
        : await getOrCreateDefaultBranch(conversationId)

    if (!branch.leafMessageId) return []

    const chain: Array<{ id: string; role: string; parts: Prisma.JsonValue | null; content: string; parentId: string | null }> = []
    let currentId: string | null = branch.leafMessageId

    while (currentId) {
        const row: { id: string; role: string; parts: Prisma.JsonValue | null; content: string; parentId: string | null } | null =
            await prisma.message.findUnique({ where: { id: currentId } })
        if (!row) break
        chain.push(row)
        currentId = row.parentId
    }

    chain.reverse()

    return chain.map((row) => ({
        id: row.id,
        role: row.role === "ASSISTANT" ? "assistant" : "user",
        parts: toUIMessageParts(row.parts, row.content),
    }))
}

type SaveChatMessagesOptions = {
    updateTitle?: boolean;
    branchId?: string;
};

export async function saveChatMessages(conversationId: string, messages: UIMessage[], options: SaveChatMessagesOptions = {}) {
    const { updateTitle = true, branchId } = options;

    const branch = branchId
        ? await prisma.branch.findUniqueOrThrow({ where: { id: branchId } })
        : await getOrCreateDefaultBranch(conversationId)

    let previousId: string | null = branch.leafMessageId

    for (const message of messages) {
        if (message.role === "system") continue;

        const content = getMessageText(message);
        const role = message.role === "assistant" ? "ASSISTANT" : "USER"

        await prisma.message.upsert({
            where: { id: message.id },
            create: {
                id: message.id,
                conversationId,
                role,
                status: "COMPLETE",
                content,
                parts: message.parts as Prisma.InputJsonValue,
                parentId: previousId,
            },
            update: {
                content,
                parts: message.parts as Prisma.InputJsonValue,
                status: "COMPLETE",
            },
        });

        previousId = message.id;
    }

    await prisma.branch.update({
        where: { id: branch.id },
        data: { leafMessageId: previousId },
    })

    const conversation = await prisma.conversation.findUniqueOrThrow({
        where: { id: conversationId },
        select: { title: true },
    });

    const firstUser = messages.find((message) => message.role === "user");
    const firstUserText = firstUser ? getMessageText(firstUser).trim() : "";

    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            lastMessageAt: new Date(),
            title:
                updateTitle && conversation.title === "New Chat" && firstUserText
                    ? firstUserText.slice(0, 48)
                    : conversation.title,
        },
    });
}