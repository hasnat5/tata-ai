"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
    Film,
    MapPin,
    Shirt,
    ChevronDown,
    ChevronRight,
    Loader2,
} from "lucide-react";
import type { Scene } from "@/lib/types";

export function PreprocessingArtifact() {
    const { project, setCurrentArtifact } = useAppStore();
    const scenes = project?.scenes || [];
    const locations = project?.locations || [];
    const attires = project?.characterAttires || [];
    const characters = project?.characters || [];

    const [expandedScenes, setExpandedScenes] = useState<Set<string>>(
        new Set(scenes.slice(0, 3).map((s) => s.id))
    );

    const toggleScene = (sceneId: string) => {
        setExpandedScenes((prev) => {
            const next = new Set(prev);
            if (next.has(sceneId)) {
                next.delete(sceneId);
            } else {
                next.add(sceneId);
            }
            return next;
        });
    };

    const getSceneTypeColor = (type: Scene["type"]) => {
        switch (type) {
            case "scene":
                return "border-l-blue-500 bg-blue-500/5";
            case "broll":
                return "border-l-green-500 bg-green-500/5";
            case "infographic":
                return "border-l-purple-500 bg-purple-500/5";
        }
    };

    const getSceneTypeLabel = (type: Scene["type"]) => {
        switch (type) {
            case "scene":
                return "Speaking";
            case "broll":
                return "B-Roll";
            case "infographic":
                return "Infographic";
        }
    };

    if (scenes.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p className="text-sm">No scenes to preprocess</p>
            </div>
        );
    }

    // Check if preprocessing has been done
    const hasPreprocessing =
        locations.length > 0 ||
        attires.length > 0 ||
        scenes.some((s) => s.visualCharacterIds.length > 0);

    if (!hasPreprocessing) {
        return (
            <div className="space-y-3">
                <div className="rounded-lg border border-dashed p-4 text-center">
                    <Film className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-medium mb-1">
                        Ready for Preprocessing
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        The script has {scenes.length} scenes. Run preprocessing
                        to extract locations, character attires, and tag each
                        scene.
                    </p>
                </div>
            </div>
        );
    }

    // Group attires by character
    const attiresByCharacter = new Map<
        string,
        Array<(typeof attires)[number]>
    >();
    attires.forEach((att) => {
        const existing = attiresByCharacter.get(att.characterId) || [];
        existing.push(att);
        attiresByCharacter.set(att.characterId, existing);
    });

    return (
        <div className="space-y-4">
            {/* ===================== LOCATIONS SECTION ===================== */}
            {locations.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Locations ({locations.length})
                        </h4>
                        <button
                            onClick={() =>
                                setCurrentArtifact({
                                    type: "location",
                                    data: null,
                                })
                            }
                            className="text-xs text-primary hover:underline"
                        >
                            View all
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {locations.map((loc) => (
                            <button
                                key={loc.id}
                                onClick={() =>
                                    setCurrentArtifact({
                                        type: "location",
                                        data: loc.id,
                                    })
                                }
                                className="shrink-0 group"
                                title={loc.name}
                            >
                                <div className="h-16 w-24 overflow-hidden rounded-lg border bg-muted flex items-center justify-center group-hover:border-primary transition-colors">
                                    {loc.referenceImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={loc.referenceImageUrl}
                                            alt={loc.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : loc.status === "generating" ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center mt-1 truncate max-w-[96px]">
                                    {loc.name}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ===================== ATTIRES SECTION ===================== */}
            {attires.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                            <Shirt className="h-3 w-3" />
                            Character Attires ({attires.length})
                        </h4>
                        <button
                            onClick={() =>
                                setCurrentArtifact({
                                    type: "attire",
                                    data: null,
                                })
                            }
                            className="text-xs text-primary hover:underline"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-2">
                        {Array.from(attiresByCharacter.entries()).map(
                            ([charId, charAttires]) => {
                                const char = characters.find(
                                    (c) => c.id === charId
                                );
                                return (
                                    <div key={charId}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {char?.referencePhotos[0] && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={
                                                        char.referencePhotos[0]
                                                    }
                                                    alt={char.name}
                                                    className="h-5 w-5 rounded-full object-cover"
                                                />
                                            )}
                                            <span className="text-xs font-medium">
                                                {char?.name || "Unknown"}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 overflow-x-auto pb-1 pl-6">
                                            {charAttires.map((att) => (
                                                <button
                                                    key={att.id}
                                                    onClick={() =>
                                                        setCurrentArtifact({
                                                            type: "attire",
                                                            data: att.id,
                                                        })
                                                    }
                                                    className="shrink-0 group"
                                                    title={att.name}
                                                >
                                                    <div className="h-12 w-12 overflow-hidden rounded border bg-muted flex items-center justify-center group-hover:border-primary transition-colors">
                                                        {att
                                                            .referenceAngles[0] ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={
                                                                    att
                                                                        .referenceAngles[0]
                                                                }
                                                                alt={att.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : att.status ===
                                                          "generating" ? (
                                                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                        ) : (
                                                            <Shirt className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground text-center mt-0.5 truncate max-w-[48px]">
                                                        {att.name}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            )}

            {/* ===================== SCENES SECTION ===================== */}
            <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1 mb-2">
                    <Film className="h-3 w-3" />
                    Scenes with Tagging ({scenes.length})
                </h4>
                <div className="space-y-1.5">
                    {scenes.map((scene, idx) => {
                        const isExpanded = expandedScenes.has(scene.id);
                        const location = scene.locationId
                            ? locations.find((l) => l.id === scene.locationId)
                            : null;

                        // Get characters and their attires for this scene
                        const sceneCharacters = scene.visualCharacterIds
                            .map((charId) => {
                                const char = characters.find(
                                    (c) => c.id === charId
                                );
                                const attireId =
                                    scene.characterAttireIds?.[charId];
                                const attire = attireId
                                    ? attires.find((a) => a.id === attireId)
                                    : null;
                                return char ? { char, attire } : null;
                            })
                            .filter(Boolean);

                        const speakingChar = scene.script?.characterId
                            ? characters.find(
                                  (c) => c.id === scene.script?.characterId
                              )
                            : null;

                        return (
                            <div
                                key={scene.id}
                                className={cn(
                                    "rounded-lg border-l-2 border overflow-hidden",
                                    getSceneTypeColor(scene.type)
                                )}
                            >
                                {/* Header */}
                                <button
                                    onClick={() => toggleScene(scene.id)}
                                    className="flex w-full items-center justify-between p-2 text-left hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {isExpanded ? (
                                            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        )}
                                        <span className="text-xs font-medium">
                                            Scene {idx + 1}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {getSceneTypeLabel(scene.type)}
                                        </span>
                                    </div>

                                    {/* Mini preview of characters and location */}
                                    <div className="flex items-center gap-1">
                                        {/* Character avatars */}
                                        {sceneCharacters
                                            .slice(0, 3)
                                            .map((item, i) =>
                                                item?.char
                                                    .referencePhotos[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        key={i}
                                                        src={
                                                            item.char
                                                                .referencePhotos[0]
                                                        }
                                                        alt={item.char.name}
                                                        className="h-5 w-5 rounded-full object-cover border border-background"
                                                        title={`${
                                                            item.char.name
                                                        }${
                                                            item.attire
                                                                ? ` (${item.attire.name})`
                                                                : ""
                                                        }`}
                                                    />
                                                ) : null
                                            )}

                                        {/* Location thumbnail */}
                                        {location?.referenceImageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={location.referenceImageUrl}
                                                alt={location.name}
                                                className="h-5 w-8 rounded object-cover border border-background"
                                                title={location.name}
                                            />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="border-t px-2 pb-2 pt-1.5 space-y-2">
                                        {/* Description */}
                                        <p className="text-xs text-muted-foreground">
                                            {scene.description}
                                        </p>

                                        {/* Dialogue */}
                                        {scene.script && speakingChar && (
                                            <div className="flex items-start gap-2 rounded bg-muted/50 p-1.5">
                                                {speakingChar
                                                    .referencePhotos[0] && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            speakingChar
                                                                .referencePhotos[0]
                                                        }
                                                        alt={speakingChar.name}
                                                        className="h-5 w-5 rounded-full object-cover shrink-0"
                                                    />
                                                )}
                                                <p className="text-xs italic">
                                                    &ldquo;
                                                    {scene.script.dialogue}
                                                    &rdquo;
                                                </p>
                                            </div>
                                        )}

                                        {/* Visual Characters */}
                                        {sceneCharacters.length > 0 && (
                                            <div>
                                                <label className="text-[10px] font-medium text-muted-foreground uppercase">
                                                    Characters in Scene
                                                </label>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {sceneCharacters.map(
                                                        (item, i) =>
                                                            item && (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center gap-1 rounded border px-1.5 py-0.5 bg-background"
                                                                >
                                                                    {item.char
                                                                        .referencePhotos[0] && (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={
                                                                                item
                                                                                    .char
                                                                                    .referencePhotos[0]
                                                                            }
                                                                            alt={
                                                                                item
                                                                                    .char
                                                                                    .name
                                                                            }
                                                                            className="h-4 w-4 rounded-full object-cover"
                                                                        />
                                                                    )}
                                                                    <span className="text-[10px]">
                                                                        {
                                                                            item
                                                                                .char
                                                                                .name
                                                                        }
                                                                    </span>
                                                                    {item.attire && (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            (
                                                                            {
                                                                                item
                                                                                    .attire
                                                                                    .name
                                                                            }
                                                                            )
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {location && (
                                            <div>
                                                <label className="text-[10px] font-medium text-muted-foreground uppercase">
                                                    Location
                                                </label>
                                                <div className="flex items-center gap-2 mt-1 rounded border px-1.5 py-1 bg-background">
                                                    {location.referenceImageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                location.referenceImageUrl
                                                            }
                                                            alt={location.name}
                                                            className="h-6 w-10 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="text-xs">
                                                        {location.name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Brand logo indicator */}
                                        {scene.includeBrandLogo && (
                                            <div className="text-[10px] text-primary">
                                                ✓ Brand logo included
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
