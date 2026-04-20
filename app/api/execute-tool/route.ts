import { NextRequest, NextResponse } from "next/server";
import type {
    ProjectOverview,
    Aesthetic,
    Brand,
    Character,
    Scene,
    Location,
    CharacterAttire,
    BrandColor,
} from "@/lib/types";

// ============================================
// REQUEST TYPE
// ============================================

type ToolExecutionRequest = {
    toolName: string;
    args: Record<string, unknown>;
    projectState: {
        overview: ProjectOverview | null;
        aesthetic: Aesthetic | null;
        brand: Brand | null;
        characters: Character[];
        scenes: Scene[];
        locations: Location[];
        characterAttires: CharacterAttire[];
    };
};

// ============================================
// TOOL EXECUTION RESULTS
// ============================================

type ToolResult = {
    success: boolean;
    data?: unknown;
    error?: string;
    stateUpdates?: {
        type: string;
        payload: unknown;
    };
    additionalUpdates?: Array<{
        type: string;
        payload: unknown;
    }>;
};

// ============================================
// TOOL HANDLERS
// ============================================

function handleSaveOverview(args: Record<string, unknown>): ToolResult {
    const overview: ProjectOverview = {
        prompt: args.prompt as string,
        aspectRatio: args.aspectRatio as "9:16" | "16:9",
        targetDurationSeconds: args.targetDurationSeconds as number,
        supportingDocuments: [],
        additionalNotes: (args.additionalNotes as string) || "",
    };

    return {
        success: true,
        data: overview,
        stateUpdates: {
            type: "setOverview",
            payload: overview,
        },
    };
}

function handleSaveAesthetic(args: Record<string, unknown>): ToolResult {
    const aesthetic: Aesthetic = {
        id: crypto.randomUUID(),
        title: args.title as string,
        description: args.description as string,
        style: args.style as Aesthetic["style"],
        referenceImages: (args.referenceImageUrls as string[]) || [],
    };

    return {
        success: true,
        data: aesthetic,
        stateUpdates: {
            type: "setAesthetic",
            payload: aesthetic,
        },
    };
}

function handleSaveBrand(args: Record<string, unknown>): ToolResult {
    if (args.skipBrand) {
        return {
            success: true,
            data: null,
            stateUpdates: {
                type: "setBrand",
                payload: null,
            },
        };
    }

    const brand: Brand = {
        id: crypto.randomUUID(),
        name: (args.name as string) || "",
        description: (args.description as string) || "",
        logoUrl: (args.logoUrl as string) || null,
        colors: (args.colors as BrandColor[]) || [],
    };

    return {
        success: true,
        data: brand,
        stateUpdates: {
            type: "setBrand",
            payload: brand,
        },
    };
}

function handleAddCharacter(args: Record<string, unknown>): ToolResult {
    const characterId = crypto.randomUUID();
    const character: Character = {
        id: characterId,
        name: args.name as string,
        createdAt: Date.now(),
        referencePhotos: (args.referencePhotoUrls as string[]) || [],
        voiceSampleUrl: (args.voiceSampleUrl as string) || null,
        generatedAngles: [],
        voiceCloneId: null,
        status: "draft",
    };

    return {
        success: true,
        data: {
            ...character,
            // Include a clear message about the character ID for the agent
            message: `Character "${character.name}" created with ID: ${characterId}. Use this ID for generate_character_angles and create_voice_clone.`,
        },
        stateUpdates: {
            type: "addCharacter",
            payload: character,
        },
    };
}

function handleUpdateCharacter(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): ToolResult {
    const characterId = args.characterId as string;
    const character = projectState.characters.find((c) => c.id === characterId);

    if (!character) {
        return {
            success: false,
            error: `Character with ID ${characterId} not found`,
        };
    }

    const updates: Partial<Character> = {};
    if (args.name) updates.name = args.name as string;
    if (args.referencePhotoUrls)
        updates.referencePhotos = args.referencePhotoUrls as string[];
    if (args.voiceSampleUrl)
        updates.voiceSampleUrl = args.voiceSampleUrl as string;

    return {
        success: true,
        data: { characterId, updates },
        stateUpdates: {
            type: "updateCharacter",
            payload: { id: characterId, updates },
        },
    };
}

async function handleGenerateScript(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const additionalGuidance = args.additionalGuidance as string | undefined;

    // Validate we have the required data
    if (!projectState.overview) {
        return {
            success: false,
            error: "Cannot generate script without a project overview. Please complete the Project Overview first.",
        };
    }

    if (!projectState.aesthetic?.description) {
        return {
            success: false,
            error: "Cannot generate script without an art style. Please complete the Art Style & Aesthetic section first.",
        };
    }

    if (projectState.characters.length === 0) {
        return {
            success: false,
            error: "Cannot generate script without any characters. Please add at least one character first.",
        };
    }

    // Check that all characters are complete (have angles and voice clone)
    const incompleteCharacters = projectState.characters.filter(
        (c) => c.generatedAngles.length === 0 || !c.voiceCloneId
    );

    if (incompleteCharacters.length > 0) {
        const issues = incompleteCharacters.map((c) => {
            const missing: string[] = [];
            if (c.generatedAngles.length === 0)
                missing.push("reference angles");
            if (!c.voiceCloneId) missing.push("voice clone");
            return `"${c.name}" is missing: ${missing.join(", ")}`;
        });
        return {
            success: false,
            error: `All characters must be complete before generating the script. ${issues.join(
                ". "
            )}. Please complete all characters first.`,
        };
    }

    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/generate-script`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                overview: projectState.overview,
                aesthetic: projectState.aesthetic,
                brand: projectState.brand,
                characters: projectState.characters,
                additionalGuidance,
            }),
        });

        const data = await response.json();

        if (data.error) {
            return {
                success: false,
                error: data.error,
            };
        }

        // Return scenes only - locations and attires are generated during preprocessing
        return {
            success: true,
            data: {
                scenes: data.scenes,
                message: `Generated ${data.scenes.length} scenes. Review the script and make any edits. Once finalized, we'll run preprocessing to extract locations and character attires.`,
            },
            stateUpdates: {
                type: "setScenes",
                payload: data.scenes,
            },
        };
    } catch (error) {
        console.error("Error calling generate-script API:", error);
        return {
            success: false,
            error: "Failed to generate script. Please try again.",
        };
    }
}

/**
 * Handle editing a single scene with diff output
 */
function handleEditScene(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): ToolResult {
    const sceneNumber = args.sceneNumber as number | undefined;
    const sceneId = args.sceneId as string | undefined;
    const field = args.field as string;
    const newValue = args.newValue as string;
    const reason = args.reason as string | undefined;

    // Find the scene
    let scene: Scene | undefined;
    if (sceneNumber !== undefined && sceneNumber > 0) {
        scene = projectState.scenes[sceneNumber - 1];
    } else if (sceneId) {
        scene = projectState.scenes.find((s) => s.id === sceneId);
    }

    if (!scene) {
        return {
            success: false,
            error: `Scene not found. ${
                sceneNumber
                    ? `Scene ${sceneNumber} does not exist.`
                    : "Invalid scene ID."
            }`,
        };
    }

    // Capture old value for diff
    let oldValue: string = "";
    const update: Partial<Scene> = {};

    switch (field) {
        case "description":
            oldValue = scene.description;
            update.description = newValue;
            break;
        case "dialogue":
            oldValue = scene.script?.dialogue || "";
            if (scene.script) {
                update.script = { ...scene.script, dialogue: newValue };
            } else {
                return {
                    success: false,
                    error: "Cannot set dialogue without a speaker. Set the speaker first.",
                };
            }
            break;
        case "type":
            oldValue = scene.type;
            if (!["scene", "broll", "infographic"].includes(newValue)) {
                return {
                    success: false,
                    error: "Invalid scene type. Must be 'scene', 'broll', or 'infographic'.",
                };
            }
            update.type = newValue as Scene["type"];
            break;
        case "speaker":
            oldValue = scene.script?.characterId || "none";
            // Find character by name if not a UUID
            let characterId = newValue;
            if (newValue && !newValue.includes("-")) {
                const char = projectState.characters.find(
                    (c) => c.name.toLowerCase() === newValue.toLowerCase()
                );
                if (char) {
                    characterId = char.id;
                }
            }
            if (!characterId || characterId === "none") {
                update.script = null;
            } else {
                update.script = {
                    characterId,
                    dialogue: scene.script?.dialogue || "",
                };
            }
            break;
        case "includeBrandLogo":
            oldValue = scene.includeBrandLogo ? "true" : "false";
            update.includeBrandLogo = newValue.toLowerCase() === "true";
            break;
        default:
            return {
                success: false,
                error: `Unknown field: ${field}. Valid fields: description, dialogue, type, speaker, includeBrandLogo`,
            };
    }

    // Calculate the scene number for display
    const displaySceneNumber =
        sceneNumber || projectState.scenes.indexOf(scene) + 1;

    return {
        success: true,
        data: {
            sceneId: scene.id,
            sceneNumber: displaySceneNumber,
            field,
            oldValue,
            newValue,
            reason,
            message: `Updated Scene ${displaySceneNumber}: ${field}`,
        },
        stateUpdates: {
            type: "updateScene",
            payload: { id: scene.id, updates: update },
        },
    };
}

function handleUpdateScript(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): ToolResult {
    const updates = args.updates as Array<{
        sceneId: string;
        type?: string;
        description?: string;
        dialogue?: string;
        speakingCharacterId?: string;
        duration?: number;
        includeBrandLogo?: boolean;
    }>;

    // Capture diffs for each update
    const diffs: Array<{
        sceneNumber: number;
        field: string;
        oldValue: string;
        newValue: string;
    }> = [];

    for (const update of updates) {
        const scene = projectState.scenes.find((s) => s.id === update.sceneId);
        if (!scene) continue;

        const sceneNumber = projectState.scenes.indexOf(scene) + 1;

        // Check each field that could be updated
        if (update.type !== undefined && update.type !== scene.type) {
            diffs.push({
                sceneNumber,
                field: "type",
                oldValue: scene.type,
                newValue: update.type,
            });
        }

        if (
            update.description !== undefined &&
            update.description !== scene.description
        ) {
            diffs.push({
                sceneNumber,
                field: "description",
                oldValue: scene.description,
                newValue: update.description,
            });
        }

        if (update.dialogue !== undefined) {
            const oldDialogue = scene.script?.dialogue || "";
            if (update.dialogue !== oldDialogue) {
                diffs.push({
                    sceneNumber,
                    field: "dialogue",
                    oldValue: oldDialogue,
                    newValue: update.dialogue,
                });
            }
        }

        if (update.speakingCharacterId !== undefined) {
            const oldSpeaker = scene.script?.characterId || "";
            if (update.speakingCharacterId !== oldSpeaker) {
                // Get character names for display
                const oldChar = projectState.characters.find(
                    (c) => c.id === oldSpeaker
                );
                const newChar = projectState.characters.find(
                    (c) => c.id === update.speakingCharacterId
                );
                diffs.push({
                    sceneNumber,
                    field: "speaker",
                    oldValue: oldChar?.name || "(none)",
                    newValue: newChar?.name || "(none)",
                });
            }
        }

        if (update.includeBrandLogo !== undefined) {
            const oldBrandLogo = scene.includeBrandLogo ?? false;
            if (update.includeBrandLogo !== oldBrandLogo) {
                diffs.push({
                    sceneNumber,
                    field: "includeBrandLogo",
                    oldValue: oldBrandLogo ? "true" : "false",
                    newValue: update.includeBrandLogo ? "true" : "false",
                });
            }
        }
    }

    return {
        success: true,
        data: {
            updates,
            diffs,
            message: `Updated ${diffs.length} field(s) across ${updates.length} scene(s)`,
        },
        stateUpdates: {
            type: "updateScenes",
            payload: updates,
        },
    };
}

function handleAddScene(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): ToolResult {
    const insertAfterSceneId = args.insertAfterSceneId as string | null;

    // Calculate index
    let index = 0;
    if (insertAfterSceneId) {
        const afterScene = projectState.scenes.find(
            (s) => s.id === insertAfterSceneId
        );
        if (afterScene) {
            index = afterScene.index + 1;
        }
    }

    const scene: Scene = {
        id: crypto.randomUUID(),
        index,
        type: args.type as Scene["type"],
        duration: (args.duration as number) || 5,
        description: args.description as string,
        script: args.dialogue
            ? {
                  characterId: args.speakingCharacterId as string,
                  dialogue: args.dialogue as string,
              }
            : null,
        includeBrandLogo: (args.includeBrandLogo as boolean) || false,
        locationId: null,
        visualCharacterIds: (args.visualCharacterIds as string[]) || [],
        characterAttireIds: {},
        thumbnailUrl: null,
        thumbnailStatus: "pending",
        videoUrl: null,
        videoStatus: "pending",
    };

    return {
        success: true,
        data: scene,
        stateUpdates: {
            type: "addScene",
            payload: scene,
        },
    };
}

function handleRemoveScene(args: Record<string, unknown>): ToolResult {
    return {
        success: true,
        data: { sceneId: args.sceneId },
        stateUpdates: {
            type: "removeScene",
            payload: args.sceneId,
        },
    };
}

function handleUpdateChecklist(args: Record<string, unknown>): ToolResult {
    return {
        success: true,
        data: {
            itemId: args.itemId,
            status: args.status,
        },
        stateUpdates: {
            type: "updateChecklistItem",
            payload: { id: args.itemId, updates: { status: args.status } },
        },
    };
}

function handleShowPreview(args: Record<string, unknown>): ToolResult {
    return {
        success: true,
        data: {
            artifactType: args.artifactType,
            artifactId: args.artifactId,
        },
        stateUpdates: {
            type: "setCurrentArtifact",
            payload: {
                type: args.artifactType,
                data: args.artifactId || null,
            },
        },
    };
}

function handleRequestUpload(args: Record<string, unknown>): ToolResult {
    return {
        success: true,
        data: {
            uploadType: args.uploadType,
            purpose: args.purpose,
            multiple: args.multiple || false,
            targetId: args.targetId,
        },
    };
}

async function handleGenerateCharacterAngles(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    let characterId = args.characterId as string;

    // If the ID looks like a placeholder or doesn't exist, try to find by name
    let character = projectState.characters.find((c) => c.id === characterId);

    if (!character) {
        // Try to find the character by checking if the ID contains a name pattern
        // or just get the most recently added character
        const characterName = characterId
            .replace(/-ID-placeholder$/, "")
            .replace(/-/g, " ");
        character = projectState.characters.find(
            (c) => c.name.toLowerCase() === characterName.toLowerCase()
        );

        // If still not found, use the last added character
        if (!character && projectState.characters.length > 0) {
            character =
                projectState.characters[projectState.characters.length - 1];
        }
    }

    if (!character) {
        return {
            success: false,
            error: "Character not found. Please make sure the character is created first.",
        };
    }

    characterId = character.id;

    if (character.referencePhotos.length === 0) {
        return {
            success: false,
            error: "Character has no reference photos. Please upload reference photos first.",
        };
    }

    // Require aesthetic to be set for generating angles in the right style
    if (!projectState.aesthetic?.description) {
        return {
            success: false,
            error: "Cannot generate character angles without an art style. Please complete the Art Style & Aesthetic section first so the character angles match your visual style.",
        };
    }

    // Call the generation API asynchronously
    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/generate-angles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                characterId,
                referencePhotos: character.referencePhotos,
                characterName: character.name,
                aestheticDescription: projectState.aesthetic?.description, // Pass the art style
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: true,
                data: {
                    characterId,
                    message: `Angle generation started for ${character.name}. Processing in background.`,
                },
                stateUpdates: {
                    type: "updateCharacter",
                    payload: {
                        id: characterId,
                        updates: { status: "processing" },
                    },
                },
            };
        }

        // If we got immediate results, update with them
        const angles = data.angles || data.generatedAngles || [];
        return {
            success: true,
            data: {
                characterId,
                generatedAngles: angles,
                message: `Generated ${angles.length} reference angles for ${character.name}!`,
            },
            stateUpdates: {
                type: "updateCharacter",
                payload: {
                    id: characterId,
                    updates: {
                        generatedAngles: angles,
                        status: angles.length > 0 ? "ready" : "processing",
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error calling generate-angles API:", error);
        return {
            success: true,
            data: {
                characterId,
                message: `Started generating angles for ${character.name}. This may take a moment.`,
            },
            stateUpdates: {
                type: "updateCharacter",
                payload: { id: characterId, updates: { status: "processing" } },
            },
        };
    }
}

async function handleCreateVoiceClone(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    let characterId = args.characterId as string;

    // If the ID looks like a placeholder or doesn't exist, try to find by name
    let character = projectState.characters.find((c) => c.id === characterId);

    if (!character) {
        const characterName = characterId
            .replace(/-ID-placeholder$/, "")
            .replace(/-/g, " ");
        character = projectState.characters.find(
            (c) => c.name.toLowerCase() === characterName.toLowerCase()
        );

        if (!character && projectState.characters.length > 0) {
            character =
                projectState.characters[projectState.characters.length - 1];
        }
    }

    if (!character) {
        return {
            success: false,
            error: "Character not found. Please make sure the character is created first.",
        };
    }

    characterId = character.id;

    // Require angles to be generated first
    if (character.generatedAngles.length === 0) {
        return {
            success: false,
            error: `Character "${character.name}" needs generated reference angles before voice cloning. Please generate the 4-angle references first and confirm you're happy with them.`,
        };
    }

    if (!character.voiceSampleUrl) {
        return {
            success: false,
            error: `Character "${character.name}" has no voice sample. Please upload a voice sample (at least 10 seconds of clear speech) first.`,
        };
    }

    // Call the voice clone API
    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/create-voice-clone`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                characterId,
                voiceSampleUrl: character.voiceSampleUrl,
                characterName: character.name,
            }),
        });

        const data = await response.json();

        if (data.voiceCloneId) {
            return {
                success: true,
                data: {
                    characterId,
                    voiceCloneId: data.voiceCloneId,
                    message: `Voice clone created for ${character.name}!`,
                },
                stateUpdates: {
                    type: "updateCharacter",
                    payload: {
                        id: characterId,
                        updates: { voiceCloneId: data.voiceCloneId },
                    },
                },
            };
        }

        return {
            success: true,
            data: {
                characterId,
                message: `Voice clone creation started for ${character.name}. Processing...`,
            },
        };
    } catch (error) {
        console.error("Error calling create-voice-clone API:", error);
        return {
            success: false,
            error: "Failed to create voice clone. Please try again.",
        };
    }
}

/**
 * Handle preprocessing the script to extract locations, attires, and tag scenes
 */
async function handlePreprocessScript(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const confirmFinalized = args.confirmFinalized as boolean;

    if (!confirmFinalized) {
        return {
            success: false,
            error: "Script must be finalized before preprocessing. Set confirmFinalized to true.",
        };
    }

    if (!projectState.scenes || projectState.scenes.length === 0) {
        return {
            success: false,
            error: "No scenes found. Generate a script first.",
        };
    }

    // Verify all prerequisites are met
    if (!projectState.overview) {
        return {
            success: false,
            error: "Project overview is required. Please complete it first.",
        };
    }

    if (!projectState.aesthetic?.description) {
        return {
            success: false,
            error: "Art style is required. Please complete it first.",
        };
    }

    // Check that all characters are complete
    const incompleteCharacters = projectState.characters.filter(
        (c) => c.generatedAngles.length === 0 || !c.voiceCloneId
    );

    if (incompleteCharacters.length > 0) {
        const issues = incompleteCharacters.map((c) => {
            const missing: string[] = [];
            if (c.generatedAngles.length === 0)
                missing.push("reference angles");
            if (!c.voiceCloneId) missing.push("voice clone");
            return `"${c.name}" is missing: ${missing.join(", ")}`;
        });
        return {
            success: false,
            error: `All characters must be complete before preprocessing. ${issues.join(
                ". "
            )}. Please complete all characters first.`,
        };
    }

    try {
        const response = await fetch(
            `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/api/preprocess-script`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scenes: projectState.scenes,
                    characters: projectState.characters,
                    aesthetic: projectState.aesthetic,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Preprocessing API failed");
        }

        const result = await response.json();

        return {
            success: true,
            data: {
                locations: result.locations,
                attires: result.attires,
                sceneUpdates: result.sceneUpdates,
                message: `Preprocessing complete: ${result.locations.length} locations, ${result.attires.length} attires identified`,
            },
            stateUpdates: {
                type: "setLocations",
                payload: result.locations,
            },
            additionalUpdates: [
                {
                    type: "setCharacterAttires",
                    payload: result.attires,
                },
                // Update each scene with tagging info
                ...result.sceneUpdates.map(
                    (update: {
                        sceneId: string;
                        locationId: string | null;
                        visualCharacterIds: string[];
                        characterAttireIds: Record<string, string>;
                    }) => ({
                        type: "updateScene",
                        payload: {
                            id: update.sceneId,
                            updates: {
                                locationId: update.locationId,
                                visualCharacterIds: update.visualCharacterIds,
                                characterAttireIds: update.characterAttireIds,
                            },
                        },
                    })
                ),
            ],
        };
    } catch (error) {
        console.error("Error preprocessing script:", error);
        return {
            success: false,
            error: "Failed to preprocess script. Please try again.",
        };
    }
}

/**
 * Generate ALL preprocessing assets (locations + attires) in parallel
 * This waits for all to complete and returns all generated images
 */
async function handleGeneratePreprocessingAssets(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const confirmGenerate = args.confirmGenerate as boolean;

    if (!confirmGenerate) {
        return {
            success: false,
            error: "Must confirm generation by setting confirmGenerate to true.",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const pendingLocations = projectState.locations.filter(
        (l) => !l.referenceImageUrl
    );
    const pendingAttires = projectState.characterAttires.filter(
        (a) => a.referenceAngles.length === 0
    );

    if (pendingLocations.length === 0 && pendingAttires.length === 0) {
        return {
            success: true,
            data: {
                message: "All assets already generated",
                generatedLocations: [],
                generatedAttires: [],
            },
        };
    }

    console.log(
        `=== GENERATING PREPROCESSING ASSETS: ${pendingLocations.length} locations, ${pendingAttires.length} attires ===`
    );

    // Generate all in parallel
    const locationPromises = pendingLocations.map(async (loc) => {
        console.log(`Generating location image for: ${loc.name} (${loc.id})`);
        try {
            const response = await fetch(
                `${baseUrl}/api/generate-location-image`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        locationName: loc.name,
                        locationDescription: loc.description,
                        aestheticDescription:
                            projectState.aesthetic?.description,
                    }),
                }
            );
            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `Location generation failed for ${loc.name}:`,
                    response.status,
                    errorText
                );
                throw new Error(`Generation failed: ${response.status}`);
            }
            const result = await response.json();
            console.log(`Location image generated for: ${loc.name}`);
            return {
                id: loc.id,
                name: loc.name,
                imageUrl: result.imageUrl,
                success: true,
            };
        } catch (error) {
            console.error(`Error generating location ${loc.name}:`, error);
            return { id: loc.id, name: loc.name, success: false };
        }
    });

    const attirePromises = pendingAttires.map(async (attire) => {
        const character = projectState.characters.find(
            (c) => c.id === attire.characterId
        );
        if (!character || character.referencePhotos.length === 0) {
            return {
                id: attire.id,
                name: attire.name,
                characterName: character?.name || "Unknown",
                success: false,
            };
        }
        try {
            const response = await fetch(`${baseUrl}/api/generate-angles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    characterName: character.name,
                    referencePhotos: character.referencePhotos,
                    aestheticDescription: projectState.aesthetic?.description,
                    attireDescription: `${attire.name}: ${attire.description}`,
                }),
            });
            if (!response.ok) throw new Error("Generation failed");
            const result = await response.json();
            return {
                id: attire.id,
                name: attire.name,
                characterName: character.name,
                generatedAngles: result.generatedAngles,
                success: true,
            };
        } catch {
            return {
                id: attire.id,
                name: attire.name,
                characterName: character.name,
                success: false,
            };
        }
    });

    // Wait for all generations
    const [locationResults, attireResults] = await Promise.all([
        Promise.all(locationPromises),
        Promise.all(attirePromises),
    ]);

    // Build state updates
    const stateUpdates: Array<{ type: string; payload: unknown }> = [];

    const generatedLocations: Array<{
        id: string;
        name: string;
        imageUrl?: string;
    }> = [];
    for (const loc of locationResults) {
        if (loc.success && loc.imageUrl) {
            stateUpdates.push({
                type: "updateLocation",
                payload: {
                    id: loc.id,
                    updates: {
                        referenceImageUrl: loc.imageUrl,
                        status: "ready",
                    },
                },
            });
            generatedLocations.push({
                id: loc.id,
                name: loc.name,
                imageUrl: loc.imageUrl,
            });
        } else {
            stateUpdates.push({
                type: "updateLocation",
                payload: { id: loc.id, updates: { status: "error" } },
            });
        }
    }

    const generatedAttires: Array<{
        id: string;
        name: string;
        characterName: string;
        generatedAngles?: string[];
    }> = [];
    for (const att of attireResults) {
        if (att.success && att.generatedAngles) {
            stateUpdates.push({
                type: "updateCharacterAttire",
                payload: {
                    id: att.id,
                    updates: {
                        referenceAngles: att.generatedAngles,
                        status: "ready",
                    },
                },
            });
            generatedAttires.push({
                id: att.id,
                name: att.name,
                characterName: att.characterName,
                generatedAngles: att.generatedAngles,
            });
        } else {
            stateUpdates.push({
                type: "updateCharacterAttire",
                payload: { id: att.id, updates: { status: "error" } },
            });
        }
    }

    console.log(
        `=== GENERATION COMPLETE: ${generatedLocations.length}/${pendingLocations.length} locations, ${generatedAttires.length}/${pendingAttires.length} attires ===`
    );

    return {
        success: true,
        data: {
            message: `Generated ${generatedLocations.length} location images and ${generatedAttires.length} attire references`,
            generatedLocations,
            generatedAttires,
        },
        additionalUpdates: stateUpdates,
    };
}

/**
 * Generate a single location image (for missing/failed locations)
 */
async function handleGenerateLocationImage(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const locationId = args.locationId as string;

    let location = projectState.locations.find((l) => l.id === locationId);

    // If not found by ID, try to find by name (case-insensitive)
    if (!location) {
        location = projectState.locations.find(
            (l) => l.name.toLowerCase() === locationId.toLowerCase()
        );
    }

    if (!location) {
        return {
            success: false,
            error: `Location not found. Available locations: ${projectState.locations
                .map((l) => `"${l.name}" (id: ${l.id})`)
                .join(", ")}`,
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log(`=== GENERATING LOCATION IMAGE: ${location.name} ===`);

    try {
        const response = await fetch(`${baseUrl}/api/generate-location-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                locationName: location.name,
                locationDescription: location.description,
                aestheticDescription: projectState.aesthetic?.description,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Location generation failed:", errorText);
            throw new Error(`Generation failed: ${response.status}`);
        }
        const result = await response.json();

        console.log(`=== LOCATION IMAGE GENERATED: ${location.name} ===`);

        return {
            success: true,
            data: {
                locationId: location.id,
                locationName: location.name,
                imageUrl: result.imageUrl,
                message: `Generated image for ${location.name}`,
            },
            stateUpdates: {
                type: "updateLocation",
                payload: {
                    id: location.id,
                    updates: {
                        referenceImageUrl: result.imageUrl,
                        status: "ready",
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error generating location image:", error);
        return {
            success: false,
            error: `Failed to generate location image: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        };
    }
}

/**
 * Regenerate a location image with new instructions (edit existing)
 */
async function handleEditLocationImage(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const locationId = args.locationId as string;
    const instructions = args.instructions as string;
    const referenceLocationId = args.referenceLocationId as string | undefined;

    const location = projectState.locations.find((l) => l.id === locationId);
    if (!location) {
        // Try to find by name if ID doesn't match
        const locationByName = projectState.locations.find(
            (l) => l.name.toLowerCase() === locationId.toLowerCase()
        );
        if (!locationByName) {
            return {
                success: false,
                error: `Location not found. Available locations: ${projectState.locations
                    .map((l) => `"${l.name}" (id: ${l.id})`)
                    .join(", ")}`,
            };
        }
        // Use the found location
        return handleEditLocationImage(
            { ...args, locationId: locationByName.id },
            projectState
        );
    }

    // Get reference location if specified
    let referenceDescription = "";
    if (referenceLocationId) {
        const refLocation = projectState.locations.find(
            (l) => l.id === referenceLocationId
        );
        if (refLocation && refLocation.referenceImageUrl) {
            referenceDescription = `\n\nSTYLE REFERENCE: Match the visual style, color palette, and atmosphere of "${refLocation.name}" (${refLocation.description}).`;
        }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Check if location has an existing image to edit
    const existingImageUrl = location.referenceImageUrl;

    try {
        const response = await fetch(`${baseUrl}/api/generate-location-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                locationName: location.name,
                locationDescription: location.description,
                aestheticDescription: projectState.aesthetic?.description,
                additionalInstructions: instructions + referenceDescription,
                existingImageUrl, // Pass existing image for true editing
            }),
        });

        if (!response.ok) throw new Error("Generation failed");
        const result = await response.json();

        return {
            success: true,
            data: {
                locationId: location.id,
                locationName: location.name,
                imageUrl: result.imageUrl,
                instructions,
                message: `Regenerated image for ${location.name}`,
            },
            stateUpdates: {
                type: "updateLocation",
                payload: {
                    id: location.id,
                    updates: {
                        referenceImageUrl: result.imageUrl,
                        status: "ready",
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error regenerating location image:", error);
        return {
            success: false,
            error: "Failed to regenerate location image",
        };
    }
}

/**
 * Regenerate attire angles with new instructions
 */
async function handleEditAttireAngles(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const attireId = args.attireId as string;
    const instructions = args.instructions as string;
    const referenceLocationId = args.referenceLocationId as string | undefined;

    const attire = projectState.characterAttires.find((a) => a.id === attireId);
    if (!attire) {
        return {
            success: false,
            error: `Attire not found. Available attires: ${projectState.characterAttires
                .map((a) => `"${a.name}" (id: ${a.id})`)
                .join(", ")}`,
        };
    }

    const character = projectState.characters.find(
        (c) => c.id === attire.characterId
    );
    if (!character || character.referencePhotos.length === 0) {
        return {
            success: false,
            error: "Character not found or has no reference photos",
        };
    }

    // Get reference location style if specified
    let styleReference = "";
    if (referenceLocationId) {
        const refLocation = projectState.locations.find(
            (l) => l.id === referenceLocationId
        );
        if (refLocation) {
            styleReference = `. Style should match the visual aesthetic of "${refLocation.name}" location (${refLocation.description})`;
        }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
        const response = await fetch(`${baseUrl}/api/generate-angles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                characterName: character.name,
                referencePhotos: character.referencePhotos,
                aestheticDescription: projectState.aesthetic?.description,
                attireDescription: `${attire.name}: ${attire.description}${styleReference}. ADDITIONAL: ${instructions}`,
            }),
        });

        if (!response.ok) throw new Error("Generation failed");
        const result = await response.json();

        return {
            success: true,
            data: {
                attireId,
                attireName: attire.name,
                characterName: character.name,
                generatedAngles: result.generatedAngles,
                instructions,
                message: `Regenerated angles for ${character.name} - ${attire.name}`,
            },
            stateUpdates: {
                type: "updateCharacterAttire",
                payload: {
                    id: attireId,
                    updates: {
                        referenceAngles: result.generatedAngles,
                        status: "ready",
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error regenerating attire angles:", error);
        return {
            success: false,
            error: "Failed to regenerate attire angles",
        };
    }
}

// ============================================
// THUMBNAIL HANDLERS
// ============================================

/**
 * Generate thumbnails for all scenes
 */
async function handleGenerateAllThumbnails(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const confirmGenerate = args.confirmGenerate as boolean;

    if (!confirmGenerate) {
        return {
            success: false,
            error: "Must confirm generation by setting confirmGenerate to true.",
        };
    }

    // Validate prerequisites
    if (!projectState.scenes || projectState.scenes.length === 0) {
        return {
            success: false,
            error: "No scenes found. Generate a script first.",
        };
    }

    if (!projectState.aesthetic?.description) {
        return {
            success: false,
            error: "Art style is required for thumbnail generation.",
        };
    }

    // Check if preprocessing is complete (locations and attires exist)
    const hasLocations = projectState.locations.length > 0;
    const hasAttires = projectState.characterAttires.length > 0;

    if (!hasLocations && !hasAttires) {
        return {
            success: false,
            error: "Preprocessing must be complete before generating thumbnails. Run preprocess_script first.",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const aspectRatio = projectState.overview?.aspectRatio || "16:9";

    console.log("=== GENERATING THUMBNAILS FOR ALL SCENES (PARALLEL) ===");
    console.log(`Total scenes: ${projectState.scenes.length}`);

    // Generate all thumbnails in parallel using Promise.all
    const thumbnailPromises = projectState.scenes.map(async (scene) => {
        console.log(
            `Starting thumbnail generation for scene ${scene.index + 1}...`
        );

        // Get location image if assigned
        const location = scene.locationId
            ? projectState.locations.find((l) => l.id === scene.locationId)
            : null;

        // Get characters and their attires for this scene
        const charactersInScene: Array<{
            name: string;
            attireName: string;
            attireAngles: string[];
        }> = [];

        for (const charId of scene.visualCharacterIds) {
            const character = projectState.characters.find(
                (c) => c.id === charId
            );
            if (!character) continue;

            const attireId = scene.characterAttireIds[charId];
            const attire = attireId
                ? projectState.characterAttires.find((a) => a.id === attireId)
                : null;

            charactersInScene.push({
                name: character.name,
                attireName: attire?.name || "default",
                attireAngles:
                    attire?.referenceAngles || character.generatedAngles,
            });
        }

        // Get speaker name
        let speakerName: string | null = null;
        if (scene.script?.characterId) {
            const speaker = projectState.characters.find(
                (c) => c.id === scene.script?.characterId
            );
            speakerName = speaker?.name || null;
        }

        try {
            const response = await fetch(`${baseUrl}/api/generate-thumbnail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sceneId: scene.id,
                    sceneIndex: scene.index,
                    sceneType: scene.type,
                    sceneDescription: scene.description,
                    dialogue: scene.script?.dialogue || null,
                    speakerName,
                    aspectRatio,
                    aestheticDescription: projectState.aesthetic?.description,
                    locationImageUrl: location?.referenceImageUrl || null,
                    charactersInScene,
                    includeBrandLogo: scene.includeBrandLogo,
                    brandName: projectState.brand?.name || null,
                }),
            });

            if (!response.ok) {
                console.error(
                    `Failed to generate thumbnail for scene ${scene.index + 1}`
                );
                return {
                    success: false,
                    sceneId: scene.id,
                    sceneIndex: scene.index,
                    description: scene.description,
                };
            }

            const result = await response.json();
            console.log(`✓ Generated thumbnail for scene ${scene.index + 1}`);

            return {
                success: true,
                sceneId: scene.id,
                sceneIndex: scene.index,
                thumbnailUrl: result.thumbnailUrl,
                description: scene.description,
            };
        } catch (error) {
            console.error(
                `Error generating thumbnail for scene ${scene.index + 1}:`,
                error
            );
            return {
                success: false,
                sceneId: scene.id,
                sceneIndex: scene.index,
                description: scene.description,
            };
        }
    });

    // Wait for all thumbnails to complete
    const results = await Promise.all(thumbnailPromises);

    // Process results
    const generatedThumbnails: Array<{
        sceneId: string;
        sceneIndex: number;
        thumbnailUrl: string;
        description: string;
    }> = [];

    const stateUpdates: Array<{
        type: string;
        payload: unknown;
    }> = [];

    for (const result of results) {
        if (result.success && result.thumbnailUrl) {
            generatedThumbnails.push({
                sceneId: result.sceneId,
                sceneIndex: result.sceneIndex,
                thumbnailUrl: result.thumbnailUrl,
                description: result.description,
            });
            stateUpdates.push({
                type: "updateScene",
                payload: {
                    id: result.sceneId,
                    updates: {
                        thumbnailUrl: result.thumbnailUrl,
                        thumbnailStatus: "ready",
                    },
                },
            });
        } else {
            stateUpdates.push({
                type: "updateScene",
                payload: {
                    id: result.sceneId,
                    updates: { thumbnailStatus: "error" },
                },
            });
        }
    }

    // Sort by scene index for consistent display
    generatedThumbnails.sort((a, b) => a.sceneIndex - b.sceneIndex);

    return {
        success: true,
        data: {
            generatedThumbnails,
            totalGenerated: generatedThumbnails.length,
            totalScenes: projectState.scenes.length,
            aspectRatio,
            message: `Generated ${generatedThumbnails.length} of ${projectState.scenes.length} thumbnails.`,
        },
        additionalUpdates: stateUpdates,
    };
}

/**
 * Edit a specific scene's thumbnail
 */
async function handleEditThumbnail(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const sceneNumber = args.sceneNumber as number;
    const instructions = args.instructions as string;

    if (!sceneNumber || sceneNumber < 1) {
        return {
            success: false,
            error: "Invalid scene number. Must be 1 or greater.",
        };
    }

    const scene = projectState.scenes[sceneNumber - 1];
    if (!scene) {
        return {
            success: false,
            error: `Scene ${sceneNumber} not found. There are only ${projectState.scenes.length} scenes.`,
        };
    }

    if (!scene.thumbnailUrl) {
        return {
            success: false,
            error: `Scene ${sceneNumber} doesn't have a thumbnail yet. Generate thumbnails first.`,
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const aspectRatio = projectState.overview?.aspectRatio || "16:9";

    // Get location image if assigned
    const location = scene.locationId
        ? projectState.locations.find((l) => l.id === scene.locationId)
        : null;

    // Get characters and their attires for this scene
    const charactersInScene: Array<{
        name: string;
        attireName: string;
        attireAngles: string[];
    }> = [];

    for (const charId of scene.visualCharacterIds) {
        const character = projectState.characters.find((c) => c.id === charId);
        if (!character) continue;

        const attireId = scene.characterAttireIds[charId];
        const attire = attireId
            ? projectState.characterAttires.find((a) => a.id === attireId)
            : null;

        charactersInScene.push({
            name: character.name,
            attireName: attire?.name || "default",
            attireAngles: attire?.referenceAngles || character.generatedAngles,
        });
    }

    // Get speaker name
    let speakerName: string | null = null;
    if (scene.script?.characterId) {
        const speaker = projectState.characters.find(
            (c) => c.id === scene.script?.characterId
        );
        speakerName = speaker?.name || null;
    }

    console.log(`=== EDITING THUMBNAIL FOR SCENE ${sceneNumber} ===`);
    console.log(`Instructions: ${instructions}`);

    try {
        const response = await fetch(`${baseUrl}/api/generate-thumbnail`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sceneId: scene.id,
                sceneIndex: scene.index,
                sceneType: scene.type,
                sceneDescription: scene.description,
                dialogue: scene.script?.dialogue || null,
                speakerName,
                aspectRatio,
                aestheticDescription: projectState.aesthetic?.description,
                locationImageUrl: location?.referenceImageUrl || null,
                charactersInScene,
                includeBrandLogo: scene.includeBrandLogo,
                brandName: projectState.brand?.name || null,
                existingThumbnailUrl: scene.thumbnailUrl,
                editInstructions: instructions,
            }),
        });

        if (!response.ok) {
            throw new Error("Thumbnail edit failed");
        }

        const result = await response.json();

        return {
            success: true,
            data: {
                sceneId: scene.id,
                sceneNumber,
                thumbnailUrl: result.thumbnailUrl,
                instructions,
                message: `Edited thumbnail for Scene ${sceneNumber}`,
            },
            stateUpdates: {
                type: "updateScene",
                payload: {
                    id: scene.id,
                    updates: {
                        thumbnailUrl: result.thumbnailUrl,
                        thumbnailStatus: "ready",
                    },
                },
            },
        };
    } catch (error) {
        console.error("Error editing thumbnail:", error);
        return {
            success: false,
            error: `Failed to edit thumbnail for Scene ${sceneNumber}`,
        };
    }
}

// ============================================
// VIDEO GENERATION HANDLERS
// ============================================

/**
 * Generate videos for all scenes
 */
async function handleGenerateAllVideos(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const confirmGenerate = args.confirmGenerate as boolean;

    if (!confirmGenerate) {
        return {
            success: false,
            error: "Must confirm generation by setting confirmGenerate to true.",
        };
    }

    // Validate prerequisites
    if (!projectState.scenes || projectState.scenes.length === 0) {
        return {
            success: false,
            error: "No scenes found. Generate a script first.",
        };
    }

    // Check if all thumbnails are ready
    const scenesWithoutThumbnails = projectState.scenes.filter(
        (s) => !s.thumbnailUrl || s.thumbnailStatus !== "ready"
    );

    if (scenesWithoutThumbnails.length > 0) {
        return {
            success: false,
            error: `${scenesWithoutThumbnails.length} scene(s) don't have thumbnails ready. Generate all thumbnails first.`,
        };
    }

    if (!projectState.aesthetic?.description) {
        return {
            success: false,
            error: "Art style is required for video generation.",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const aspectRatio = projectState.overview?.aspectRatio || "16:9";

    console.log("=== GENERATING VIDEOS FOR ALL SCENES (PARALLEL) ===");
    console.log(`Total scenes: ${projectState.scenes.length}`);
    console.log(`Aspect ratio: ${aspectRatio}`);

    // Generate all videos in parallel using Promise.all
    const videoPromises = projectState.scenes.map(async (scene) => {
        console.log(
            `Starting video generation for scene ${scene.index + 1}...`
        );

        // Get characters and their attires for this scene
        const charactersInScene: Array<{
            name: string;
            attireName: string;
            attireAngles: string[];
        }> = [];

        for (const charId of scene.visualCharacterIds) {
            const character = projectState.characters.find(
                (c) => c.id === charId
            );
            if (!character) continue;

            const attireId = scene.characterAttireIds[charId];
            const attire = attireId
                ? projectState.characterAttires.find((a) => a.id === attireId)
                : null;

            charactersInScene.push({
                name: character.name,
                attireName: attire?.name || "default",
                attireAngles:
                    attire?.referenceAngles || character.generatedAngles,
            });
        }

        // Get speaker name
        let speakerName: string | null = null;
        if (scene.script?.characterId) {
            const speaker = projectState.characters.find(
                (c) => c.id === scene.script?.characterId
            );
            speakerName = speaker?.name || null;
        }

        try {
            const response = await fetch(`${baseUrl}/api/generate-video`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sceneId: scene.id,
                    sceneIndex: scene.index,
                    sceneType: scene.type,
                    sceneDescription: scene.description,
                    dialogue: scene.script?.dialogue || null,
                    speakerName,
                    aspectRatio,
                    aestheticDescription: projectState.aesthetic?.description,
                    thumbnailUrl: scene.thumbnailUrl,
                    charactersInScene,
                    includeBrandLogo: scene.includeBrandLogo,
                    brandName: projectState.brand?.name || null,
                }),
            });

            if (!response.ok) {
                console.error(
                    `Failed to generate video for scene ${scene.index + 1}`
                );
                return {
                    success: false,
                    sceneId: scene.id,
                    sceneIndex: scene.index,
                    description: scene.description,
                };
            }

            const result = await response.json();
            console.log(`✓ Generated video for scene ${scene.index + 1}`);

            return {
                success: true,
                sceneId: scene.id,
                sceneIndex: scene.index,
                videoUrl: result.videoUrl,
                description: scene.description,
            };
        } catch (error) {
            console.error(
                `Error generating video for scene ${scene.index + 1}:`,
                error
            );
            return {
                success: false,
                sceneId: scene.id,
                sceneIndex: scene.index,
                description: scene.description,
            };
        }
    });

    // Wait for all videos to complete
    const results = await Promise.all(videoPromises);

    // Process results
    const generatedVideos: Array<{
        sceneId: string;
        sceneIndex: number;
        videoUrl: string;
        description: string;
    }> = [];

    const stateUpdates: Array<{
        type: string;
        payload: unknown;
    }> = [];

    for (const result of results) {
        if (result.success && result.videoUrl) {
            generatedVideos.push({
                sceneId: result.sceneId,
                sceneIndex: result.sceneIndex,
                videoUrl: result.videoUrl,
                description: result.description,
            });
            stateUpdates.push({
                type: "updateScene",
                payload: {
                    id: result.sceneId,
                    updates: {
                        videoUrl: result.videoUrl,
                        videoStatus: "ready",
                    },
                },
            });
        } else {
            stateUpdates.push({
                type: "updateScene",
                payload: {
                    id: result.sceneId,
                    updates: { videoStatus: "error" },
                },
            });
        }
    }

    // Sort by scene index for consistent display
    generatedVideos.sort((a, b) => a.sceneIndex - b.sceneIndex);

    return {
        success: true,
        data: {
            generatedVideos,
            totalGenerated: generatedVideos.length,
            totalScenes: projectState.scenes.length,
            aspectRatio,
            message: `Generated ${generatedVideos.length} of ${projectState.scenes.length} videos.`,
        },
        additionalUpdates: stateUpdates,
    };
}

// ============================================
// FINAL VIDEO HANDLER
// ============================================

/**
 * Stitch all scene videos into a final video
 */
async function handleStitchFinalVideo(
    args: Record<string, unknown>,
    projectState: ToolExecutionRequest["projectState"]
): Promise<ToolResult> {
    const confirmStitch = args.confirmStitch as boolean;

    if (!confirmStitch) {
        return {
            success: false,
            error: "Must confirm by setting confirmStitch to true.",
        };
    }

    // Validate prerequisites
    if (!projectState.scenes || projectState.scenes.length === 0) {
        return {
            success: false,
            error: "No scenes found. Generate a script first.",
        };
    }

    // Check if all videos are ready
    const scenesWithoutVideos = projectState.scenes.filter(
        (s) => !s.videoUrl || s.videoStatus !== "ready"
    );

    if (scenesWithoutVideos.length > 0) {
        return {
            success: false,
            error: `${scenesWithoutVideos.length} scene(s) don't have videos ready. Generate all videos first.`,
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const aspectRatio = projectState.overview?.aspectRatio || "16:9";
    const projectName =
        projectState.overview?.prompt?.substring(0, 50) || "video-project";

    console.log("=== STITCHING FINAL VIDEO ===");
    console.log(`Total scenes: ${projectState.scenes.length}`);

    try {
        // Get video URLs in order
        const videoUrls = projectState.scenes
            .sort((a, b) => a.index - b.index)
            .map((s) => s.videoUrl!)
            .filter((url) => url);

        const response = await fetch(`${baseUrl}/api/stitch-video`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                videoUrls,
                projectName,
                aspectRatio,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to stitch videos");
        }

        const result = await response.json();

        console.log(`✓ Final video created: ${result.videoUrl}`);

        return {
            success: true,
            data: {
                finalVideo: {
                    videoUrl: result.videoUrl,
                    totalScenes: result.totalScenes,
                    totalDuration: result.totalDuration,
                    aspectRatio: result.aspectRatio,
                    fileName: result.fileName,
                },
                message: result.message,
            },
            stateUpdates: {
                type: "setFinalVideoUrl",
                payload: result.videoUrl,
            },
        };
    } catch (error) {
        console.error("Error stitching final video:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to stitch videos",
        };
    }
}

// ============================================
// MAIN ENDPOINT
// ============================================

export async function POST(request: NextRequest) {
    try {
        const body: ToolExecutionRequest = await request.json();
        const { toolName, args, projectState } = body;

        let result: ToolResult;

        switch (toolName) {
            case "save_overview":
                result = handleSaveOverview(args);
                break;
            case "save_aesthetic":
                result = handleSaveAesthetic(args);
                break;
            case "save_brand":
                result = handleSaveBrand(args);
                break;
            case "add_character":
                result = handleAddCharacter(args);
                break;
            case "update_character":
                result = handleUpdateCharacter(args, projectState);
                break;
            case "generate_script":
                result = await handleGenerateScript(args, projectState);
                break;
            case "edit_scene":
                result = handleEditScene(args, projectState);
                break;
            case "update_script":
                result = handleUpdateScript(args, projectState);
                break;
            case "add_scene":
                result = handleAddScene(args, projectState);
                break;
            case "remove_scene":
                result = handleRemoveScene(args);
                break;
            case "preprocess_script":
                result = await handlePreprocessScript(args, projectState);
                break;
            case "generate_preprocessing_assets":
                result = await handleGeneratePreprocessingAssets(
                    args,
                    projectState
                );
                break;
            case "generate_location_image":
                result = await handleGenerateLocationImage(args, projectState);
                break;
            case "edit_location_image":
                result = await handleEditLocationImage(args, projectState);
                break;
            case "edit_attire_angles":
                result = await handleEditAttireAngles(args, projectState);
                break;
            case "generate_all_thumbnails":
                result = await handleGenerateAllThumbnails(args, projectState);
                break;
            case "edit_thumbnail":
                result = await handleEditThumbnail(args, projectState);
                break;
            case "generate_all_videos":
                result = await handleGenerateAllVideos(args, projectState);
                break;
            case "stitch_final_video":
                result = await handleStitchFinalVideo(args, projectState);
                break;
            case "update_checklist":
                result = handleUpdateChecklist(args);
                break;
            case "show_preview":
                result = handleShowPreview(args);
                break;
            case "request_upload":
                result = handleRequestUpload(args);
                break;
            case "generate_character_angles":
                result = await handleGenerateCharacterAngles(
                    args,
                    projectState
                );
                break;
            case "create_voice_clone":
                result = await handleCreateVoiceClone(args, projectState);
                break;
            default:
                result = {
                    success: false,
                    error: `Unknown tool: ${toolName}`,
                };
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Tool execution error:", error);
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Tool execution failed",
            },
            { status: 500 }
        );
    }
}
