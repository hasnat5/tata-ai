"use client";

import { useAppStore } from "@/lib/store";

export function BrandArtifact() {
    const { project } = useAppStore();
    const brand = project?.brand;

    if (!brand) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No brand saved (or skipped)</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                {brand.logoUrl && (
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-muted shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="h-full w-full object-contain"
                        />
                    </div>
                )}
                <div className="min-w-0">
                    <h4 className="font-medium truncate">{brand.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {brand.description}
                    </p>
                </div>
            </div>
            {brand.colors.length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                        Brand Colors
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {brand.colors.map((color, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded border px-1.5 py-0.5"
                            >
                                <div
                                    className="h-3 w-3 rounded-sm"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <span className="text-xs">{color.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
