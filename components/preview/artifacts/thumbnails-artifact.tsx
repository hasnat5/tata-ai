"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
    Film,
    ArrowLeft,
    RefreshCw,
    Loader2,
    Image as ImageIcon,
    MessageSquare,
    Check,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ThumbnailsArtifactProps = {
    sceneId?: string;
    onSelectScene: (id: string) => void;
    onBack: () => void;
};

export function ThumbnailsArtifact({
    sceneId,
    onSelectScene,
    onBack,
}: ThumbnailsArtifactProps) {
    const { project } = useAppStore();
    const scenes = project?.scenes || [];
    const characters = project?.characters || [];
    const locations = project?.locations || [];
    const aspectRatio = project?.overview?.aspectRatio || "16:9";
    const isPortrait = aspectRatio === "9:16";
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    // Find the selected scene
    const selectedScene = sceneId
        ? scenes.find((s) => s.id === sceneId)
        : undefined;

    // If a specific scene is selected, show its detail view
    if (selectedScene) {
        const location = selectedScene.locationId
            ? locations.find((l) => l.id === selectedScene.locationId)
            : null;

        const speaker = selectedScene.script?.characterId
            ? characters.find((c) => c.id === selectedScene.script?.characterId)
            : null;

        const isRegenerating = regeneratingId === selectedScene.id;

        return (
            <div className="space-y-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Thumbnails
                </button>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                            Scene {selectedScene.index + 1} Thumbnail
                        </h4>
                        <span
                            className={`text-xs ${
                                selectedScene.thumbnailStatus === "ready"
                                    ? "text-green-500"
                                    : selectedScene.thumbnailStatus ===
                                      "generating"
                                    ? "text-amber-500"
                                    : selectedScene.thumbnailStatus === "error"
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {selectedScene.thumbnailStatus === "ready"
                                ? "✓ Ready"
                                : selectedScene.thumbnailStatus === "generating"
                                ? "Generating..."
                                : selectedScene.thumbnailStatus === "error"
                                ? "Error"
                                : "Pending"}
                        </span>
                    </div>

                    {/* Thumbnail Preview */}
                    <div
                        className={`relative rounded-lg border bg-muted overflow-hidden ${
                            isPortrait
                                ? "aspect-[9/16] max-w-[200px] mx-auto"
                                : "aspect-video"
                        }`}
                    >
                        {selectedScene.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={selectedScene.thumbnailUrl}
                                alt={`Scene ${
                                    selectedScene.index + 1
                                } thumbnail`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-12 w-12 opacity-30" />
                            </div>
                        )}
                        {isRegenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                            </div>
                        )}
                    </div>

                    {/* Scene Info */}
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="capitalize">
                                {selectedScene.type}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Description:
                            </span>
                            <p className="mt-1 text-xs">
                                {selectedScene.description}
                            </p>
                        </div>
                        {selectedScene.script && (
                            <div>
                                <span className="text-muted-foreground">
                                    Dialogue:
                                </span>
                                <p className="mt-1 text-xs italic flex items-start gap-2">
                                    {speaker && (
                                        <span className="font-medium shrink-0">
                                            {speaker.name}:
                                        </span>
                                    )}
                                    &ldquo;{selectedScene.script.dialogue}
                                    &rdquo;
                                </p>
                            </div>
                        )}
                        {location && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                    Location:
                                </span>
                                <span>{location.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isRegenerating}
                            onClick={() => {
                                // This would trigger edit through the agent
                                setRegeneratingId(selectedScene.id);
                                // In a real implementation, this would call the agent
                                setTimeout(() => setRegeneratingId(null), 2000);
                            }}
                        >
                            {isRegenerating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Regenerate
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Show thumbnail grid
    const thumbnailsGenerated = scenes.filter((s) => s.thumbnailUrl).length;
    const thumbnailsPending = scenes.filter(
        (s) => s.thumbnailStatus === "pending" || !s.thumbnailStatus
    ).length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                    Scene Thumbnails ({thumbnailsGenerated}/{scenes.length})
                </h4>
                {thumbnailsPending > 0 && (
                    <span className="text-xs text-amber-500">
                        {thumbnailsPending} pending
                    </span>
                )}
            </div>

            {scenes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No scenes yet. Generate a script first.
                </p>
            ) : (
                <div
                    className={`grid gap-2 ${
                        isPortrait ? "grid-cols-3" : "grid-cols-2"
                    }`}
                >
                    {scenes.map((scene) => {
                        const isGenerating =
                            scene.thumbnailStatus === "generating" ||
                            regeneratingId === scene.id;

                        return (
                            <button
                                key={scene.id}
                                onClick={() => onSelectScene(scene.id)}
                                className={`group relative rounded-lg border overflow-hidden hover:border-primary transition-colors ${
                                    isPortrait
                                        ? "aspect-[9/16]"
                                        : "aspect-video"
                                }`}
                            >
                                {scene.thumbnailUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={scene.thumbnailUrl}
                                        alt={`Scene ${scene.index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-muted">
                                        {isGenerating ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        ) : scene.thumbnailStatus ===
                                          "error" ? (
                                            <AlertCircle className="h-6 w-6 text-red-500" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-muted-foreground opacity-30" />
                                        )}
                                    </div>
                                )}

                                {/* Overlay with scene info */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-white">
                                            Scene {scene.index + 1}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {scene.type === "scene" && (
                                                <MessageSquare className="h-3 w-3 text-white/70" />
                                            )}
                                            {scene.type === "broll" && (
                                                <Film className="h-3 w-3 text-white/70" />
                                            )}
                                            {scene.thumbnailStatus ===
                                                "ready" && (
                                                <Check className="h-3 w-3 text-green-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            {scenes.length > 0 && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>
                            {thumbnailsGenerated === scenes.length
                                ? "All thumbnails generated"
                                : `${thumbnailsGenerated} of ${scenes.length} thumbnails ready`}
                        </span>
                        {thumbnailsGenerated === scenes.length && (
                            <span className="text-green-500">✓ Complete</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
