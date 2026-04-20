"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Scene, ScriptContext } from "@/lib/types";

type ScriptArtifactProps = {
    onAddContext?: (context: ScriptContext) => void;
};

export function ScriptArtifact({ onAddContext }: ScriptArtifactProps) {
    const { project, updateScene } = useAppStore();
    const scenes = project?.scenes || [];
    const characters = project?.characters || [];
    const [expandedScenes, setExpandedScenes] = useState<Set<string>>(
        new Set(scenes.map((s) => s.id))
    );
    const [editingField, setEditingField] = useState<{
        sceneId: string;
        field: string;
    } | null>(null);
    const [contextPopup, setContextPopup] = useState<{
        x: number;
        y: number;
        text: string;
        sceneId: string;
        field: string;
    } | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Close popup when clicking outside or when selection is cleared
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(e.target as Node)
            ) {
                // Check if there's still a selection
                const selection = window.getSelection();
                const text = selection?.toString().trim();
                if (!text) {
                    setContextPopup(null);
                }
            }
        };

        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (!text && contextPopup) {
                setContextPopup(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("selectionchange", handleSelectionChange);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener(
                "selectionchange",
                handleSelectionChange
            );
        };
    }, [contextPopup]);

    const handleToggleExpand = (sceneId: string) => {
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

    const handleTypeChange = (sceneId: string, type: Scene["type"]) => {
        updateScene(sceneId, { type });
    };

    const handleDescriptionChange = (sceneId: string, description: string) => {
        updateScene(sceneId, { description });
        setEditingField(null);
    };

    const handleSpeakerChange = (sceneId: string, characterId: string) => {
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return;

        if (characterId === "") {
            updateScene(sceneId, { script: null });
        } else {
            updateScene(sceneId, {
                script: {
                    characterId,
                    dialogue: scene.script?.dialogue || "",
                },
            });
        }
    };

    const handleDialogueChange = (sceneId: string, dialogue: string) => {
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene || !scene.script) return;

        updateScene(sceneId, {
            script: { ...scene.script, dialogue },
        });
        setEditingField(null);
    };

    const handleBrandLogoToggle = (sceneId: string) => {
        const scene = scenes.find((s) => s.id === sceneId);
        if (!scene) return;
        updateScene(sceneId, { includeBrandLogo: !scene.includeBrandLogo });
    };

    const handleTextSelect = useCallback(
        (e: React.MouseEvent, sceneId: string, field: string) => {
            // Small delay to ensure selection is captured after mouse up
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection?.toString().trim();

                if (text && text.length > 0) {
                    const rect = selection
                        ?.getRangeAt(0)
                        .getBoundingClientRect();
                    if (rect) {
                        setContextPopup({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                            text,
                            sceneId,
                            field,
                        });
                    }
                }
            }, 10);
        },
        []
    );

    // Handle clearing context popup only when clicking outside selected text
    const handleContentClick = useCallback((e: React.MouseEvent) => {
        // Don't clear if there's a selection
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (!text) {
            setContextPopup(null);
        }
    }, []);

    const handleAddToContext = () => {
        if (contextPopup && onAddContext) {
            // Find scene number
            const sceneIndex = scenes.findIndex(
                (s) => s.id === contextPopup.sceneId
            );
            onAddContext({
                selectedText: contextPopup.text,
                sceneId: contextPopup.sceneId,
                sceneNumber: sceneIndex >= 0 ? sceneIndex + 1 : undefined,
                fieldType: contextPopup.field as ScriptContext["fieldType"],
            });
        }
        setContextPopup(null);
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

    if (scenes.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No script generated yet</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-2">
            {/* Context popup */}
            {contextPopup && (
                <div
                    ref={popupRef}
                    className="fixed z-50 rounded-lg border bg-background shadow-xl"
                    style={{
                        left: `${contextPopup.x}px`,
                        top: `${contextPopup.y}px`,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <div className="px-2 py-1 border-b bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">
                            Selected text
                        </p>
                    </div>
                    <div className="p-1">
                        <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={handleAddToContext}
                        >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Edit with AI
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                    Script ({scenes.length} scenes)
                </h4>
                <span className="text-xs text-muted-foreground">
                    {scenes.reduce((sum, s) => sum + s.duration, 0)}s
                </span>
            </div>

            <div className="space-y-1.5">
                {scenes.map((scene, idx) => {
                    const isExpanded = expandedScenes.has(scene.id);
                    const speakingCharacter = scene.script?.characterId
                        ? characters.find(
                              (c) => c.id === scene.script?.characterId
                          )
                        : null;

                    return (
                        <div
                            key={scene.id}
                            className={cn(
                                "rounded-lg border-l-2 border transition-all",
                                getSceneTypeColor(scene.type)
                            )}
                        >
                            {/* Header */}
                            <button
                                onClick={() => handleToggleExpand(scene.id)}
                                className="flex w-full items-center justify-between p-2 text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">
                                        Scene {idx + 1}
                                    </span>
                                    <select
                                        value={scene.type}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleTypeChange(
                                                scene.id,
                                                e.target.value as Scene["type"]
                                            );
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded border bg-background px-1.5 py-0.5 text-xs"
                                    >
                                        <option value="scene">Speaking</option>
                                        <option value="broll">B-Roll</option>
                                        <option value="infographic">
                                            Infographic
                                        </option>
                                    </select>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {isExpanded ? "▲" : "▼"}
                                </span>
                            </button>

                            {/* Content */}
                            {isExpanded && (
                                <div
                                    className="space-y-2 border-t px-2 pb-2 pt-1.5"
                                    onClick={handleContentClick}
                                >
                                    {/* Description */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">
                                            Visual
                                        </label>
                                        {editingField?.sceneId === scene.id &&
                                        editingField?.field ===
                                            "description" ? (
                                            <textarea
                                                defaultValue={scene.description}
                                                onBlur={(e) =>
                                                    handleDescriptionChange(
                                                        scene.id,
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" &&
                                                        !e.shiftKey
                                                    ) {
                                                        e.preventDefault();
                                                        handleDescriptionChange(
                                                            scene.id,
                                                            e.currentTarget
                                                                .value
                                                        );
                                                    }
                                                }}
                                                onMouseUp={(e) =>
                                                    handleTextSelect(
                                                        e,
                                                        scene.id,
                                                        "description"
                                                    )
                                                }
                                                autoFocus
                                                className="mt-0.5 w-full rounded border bg-background p-1.5 text-xs"
                                                rows={2}
                                            />
                                        ) : (
                                            <p
                                                onClick={() => {
                                                    // Only switch to edit mode if no text is selected
                                                    const selection =
                                                        window.getSelection();
                                                    const selectedText =
                                                        selection
                                                            ?.toString()
                                                            .trim();
                                                    if (!selectedText) {
                                                        setEditingField({
                                                            sceneId: scene.id,
                                                            field: "description",
                                                        });
                                                    }
                                                }}
                                                onMouseUp={(e) =>
                                                    handleTextSelect(
                                                        e,
                                                        scene.id,
                                                        "description"
                                                    )
                                                }
                                                className="mt-0.5 cursor-text rounded p-1 -m-1 text-xs hover:bg-muted/50"
                                            >
                                                {scene.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Dialogue */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">
                                            Dialogue
                                        </label>
                                        <div className="mt-0.5 flex gap-1.5">
                                            {/* Speaker */}
                                            <div className="shrink-0">
                                                {speakingCharacter
                                                    ?.referencePhotos[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            speakingCharacter
                                                                .referencePhotos[0]
                                                        }
                                                        alt={
                                                            speakingCharacter.name
                                                        }
                                                        className="h-6 w-6 rounded-full object-cover cursor-pointer"
                                                        onClick={() => {
                                                            // Show character select dropdown
                                                        }}
                                                    />
                                                ) : (
                                                    <select
                                                        value={
                                                            scene.script
                                                                ?.characterId ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            handleSpeakerChange(
                                                                scene.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-6 w-16 rounded border bg-background px-1 text-xs"
                                                    >
                                                        <option value="">
                                                            —
                                                        </option>
                                                        {characters.map(
                                                            (char) => (
                                                                <option
                                                                    key={
                                                                        char.id
                                                                    }
                                                                    value={
                                                                        char.id
                                                                    }
                                                                >
                                                                    {char.name}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                )}
                                            </div>

                                            {/* Dialogue text */}
                                            <div className="flex-1 min-w-0">
                                                {scene.script?.dialogue ? (
                                                    editingField?.sceneId ===
                                                        scene.id &&
                                                    editingField?.field ===
                                                        "dialogue" ? (
                                                        <textarea
                                                            defaultValue={
                                                                scene.script
                                                                    .dialogue
                                                            }
                                                            onBlur={(e) =>
                                                                handleDialogueChange(
                                                                    scene.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                        "Enter" &&
                                                                    !e.shiftKey
                                                                ) {
                                                                    e.preventDefault();
                                                                    handleDialogueChange(
                                                                        scene.id,
                                                                        e
                                                                            .currentTarget
                                                                            .value
                                                                    );
                                                                }
                                                            }}
                                                            onMouseUp={(e) =>
                                                                handleTextSelect(
                                                                    e,
                                                                    scene.id,
                                                                    "dialogue"
                                                                )
                                                            }
                                                            autoFocus
                                                            className="w-full rounded border bg-background p-1.5 text-xs italic"
                                                            rows={2}
                                                        />
                                                    ) : (
                                                        <p
                                                            onClick={() => {
                                                                // Only switch to edit mode if no text is selected
                                                                const selection =
                                                                    window.getSelection();
                                                                const selectedText =
                                                                    selection
                                                                        ?.toString()
                                                                        .trim();
                                                                if (
                                                                    !selectedText
                                                                ) {
                                                                    setEditingField(
                                                                        {
                                                                            sceneId:
                                                                                scene.id,
                                                                            field: "dialogue",
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                            onMouseUp={(e) =>
                                                                handleTextSelect(
                                                                    e,
                                                                    scene.id,
                                                                    "dialogue"
                                                                )
                                                            }
                                                            className="cursor-text rounded p-1 -m-1 text-xs italic hover:bg-muted/50"
                                                        >
                                                            &ldquo;
                                                            {
                                                                scene.script
                                                                    .dialogue
                                                            }
                                                            &rdquo;
                                                        </p>
                                                    )
                                                ) : (
                                                    <p
                                                        onClick={() => {
                                                            if (
                                                                scene.script
                                                                    ?.characterId
                                                            ) {
                                                                updateScene(
                                                                    scene.id,
                                                                    {
                                                                        script: {
                                                                            characterId:
                                                                                scene
                                                                                    .script
                                                                                    .characterId,
                                                                            dialogue:
                                                                                "",
                                                                        },
                                                                    }
                                                                );
                                                                setEditingField(
                                                                    {
                                                                        sceneId:
                                                                            scene.id,
                                                                        field: "dialogue",
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        className="cursor-text text-xs text-muted-foreground italic hover:bg-muted/50 rounded p-1 -m-1"
                                                    >
                                                        {scene.script
                                                            ?.characterId
                                                            ? "Add dialogue..."
                                                            : "Select speaker"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brand logo */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() =>
                                                handleBrandLogoToggle(scene.id)
                                            }
                                            className={cn(
                                                "flex h-4 w-4 items-center justify-center rounded border cursor-pointer text-xs",
                                                scene.includeBrandLogo
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "bg-background border-border hover:border-primary"
                                            )}
                                        >
                                            {scene.includeBrandLogo && "✓"}
                                        </button>
                                        <label className="text-xs text-muted-foreground">
                                            Brand logo
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
