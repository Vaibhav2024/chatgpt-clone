"use server"

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { onBoard } from "./onboard";

export async function requireUser() {
    const { userId } = await auth.protect();

    let user = await prisma.user.findUnique({
        where: { clerkId: userId }
    })

    if (!user) {
        // After fresh sign-up Clerk's session token may not have propagated yet.
        // Attempt onboarding; if it fails transiently, throw a clear message
        // so callers can surface it cleanly instead of crashing.
        try {
            user = await onBoard();
        } catch (err) {
            throw new Error(
                "Could not set up your account. Please refresh the page.",
                { cause: err }
            );
        }
    }

    return user;
}