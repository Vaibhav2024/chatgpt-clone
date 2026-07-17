"use server"

import { requireUser } from "@/features/auth/action/require-user"
import { prisma } from "@/lib/db";

export async function startNewChat() {
    const user = await requireUser();

    // Create the conversation and its default branch in one transaction
    const conversation = await prisma.conversation.create({
        data: {
            userId: user.id,
            title: "New Chat",
            branches: {
                create: { name: "Main" }
            }
        },
        include: { branches: true }
    })

    const branchId = conversation.branches[0].id;

    // Return both so the caller can build the full URL with the branch param
    return { conversationId: conversation.id, branchId };
}