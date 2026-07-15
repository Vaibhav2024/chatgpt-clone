export const queryKeys = {
    conversations: {
        all: ["conversation"] as const,
        detail: (id: string) => ["conversation", id] as const,
    },
    messages: {
        byConversation: (conversationId: string) => {
            return ["messages", conversationId] as const
        }
    }
}