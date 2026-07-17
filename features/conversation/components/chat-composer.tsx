"use client";

import * as React from "react";
import { ArrowUpIcon } from "lucide-react";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
    onSend: (content: string) => Promise<void> | void;
    isSending?: boolean;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
};

/**
 * Message input form with send button. Enter sends; Shift+Enter inserts a newline.
 */
export function ChatComposer({
    onSend,
    isSending = false,
    placeholder = "Message ChaiGPT…",
    className,
    autoFocus = false,
}: ChatComposerProps) {
    const [value, setValue] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

    /** Submits the current message when the form is submitted or Enter is pressed. */
    async function handleSubmit(event?: React.FormEvent) {
        event?.preventDefault();
        const content = value.trim();
        if (!content || isSending) return;

        setValue("");
        await onSend(content);
        textareaRef.current?.focus();
    }

    /** Handles keyboard shortcuts — Enter to send, Shift+Enter for a new line. */
    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
        }
    }

    const canSend = value.trim().length > 0 && !isSending;

    return (
        <form
            onSubmit={(event) => void handleSubmit(event)}
            className={cn("mx-auto w-full max-w-3xl px-4 pb-4 md:px-6", className)}
        >
            <InputGroup className="h-auto min-h-14 rounded-[26px] border border-border/40 bg-muted/30 focus-within:bg-background focus-within:border-border/80 focus-within:ring-2 focus-within:ring-border/10 transition-all duration-300 shadow-sm dark:bg-muted/10">
                <InputGroupTextarea
                    ref={textareaRef}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isSending}
                    rows={1}
                    className="max-h-48 min-h-12 py-3.5 pl-5 text-[15px] leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none"
                />
                <InputGroupAddon align="inline-end" className="pr-2.5 pb-2.5 self-end">
                    <InputGroupButton
                        type="submit"
                        size="icon-sm"
                        variant="default"
                        disabled={!canSend}
                        className={cn(
                            "size-8 rounded-full transition-all duration-300",
                            canSend
                                ? "bg-foreground text-background hover:scale-105"
                                : "bg-muted/65 text-muted-foreground/45"
                        )}
                        aria-label="Send message"
                    >
                        {isSending ? <Spinner className="size-4" /> : <ArrowUpIcon className="size-4" />}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
            <p className="mt-2.5 text-center text-xs text-muted-foreground/65 tracking-tight">
                ChaiGPT can make mistakes. Check important info.
            </p>
        </form>
    );
}