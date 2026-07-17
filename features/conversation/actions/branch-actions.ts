"use server"

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";

/** Lists all branches for a conversation ordered by creation time. */
export async function listBranches(conversationId: string) {
    return prisma.branch.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });
}

/** Returns the single "Main" branch for a conversation, creating it if it doesn't exist. */
export async function getOrCreateDefaultBranch(conversationId: string) {
    const existing = await prisma.branch.findFirst({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });

    if (existing) return existing;

    return prisma.branch.create({
        data: { conversationId, name: "Main" },
    });
}

/** Creates a new conversation as a branch from a specific message, cloning the message chain up to that message. */
export async function createBranch(conversationId: string, fromMessageId: string) {
    const user = await requireUser();

    // Verify ownership and get the original conversation title
    const originalConversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
    });
    if (!originalConversation) throw new Error("Conversation not found");

    // 1. Create a new independent conversation
    const newConversation = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: `Branch: ${originalConversation.title}`,
            branches: {
                create: {
                    name: "Main",
                }
            }
        },
        include: {
            branches: true
        }
    });

    const newBranch = newConversation.branches[0];

    // 2. Fetch the chain of messages starting from fromMessageId back to the root
    const chain: any[] = [];
    let currentId: string | null = fromMessageId;

    while (currentId) {
        const row: { id: string; role: any; status: any; content: string; parts: Prisma.JsonValue | null; parentId: string | null } | null =
            await prisma.message.findUnique({ where: { id: currentId } });
        if (!row) break;
        chain.push(row);
        currentId = row.parentId;
    }
    chain.reverse(); // Order from oldest to newest (up to the branched message)

    // 3. Clone the messages into the new conversation
    const idMap = new Map<string, string>(); // Maps original message ID -> cloned message ID
    let clonedLeafMessageId: string | null = null;

    for (const msg of chain) {
        // Generate a unique ID for the cloned message
        const clonedMsgId = "cloned_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const clonedParentId = msg.parentId ? idMap.get(msg.parentId) ?? null : null;

        await prisma.message.create({
            data: {
                id: clonedMsgId,
                conversationId: newConversation.id,
                role: msg.role,
                status: msg.status,
                content: msg.content,
                parts: msg.parts ?? undefined,
                parentId: clonedParentId,
            }
        });

        idMap.set(msg.id, clonedMsgId);
        clonedLeafMessageId = clonedMsgId;
    }

    // 4. Set the leafMessageId of the new branch to the cloned leaf message ID
    if (clonedLeafMessageId) {
        await prisma.branch.update({
            where: { id: newBranch.id },
            data: { leafMessageId: clonedLeafMessageId }
        });
    }

    revalidatePath("/");
    revalidatePath(`/c/${newConversation.id}`);
    
    return {
        conversationId: newConversation.id,
        branchId: newBranch.id,
    };
}

/** Renames a branch. */
export async function renameBranch(branchId: string, name: string) {
    const user = await requireUser();

    const branch = await prisma.branch.findUniqueOrThrow({
        where: { id: branchId },
        include: { conversation: true },
    });

    if (branch.conversation.userId !== user.id) {
        throw new Error("Forbidden");
    }

    const updated = await prisma.branch.update({
        where: { id: branchId },
        data: { name: name.trim() || "Branch" },
    });

    revalidatePath(`/c/${branch.conversationId}`);
    return updated;
}

/** Deletes a branch. Will not delete if it's the last branch. */
export async function deleteBranch(branchId: string) {
    const user = await requireUser();

    const branch = await prisma.branch.findUniqueOrThrow({
        where: { id: branchId },
        include: { conversation: true },
    });

    if (branch.conversation.userId !== user.id) {
        throw new Error("Forbidden");
    }

    const branchCount = await prisma.branch.count({
        where: { conversationId: branch.conversationId },
    });

    if (branchCount <= 1) {
        throw new Error("Cannot delete the last branch");
    }

    await prisma.branch.delete({ where: { id: branchId } });

    revalidatePath(`/c/${branch.conversationId}`);
    return { id: branchId };
}
