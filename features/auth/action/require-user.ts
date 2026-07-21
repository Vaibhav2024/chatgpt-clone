"use server"

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { onBoard } from "./onboard";

export async function requireUser() {
    const { userId } = await auth.protect();

    let user = await prisma.user.findUnique({
        where: {clerkId: userId}
    })

    if(!user) {
        user = await onBoard();
    }

    return user;
}