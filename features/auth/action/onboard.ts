"use server"

import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function onBoard() {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        throw new Error("Unauthorized");
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    // 1. Try to find user by clerkId
    const userByClerkId = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id }
    });

    if (userByClerkId) {
        return prisma.user.update({
            where: { id: userByClerkId.id },
            data: {
                email,
                firstname: clerkUser.firstName,
                lastname: clerkUser.lastName,
                imageUrl: clerkUser.imageUrl
            }
        });
    }

    // 2. If not found by clerkId, check if email already exists in DB
    if (email) {
        const userByEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (userByEmail) {
            return prisma.user.update({
                where: { id: userByEmail.id },
                data: {
                    clerkId: clerkUser.id,
                    firstname: clerkUser.firstName,
                    lastname: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl
                }
            });
        }
    }

    // 3. Create new user record
    return prisma.user.create({
        data: {
            clerkId: clerkUser.id,
            email,
            firstname: clerkUser.firstName,
            lastname: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        }
    });
}