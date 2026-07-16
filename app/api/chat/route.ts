import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {convertToModelMessages, createIdGenerator, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage} from "ai"
import { ratelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
    await auth.protect()

    const {message, id} : {message: UIMessage, id: string} = await req.json();

    if(!message || !id) {
        return new Response("Missing message or conversation id", {status: 400})
    }

    const user = await requireUser();

    try {
        const { success, limit, reset, remaining } = await ratelimit.limit(user.id);
        if (!success) {
            return new Response("Too Many Requests. Please wait a minute and try again.", {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": remaining.toString(),
                    "X-RateLimit-Reset": reset.toString(),
                }
            });
        }
    } catch (error) {
        console.error("Rate limiting check failed, allowing request:", error);
    }

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    })

    if (!conversation) {
        return new Response("Conversation not found", {status: 404})
    }

    const previousMessages = await loadChatMessages(id)

    const alreadySaved = previousMessages.some((storedMessage) => storedMessage.id === message.id)

    if(alreadySaved) {
        return new Response("Message already saved", { status: 200})
    }

    const messages = alreadySaved ? previousMessages : [...previousMessages, message]

    if(!alreadySaved) {
        await saveChatMessages(id, [message])
    }

    const result = streamText({
        model: getChatModel(conversation.model),
        system: conversation.systemPrompt ?? "You are helpful assistant who can solve users doubt",
        messages: await convertToModelMessages(messages),
    })

    result.consumeStream()

    return createUIMessageStreamResponse({
        stream: toUIMessageStream({
            stream: result.stream,
            originalMessages: messages,
            generateMessageId: createIdGenerator({prefix: "msg", size: 16}),
            onEnd: async({messages: finalMessages}) => {
                try {
                    await saveChatMessages(id, finalMessages, {updateTitle: false})
                } catch (error) {
                    console.error(error)
                }
            }
        })
    })
}