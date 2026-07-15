import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
};

function createPrismaClient() {
    const url = process.env.DATABASE_URL;
    if(!url) {
        throw new Error("Database url is not set")
    }

    const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
    return new PrismaClient({adapter})
} 

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if(process.env.DATABASE_URL !== "prodution") {
    globalForPrisma.prisma = prisma
}
