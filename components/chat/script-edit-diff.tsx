"use client";

import { diffWords } from "diff";
import type { ScriptEditDiff } from "@/lib/types";
import { cn } from "@/lib/utils";

type ScriptEditDiffDisplayProps = {
    diff: ScriptEditDiff;
};

export function ScriptEditDiffDisplay({ diff }: ScriptEditDiffDisplayProps) {
    const { sceneNumber, field, oldValue, newValue, reason } = diff;

    // Generate word-level diff
    const changes = diffWords(oldValue, newValue);

    const fieldLabel =
        {
            description: "Visual Description",
            dialogue: "Dialogue",
            type: "Scene Type",
            speaker: "Speaker",
        }[field] || field;

    return (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                    Scene {sceneNumber}: {fieldLabel}
                </span>
                {reason && (
                    <span className="text-xs text-muted-foreground">
                        {reason}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Before */}
                <div className="rounded border bg-red-500/5 p-2">
                    <div className="text-red-500 text-[10px] font-medium mb-1">
                        BEFORE
                    </div>
                    <p className="text-muted-foreground line-through">
                        {oldValue || "(empty)"}
                    </p>
                </div>

                {/* After */}
                <div className="rounded border bg-green-500/5 p-2">
                    <div className="text-green-500 text-[10px] font-medium mb-1">
                        AFTER
                    </div>
                    <p>{newValue || "(empty)"}</p>
                </div>
            </div>

            {/* Inline diff */}
            <div className="rounded border bg-background p-2 text-xs">
                <div className="text-muted-foreground text-[10px] font-medium mb-1">
                    CHANGES
                </div>
                <p className="leading-relaxed">
                    {changes.map((part, i) => (
                        <span
                            key={i}
                            className={cn(
                                part.added && "bg-green-500/20 text-green-700",
                                part.removed &&
                                    "bg-red-500/20 text-red-700 line-through"
                            )}
                        >
                            {part.value}
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
