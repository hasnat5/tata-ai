"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import {
    Film,
    ArrowLeft,
    Loader2,
    Play,
    Pause,
    Video,
    MessageSquare,
    Check,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type VideosArtifactProps = {
    sceneId?: string;
    onSelectScene: (id: string) => void;
    onBack: () => void;
};

export function VideosArtifact({
    sceneId,
    onSelectScene,
    onBack,
}: VideosArtifactProps) {
    const { project } = useAppStore();
    const scenes = project?.scenes || [];
    const characters = project?.characters || [];
    const locations = project?.locations || [];
    const aspectRatio = project?.overview?.aspectRatio || "16:9";
    const isPortrait = aspectRatio === "9:16";
    const [playingId, setPlayingId] = useState<string | null>(null);
    const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

    // Find the selected scene
    const selectedScene = sceneId
        ? scenes.find((s) => s.id === sceneId)
        : undefined;

    const handlePlayPause = (id: string) => {
        const video = videoRefs.current[id];
        if (!video) return;

        if (playingId === id) {
            video.pause();
            setPlayingId(null);
        } else {
            // Pause other videos
            Object.entries(videoRefs.current).forEach(([key, v]) => {
                if (v && key !== id) v.pause();
            });
            video.play();
            setPlayingId(id);
        }
    };

    // If a specific scene is selected, show its detail view
    if (selectedScene) {
        const location = selectedScene.locationId
            ? locations.find((l) => l.id === selectedScene.locationId)
            : null;

        const speaker = selectedScene.script?.characterId
            ? characters.find((c) => c.id === selectedScene.script?.characterId)
            : null;

        return (
            <div className="space-y-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Videos
                </button>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                            Scene {selectedScene.index + 1} Video
                        </h4>
                        <span
                            className={`text-xs ${
                                selectedScene.videoStatus === "ready"
                                    ? "text-green-500"
                                    : selectedScene.videoStatus === "generating"
                                    ? "text-amber-500"
                                    : selectedScene.videoStatus === "error"
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {selectedScene.videoStatus === "ready"
                                ? "✓ Ready"
                                : selectedScene.videoStatus === "generating"
                                ? "Generating..."
                                : selectedScene.videoStatus === "error"
                                ? "Error"
                                : "Pending"}
                        </span>
                    </div>

                    {/* Video Preview */}
                    <div
                        className={`relative rounded-lg border bg-black overflow-hidden ${
                            isPortrait
                                ? "aspect-[9/16] max-w-[200px] mx-auto"
                                : "aspect-video"
                        }`}
                    >
                        {selectedScene.videoUrl ? (
                            <>
                                <video
                                    ref={(el) => {
                                        videoRefs.current[selectedScene.id] =
                                            el;
                                    }}
                                    src={selectedScene.videoUrl}
                                    className="h-full w-full object-contain"
                                    onEnded={() => setPlayingId(null)}
                                    playsInline
                                />
                                <button
                                    onClick={() =>
                                        handlePlayPause(selectedScene.id)
                                    }
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                                >
                                    {playingId === selectedScene.id ? (
                                        <Pause className="h-12 w-12 text-white" />
                                    ) : (
                                        <Play className="h-12 w-12 text-white" />
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                <Video className="h-12 w-12 opacity-30" />
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
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                                Duration:
                            </span>
                            <span>8 seconds</span>
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
                </div>
            </div>
        );
    }

    // Show video grid
    const videosGenerated = scenes.filter((s) => s.videoUrl).length;
    const videosPending = scenes.filter(
        (s) => s.videoStatus === "pending" || !s.videoStatus
    ).length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                    Scene Videos ({videosGenerated}/{scenes.length})
                </h4>
                {videosPending > 0 && (
                    <span className="text-xs text-amber-500">
                        {videosPending} pending
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
                        const isGenerating = scene.videoStatus === "generating";
                        const isPlaying = playingId === scene.id;

                        return (
                            <div key={scene.id} className="space-y-1">
                                <button
                                    onClick={() => onSelectScene(scene.id)}
                                    className={`group relative rounded-lg border overflow-hidden hover:border-primary transition-colors bg-black ${
                                        isPortrait
                                            ? "aspect-[9/16]"
                                            : "aspect-video"
                                    }`}
                                >
                                    {scene.videoUrl ? (
                                        <>
                                            <video
                                                ref={(el) => {
                                                    videoRefs.current[
                                                        scene.id
                                                    ] = el;
                                                }}
                                                src={scene.videoUrl}
                                                className="h-full w-full object-contain"
                                                onEnded={() =>
                                                    setPlayingId(null)
                                                }
                                                playsInline
                                                muted
                                            />
                                            <div
                                                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlayPause(scene.id);
                                                }}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="h-8 w-8 text-white" />
                                                ) : (
                                                    <Play className="h-8 w-8 text-white" />
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-muted">
                                            {isGenerating ? (
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            ) : scene.videoStatus ===
                                              "error" ? (
                                                <AlertCircle className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <Video className="h-6 w-6 text-muted-foreground opacity-30" />
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
                                                {scene.videoStatus ===
                                                    "ready" && (
                                                    <Check className="h-3 w-3 text-green-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            {scenes.length > 0 && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span>
                            {videosGenerated === scenes.length
                                ? "All videos generated"
                                : `${videosGenerated} of ${scenes.length} videos ready`}
                        </span>
                        {videosGenerated === scenes.length && (
                            <span className="text-green-500">✓ Complete</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
