"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import type { ArtifactType } from "@/lib/types";
import {
    FileText,
    Palette,
    Building2,
    Users,
    Film,
    Clapperboard,
    Check,
    Clock,
    AlertCircle,
    Image as ImageIcon,
    Video,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChecklistItemProps = {
    id: string;
    name: string;
    status: "not_started" | "in_progress" | "completed" | "skipped";
    required: boolean;
    onClick: () => void;
};

const checklistIconMap: Record<
    string,
    React.ComponentType<{ className?: string }>
> = {
    overview: FileText,
    aesthetic: Palette,
    brand: Building2,
    characters: Users,
    script: Film,
    preprocessing: Clapperboard,
    thumbnails: ImageIcon,
    videos: Video,
    final_video: Download,
};

function ChecklistItemRow({
    id,
    name,
    status,
    required,
    onClick,
}: ChecklistItemProps) {
    const Icon = checklistIconMap[id] || FileText;

    const getStatusIndicator = () => {
        switch (status) {
            case "completed":
                return <Check className="h-3 w-3 text-green-500" />;
            case "in_progress":
                return (
                    <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />
                );
            case "skipped":
                return (
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                );
            default:
                return (
                    <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                );
        }
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted",
                status === "completed" && "opacity-60"
            )}
        >
            <div
                className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded",
                    status === "completed"
                        ? "bg-green-500/10 text-green-500"
                        : status === "in_progress"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-muted text-muted-foreground"
                )}
            >
                <Icon className="h-3 w-3" />
            </div>
            <span className="flex-1 truncate text-xs font-medium">
                {name}
                {!required && (
                    <span className="ml-1 text-muted-foreground">(opt)</span>
                )}
            </span>
            {getStatusIndicator()}
        </button>
    );
}

export function SummaryPanel() {
    const { checklist, setCurrentArtifact } = useAppStore();

    const handleItemClick = (itemId: string) => {
        const typeMap: Record<string, string> = {
            overview: "overview",
            aesthetic: "aesthetic",
            brand: "brand",
            characters: "character",
            script: "script",
            preprocessing: "preprocessing",
            thumbnails: "thumbnails",
            videos: "videos",
            final_video: "final_video",
        };
        const artifactType = typeMap[itemId] || itemId;
        setCurrentArtifact({ type: artifactType as ArtifactType, data: null });
    };

    const completedCount = checklist.filter(
        (item) => item.status === "completed" || item.status === "skipped"
    ).length;
    const progressPercentage = Math.round(
        (completedCount / checklist.length) * 100
    );

    return (
        <div className="flex flex-col">
            {/* Header - compact */}
            <div className="border-b border-border px-3 py-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Progress</h2>
                    <span className="text-xs text-muted-foreground">
                        {completedCount}/{checklist.length}
                    </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Checklist - compact */}
            <div className="p-1.5">
                <div className="space-y-0.5">
                    {checklist.map((item) => (
                        <ChecklistItemRow
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            status={item.status}
                            required={item.required}
                            onClick={() => handleItemClick(item.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
