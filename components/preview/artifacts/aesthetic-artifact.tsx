"use client";

import { useAppStore } from "@/lib/store";

export function AestheticArtifact() {
    const { project } = useAppStore();
    const aesthetic = project?.aesthetic;

    if (!aesthetic) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No aesthetic saved yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Style: {aesthetic.title}
                </h4>
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize">
                    {aesthetic.style}
                </span>
            </div>
            <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Description
                </h4>
                <p className="text-sm">{aesthetic.description}</p>
            </div>
            {aesthetic.referenceImages.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                        Reference Images
                    </h4>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {aesthetic.referenceImages.map((url, idx) => (
                            <div
                                key={idx}
                                className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={url}
                                    alt={`Reference ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
