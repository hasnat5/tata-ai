"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Shirt, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AttireArtifactProps = {
    attireId?: string;
    onSelectAttire: (id: string) => void;
    onBack: () => void;
};

export function AttireArtifact({
    attireId,
    onSelectAttire,
    onBack,
}: AttireArtifactProps) {
    const { project, updateCharacterAttire } = useAppStore();
    const attires = project?.characterAttires || [];
    const characters = project?.characters || [];
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    const attire = attireId ? attires.find((a) => a.id === attireId) : null;

    const handleGenerateAngles = async (attId: string) => {
        setRegeneratingId(attId);
        updateCharacterAttire(attId, { status: "generating" });

        try {
            const att = attires.find((a) => a.id === attId);
            if (!att) return;

            const character = characters.find((c) => c.id === att.characterId);
            if (!character || character.referencePhotos.length === 0) {
                updateCharacterAttire(attId, { status: "error" });
                return;
            }

            const response = await fetch("/api/generate-angles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    characterName: character.name,
                    referencePhotos: character.referencePhotos,
                    aestheticDescription: project?.aesthetic?.description,
                    attireDescription: `${att.name}: ${att.description}`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                updateCharacterAttire(attId, {
                    referenceAngles: result.generatedAngles,
                    status: "ready",
                });
            } else {
                updateCharacterAttire(attId, { status: "error" });
            }
        } catch {
            updateCharacterAttire(attId, { status: "error" });
        } finally {
            setRegeneratingId(null);
        }
    };

    // Show specific attire detail
    if (attireId && attire) {
        const char = characters.find((c) => c.id === attire.characterId);
        const isGenerating =
            attire.status === "generating" || regeneratingId === attire.id;

        return (
            <div className="space-y-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    {char?.referencePhotos[0] && (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={char.referencePhotos[0]}
                                alt={char.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <h4 className="font-medium">{attire.name}</h4>
                        <p className="text-xs text-muted-foreground">
                            {char?.name || "Unknown"} • {attire.description}
                        </p>
                    </div>
                </div>

                {/* Generated angles */}
                {attire.referenceAngles.length > 0 ? (
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                            Reference Angles
                        </h4>
                        <div className="flex gap-1">
                            {attire.referenceAngles.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="h-16 w-16 overflow-hidden rounded border border-primary/20 bg-muted"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Angle ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : isGenerating ? (
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                            Reference Angles
                        </h4>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3].map((idx) => (
                                <div
                                    key={idx}
                                    className="h-16 w-16 overflow-hidden rounded border border-primary/20 bg-muted flex items-center justify-center"
                                >
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground animate-pulse">
                            Generating 4-angle references...
                        </p>
                    </div>
                ) : null}

                {/* Generate button */}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateAngles(attire.id)}
                    disabled={isGenerating}
                    className="w-full"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {attire.referenceAngles.length > 0
                        ? "Regenerate Angles"
                        : "Generate Angles"}
                </Button>

                {/* Status */}
                <div className="flex items-center gap-2 text-xs">
                    <span
                        className={
                            attire.status === "ready"
                                ? "text-green-500"
                                : attire.status === "error"
                                ? "text-red-500"
                                : "text-muted-foreground"
                        }
                    >
                        {attire.status === "ready"
                            ? "✓ Ready"
                            : attire.status === "generating"
                            ? "Generating..."
                            : attire.status === "error"
                            ? "Error"
                            : "Pending"}
                    </span>
                </div>
            </div>
        );
    }

    if (attireId && !attire) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Attire not found</p>
            </div>
        );
    }

    // Show attire list grouped by character
    const attiresByCharacter = new Map<string, typeof attires>();
    attires.forEach((att) => {
        const existing = attiresByCharacter.get(att.characterId) || [];
        existing.push(att);
        attiresByCharacter.set(att.characterId, existing);
    });

    return (
        <div className="space-y-3">
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3 w-3" />
                Back to Preprocessing
            </button>
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
                Character Attires ({attires.length})
            </h4>
            {attires.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No attires extracted yet. Run preprocessing after finalizing
                    the script.
                </p>
            ) : (
                <div className="space-y-3">
                    {Array.from(attiresByCharacter.entries()).map(
                        ([charId, charAttires]) => {
                            const char = characters.find(
                                (c) => c.id === charId
                            );
                            return (
                                <div key={charId} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {char?.referencePhotos[0] && (
                                            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={
                                                        char.referencePhotos[0]
                                                    }
                                                    alt={char.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <span className="text-xs font-medium">
                                            {char?.name || "Unknown"}
                                        </span>
                                    </div>
                                    <div className="space-y-1 pl-8">
                                        {charAttires.map((att) => {
                                            const isGenerating =
                                                att.status === "generating" ||
                                                regeneratingId === att.id;

                                            return (
                                                <button
                                                    key={att.id}
                                                    onClick={() =>
                                                        onSelectAttire(att.id)
                                                    }
                                                    className="flex w-full items-center gap-2 rounded border p-1.5 text-left hover:border-primary hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted flex items-center justify-center">
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
                                                        ) : isGenerating ? (
                                                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                        ) : (
                                                            <Shirt className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium truncate">
                                                            {att.name}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {att.status ===
                                                            "ready"
                                                                ? "✓ Ready"
                                                                : att.status ===
                                                                  "generating"
                                                                ? "Generating..."
                                                                : "Pending"}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}
