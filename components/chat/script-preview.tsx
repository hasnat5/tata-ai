"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Scene, Character, SceneType } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
    Film,
    Camera,
    Image as ImageIcon,
    User,
    Check,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

type ScriptPreviewProps = {
    scenes: Scene[];
    isEditable?: boolean;
    onSceneUpdate?: (sceneId: string, updates: Partial<Scene>) => void;
    maxHeight?: string;
};

const sceneTypeIcons: Record<
    SceneType,
    React.ComponentType<{ className?: string }>
> = {
    scene: Film,
    broll: Camera,
    infographic: ImageIcon,
};

function getSceneTypeColor(type: SceneType) {
    switch (type) {
        case "scene":
            return "border-l-blue-500 bg-blue-500/5";
        case "broll":
            return "border-l-green-500 bg-green-500/5";
        case "infographic":
            return "border-l-purple-500 bg-purple-500/5";
    }
}

type SceneCardProps = {
    scene: Scene;
    index: number;
    characters: Character[];
    isEditable?: boolean;
    onUpdate?: (updates: Partial<Scene>) => void;
};

function SceneCard({
    scene,
    index,
    characters,
    isEditable = false,
    onUpdate,
}: SceneCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [editingField, setEditingField] = useState<string | null>(null);

    const Icon = sceneTypeIcons[scene.type];
    const colorClass = getSceneTypeColor(scene.type);

    // Find the speaking character
    const speakingCharacter = scene.script?.characterId
        ? characters.find((c) => c.id === scene.script?.characterId)
        : null;

    const handleTypeChange = (newType: SceneType) => {
        if (onUpdate) {
            onUpdate({ type: newType });
        }
    };

    const handleDescriptionChange = (newDescription: string) => {
        if (onUpdate) {
            onUpdate({ description: newDescription });
        }
        setEditingField(null);
    };

    const handleDialogueChange = (newDialogue: string) => {
        if (onUpdate && scene.script) {
            onUpdate({
                script: { ...scene.script, dialogue: newDialogue },
            });
        }
        setEditingField(null);
    };

    const handleSpeakerChange = (characterId: string) => {
        if (onUpdate) {
            if (characterId === "") {
                onUpdate({ script: null });
            } else {
                onUpdate({
                    script: {
                        characterId,
                        dialogue: scene.script?.dialogue || "",
                    },
                });
            }
        }
    };

    const handleBrandLogoToggle = () => {
        if (onUpdate) {
            onUpdate({ includeBrandLogo: !scene.includeBrandLogo });
        }
    };

    return (
        <div
            className={cn(
                "rounded-lg border-l-4 border transition-all",
                colorClass
            )}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between p-3 text-left"
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        Scene {index + 1}
                    </span>
                    {isEditable ? (
                        <select
                            value={scene.type}
                            onChange={(e) =>
                                handleTypeChange(e.target.value as SceneType)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="ml-2 rounded border bg-background px-2 py-0.5 text-xs"
                        >
                            <option value="scene">Speaking Scene</option>
                            <option value="broll">B-Roll</option>
                            <option value="infographic">Infographic</option>
                        </select>
                    ) : (
                        <span className="text-xs text-muted-foreground capitalize">
                            {scene.type}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="space-y-3 border-t px-3 pb-3 pt-2">
                    {/* Description */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase">
                            Visual Description
                        </label>
                        {isEditable && editingField === "description" ? (
                            <textarea
                                defaultValue={scene.description}
                                onBlur={(e) =>
                                    handleDescriptionChange(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleDescriptionChange(
                                            e.currentTarget.value
                                        );
                                    }
                                }}
                                autoFocus
                                className="mt-1 w-full rounded border bg-background p-2 text-sm"
                                rows={2}
                            />
                        ) : (
                            <p
                                onClick={() =>
                                    isEditable && setEditingField("description")
                                }
                                className={cn(
                                    "mt-1 text-sm",
                                    isEditable &&
                                        "cursor-text hover:bg-muted/50 rounded p-1 -m-1"
                                )}
                            >
                                {scene.description}
                            </p>
                        )}
                    </div>

                    {/* Script / Dialogue */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase">
                            Dialogue / Voiceover
                        </label>
                        <div className="mt-1 flex gap-2">
                            {/* Speaker select */}
                            <div className="shrink-0">
                                {isEditable ? (
                                    <select
                                        value={scene.script?.characterId || ""}
                                        onChange={(e) =>
                                            handleSpeakerChange(e.target.value)
                                        }
                                        className="h-8 w-8 rounded-full border bg-background p-0 text-center text-xs appearance-none cursor-pointer"
                                        style={{
                                            backgroundImage: speakingCharacter
                                                ?.referencePhotos[0]
                                                ? `url(${speakingCharacter.referencePhotos[0]})`
                                                : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                        }}
                                        title={
                                            speakingCharacter?.name ||
                                            "Select speaker"
                                        }
                                    >
                                        <option value="">None</option>
                                        {characters.map((char) => (
                                            <option
                                                key={char.id}
                                                value={char.id}
                                            >
                                                {char.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : speakingCharacter ? (
                                    <div
                                        className="h-8 w-8 rounded-full bg-muted overflow-hidden"
                                        title={speakingCharacter.name}
                                    >
                                        {speakingCharacter
                                            .referencePhotos[0] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={
                                                    speakingCharacter
                                                        .referencePhotos[0]
                                                }
                                                alt={speakingCharacter.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-full w-full p-1.5 text-muted-foreground" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Dialogue text */}
                            <div className="flex-1">
                                {scene.script?.dialogue ? (
                                    isEditable &&
                                    editingField === "dialogue" ? (
                                        <textarea
                                            defaultValue={scene.script.dialogue}
                                            onBlur={(e) =>
                                                handleDialogueChange(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    handleDialogueChange(
                                                        e.currentTarget.value
                                                    );
                                                }
                                            }}
                                            autoFocus
                                            className="w-full rounded border bg-background p-2 text-sm italic"
                                            rows={2}
                                        />
                                    ) : (
                                        <p
                                            onClick={() =>
                                                isEditable &&
                                                setEditingField("dialogue")
                                            }
                                            className={cn(
                                                "text-sm italic",
                                                isEditable &&
                                                    "cursor-text hover:bg-muted/50 rounded p-1 -m-1"
                                            )}
                                        >
                                            &ldquo;{scene.script.dialogue}
                                            &rdquo;
                                        </p>
                                    )
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        No dialogue
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Brand logo toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={
                                isEditable ? handleBrandLogoToggle : undefined
                            }
                            disabled={!isEditable}
                            className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border",
                                scene.includeBrandLogo
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-background border-border",
                                isEditable &&
                                    "cursor-pointer hover:border-primary"
                            )}
                        >
                            {scene.includeBrandLogo && (
                                <Check className="h-3 w-3" />
                            )}
                        </button>
                        <label className="text-xs text-muted-foreground">
                            Include brand logo
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

export function ScriptPreview({
    scenes,
    isEditable = false,
    onSceneUpdate,
    maxHeight = "400px",
}: ScriptPreviewProps) {
    const { project } = useAppStore();
    const characters = project?.characters || [];

    const handleSceneUpdate = useCallback(
        (sceneId: string, updates: Partial<Scene>) => {
            if (onSceneUpdate) {
                onSceneUpdate(sceneId, updates);
            }
        },
        [onSceneUpdate]
    );

    if (scenes.length === 0) {
        return (
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                No scenes generated yet
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight }}>
            {scenes.map((scene, idx) => (
                <SceneCard
                    key={scene.id}
                    scene={scene}
                    index={idx}
                    characters={characters}
                    isEditable={isEditable}
                    onUpdate={(updates) => handleSceneUpdate(scene.id, updates)}
                />
            ))}
        </div>
    );
}
