"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { MapPin, ArrowLeft, RefreshCw, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

type LocationArtifactProps = {
    locationId?: string;
    onSelectLocation: (id: string) => void;
    onBack: () => void;
};

export function LocationArtifact({
    locationId,
    onSelectLocation,
    onBack,
}: LocationArtifactProps) {
    const { project, updateLocation } = useAppStore();
    const locations = project?.locations || [];
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const { startUpload } = useUploadThing("styleReferenceUploader", {
        onClientUploadComplete: (res) => {
            if (res && res[0] && uploadingId) {
                updateLocation(uploadingId, {
                    referenceImageUrl: res[0].url,
                    status: "ready",
                });
            }
            setUploadingId(null);
        },
        onUploadError: () => {
            setUploadingId(null);
        },
    });

    const location = locationId
        ? locations.find((l) => l.id === locationId)
        : null;

    const handleRegenerate = async (locId: string) => {
        setRegeneratingId(locId);
        updateLocation(locId, { status: "generating" });

        try {
            const loc = locations.find((l) => l.id === locId);
            if (!loc) return;

            const response = await fetch("/api/generate-location-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locationName: loc.name,
                    locationDescription: loc.description,
                    aestheticDescription: project?.aesthetic?.description,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                updateLocation(locId, {
                    referenceImageUrl: result.imageUrl,
                    status: "ready",
                });
            } else {
                updateLocation(locId, { status: "error" });
            }
        } catch {
            updateLocation(locId, { status: "error" });
        } finally {
            setRegeneratingId(null);
        }
    };

    const handleUpload = (locId: string) => {
        setUploadingId(locId);
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                await startUpload([file]);
            } else {
                setUploadingId(null);
            }
        };
        input.click();
    };

    // Show specific location detail
    if (locationId && location) {
        const isGenerating =
            location.status === "generating" || regeneratingId === location.id;
        const isUploading = uploadingId === location.id;

        return (
            <div className="space-y-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                </button>

                <div>
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        {location.description}
                    </p>
                </div>

                {/* Location image */}
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                    {location.referenceImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={location.referenceImageUrl}
                            alt={location.name}
                            className="h-full w-full object-cover"
                        />
                    ) : isGenerating ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Generating image...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <MapPin className="h-12 w-12 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerate(location.id)}
                        disabled={isGenerating || isUploading}
                        className="flex-1"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        {location.referenceImageUrl ? "Regenerate" : "Generate"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpload(location.id)}
                        disabled={isGenerating || isUploading}
                        className="flex-1"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload
                    </Button>
                </div>
            </div>
        );
    }

    if (locationId && !location) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Location not found</p>
            </div>
        );
    }

    // Show location grid
    return (
        <div className="space-y-2">
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3 w-3" />
                Back to Preprocessing
            </button>
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
                Locations ({locations.length})
            </h4>
            {locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No locations extracted yet. Run preprocessing after
                    finalizing the script.
                </p>
            ) : (
                <div className="space-y-1">
                    {locations.map((loc) => {
                        const isGenerating =
                            loc.status === "generating" ||
                            regeneratingId === loc.id;

                        return (
                            <button
                                key={loc.id}
                                onClick={() => onSelectLocation(loc.id)}
                                className="flex w-full items-center gap-2 rounded-lg border p-2 text-left hover:border-primary hover:bg-muted/50 transition-colors"
                            >
                                <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted flex items-center justify-center">
                                    {loc.referenceImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={loc.referenceImageUrl}
                                            alt={loc.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : isGenerating ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {loc.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {loc.status === "ready"
                                            ? "✓ Ready"
                                            : loc.status === "generating"
                                            ? "Generating..."
                                            : loc.status === "error"
                                            ? "Error"
                                            : "Pending"}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
