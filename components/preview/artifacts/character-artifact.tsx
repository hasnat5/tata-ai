"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Users, ArrowLeft } from "lucide-react";

type CharacterArtifactProps = {
    characterId?: string;
    onSelectCharacter: (id: string) => void;
    onBack: () => void;
};

export function CharacterArtifact({
    characterId,
    onSelectCharacter,
    onBack,
}: CharacterArtifactProps) {
    const { project } = useAppStore();
    const characters = project?.characters || [];

    const character = characterId
        ? characters.find((c) => c.id === characterId)
        : null;

    // Show specific character detail
    if (characterId && character) {
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
                    {character.referencePhotos[0] && (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={character.referencePhotos[0]}
                                alt={character.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <h4 className="font-medium">{character.name}</h4>
                        <span
                            className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-xs capitalize",
                                character.status === "ready"
                                    ? "bg-green-500/10 text-green-500"
                                    : character.status === "processing"
                                      ? "bg-yellow-500/10 text-yellow-500"
                                      : character.status === "error"
                                        ? "bg-red-500/10 text-red-500"
                                        : "bg-muted text-muted-foreground"
                            )}
                        >
                            {character.status}
                        </span>
                    </div>
                </div>

                {/* Reference photos - compact inline */}
                {character.referencePhotos.length > 0 && (
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                            Reference Photos
                        </h4>
                        <div className="flex gap-1">
                            {character.referencePhotos.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="h-10 w-10 overflow-hidden rounded bg-muted"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Ref ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generated angles - compact inline */}
                {character.generatedAngles.length > 0 ? (
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                            Generated Angles
                        </h4>
                        <div className="flex gap-1">
                            {character.generatedAngles.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="h-10 w-10 overflow-hidden rounded border border-primary/20 bg-muted"
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
                ) : character.status === "processing" ? (
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">
                            Generated Angles
                        </h4>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3].map((idx) => (
                                <div
                                    key={idx}
                                    className="h-10 w-10 overflow-hidden rounded border border-primary/20 bg-muted flex items-center justify-center"
                                >
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground animate-pulse">
                            Generating...
                        </p>
                    </div>
                ) : null}

                {/* Status indicators */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                        className={
                            character.generatedAngles.length > 0
                                ? "text-green-500"
                                : "text-muted-foreground"
                        }
                    >
                        {character.generatedAngles.length > 0 ? "✓" : "○"} Angles
                    </span>
                    <span
                        className={
                            character.voiceSampleUrl
                                ? "text-green-500"
                                : "text-muted-foreground"
                        }
                    >
                        {character.voiceSampleUrl ? "✓" : "○"} Voice
                    </span>
                    <span
                        className={
                            character.voiceCloneId
                                ? "text-green-500"
                                : "text-muted-foreground"
                        }
                    >
                        {character.voiceCloneId ? "✓" : "○"} Clone
                    </span>
                </div>
            </div>
        );
    }

    // Character not found
    if (characterId && !character) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Character not found</p>
            </div>
        );
    }

    // Show character list (compact)
    return (
        <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
                Characters ({characters.length})
            </h4>
            {characters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No characters added yet
                </p>
            ) : (
                <div className="space-y-1">
                    {characters.map((char) => (
                        <button
                            key={char.id}
                            onClick={() => onSelectCharacter(char.id)}
                            className="flex w-full items-center gap-2 rounded-lg border p-2 text-left hover:border-primary hover:bg-muted/50 transition-colors"
                        >
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                                {char.referencePhotos[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={char.referencePhotos[0]}
                                        alt={char.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                    {char.name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {char.status}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
