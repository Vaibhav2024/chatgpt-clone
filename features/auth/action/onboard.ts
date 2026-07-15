"use server"

import { currentUser } from "@clerk/nextjs/server"
import {prisma} from "@/lib/db"
import type {User} from "@/lib/generated/prisma/client"

export async function onBoard() {
    const clerkUser = await currentUser();

    if(!clerkUser) {
        throw new Error("Unauthorized")
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null

    return prisma.user.upsert({
        where: {clerkId: clerkUser.id},
        create: {
            clerkId: clerkUser.id,
            email,
            firstname: clerkUser.firstName,
            lastname: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        },
        update: {
            email,
            firstname: clerkUser.firstName,
            lastname: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl
        }
    })
}