// features/conversation/components/branch-switcher.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Pencil, Trash2, Check, X } from "lucide-react";
import { renameBranch, deleteBranch } from "@/features/conversation/actions/branch-actions";

export function BranchSwitcher({
    conversationId,
    branches,
    activeBranch,
}: {
    conversationId: string;
    branches: any[];
    activeBranch: any;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");

    const switchTo = (branchId: string) => {
        router.push(`/c/${conversationId}?branch=${branchId}`);
        router.refresh();
    };

    const handleRename = (branchId: string) => {
        startTransition(async () => {
            await renameBranch(branchId, draftName);
            setRenamingId(null);
            router.refresh();
        });
    };

    const handleDelete = (branchId: string) => {
        if (branches.length <= 1) return; // don't delete the last branch
        startTransition(async () => {
            await deleteBranch(branchId);
            if (branchId === activeBranch.id) {
                const fallback = branches.find((b) => b.id !== branchId);
                switchTo(fallback!.id);
            } else {
                router.refresh();
            }
        });
    };

    return (
        <DropdownMenu>
        <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-2">
                        <GitBranch className="h-4 w-4" />
                        {activeBranch.name}
                    </Button>
                }
            />
            <DropdownMenuContent align="end" className="w-64">
                {branches.map((branch) => (
                    <DropdownMenuItem
                        key={branch.id}
                        className="flex items-center justify-between gap-2"
                        onSelect={(e) => {
                            if (renamingId === branch.id) e.preventDefault();
                        }}
                    >
                        {renamingId === branch.id ? (
                            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                <Input
                                    autoFocus
                                    value={draftName}
                                    onChange={(e) => setDraftName(e.target.value)}
                                    className="h-7 text-sm"
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(branch.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRenamingId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <span
                                    className={`flex-1 truncate ${branch.id === activeBranch.id ? "font-semibold" : ""}`}
                                    onClick={() => switchTo(branch.id)}
                                >
                                    {branch.name}
                                </span>
                                <Pencil
                                    className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRenamingId(branch.id);
                                        setDraftName(branch.name);
                                    }}
                                />
                                {branches.length > 1 && (
                                    <Trash2
                                        className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(branch.id);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}