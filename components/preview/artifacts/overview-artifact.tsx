"use client";

import { useAppStore } from "@/lib/store";

export function OverviewArtifact() {
    const { project } = useAppStore();
    const overview = project?.overview;

    if (!overview) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No overview saved yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Concept
                </h4>
                <p className="text-sm">{overview.prompt}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        Aspect Ratio
                    </h4>
                    <p className="text-sm font-medium">{overview.aspectRatio}</p>
                </div>
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        Duration
                    </h4>
                    <p className="text-sm font-medium">
                        {overview.targetDurationSeconds}s
                    </p>
                </div>
            </div>
            {overview.additionalNotes && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                        Notes
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {overview.additionalNotes}
                    </p>
                </div>
            )}
        </div>
    );
}
