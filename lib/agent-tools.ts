import { Type } from "@google/genai";

// ============================================
// FUNCTION DECLARATIONS FOR GEMINI AGENT
// ============================================

/**
 * Tool to save/update the project overview
 */
export const saveOverviewTool = {
    name: "save_overview",
    description:
        "Save or update the project overview with the video concept, aspect ratio, and target duration. Call this when the user has provided enough information about what they want to create.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            prompt: {
                type: Type.STRING,
                description:
                    "A detailed description of what the video should be about, including the main message, tone, and any specific requirements.",
            },
            aspectRatio: {
                type: Type.STRING,
                enum: ["9:16", "16:9"],
                description:
                    "The aspect ratio of the video. 9:16 for vertical/portrait (TikTok, Reels), 16:9 for horizontal/landscape (YouTube).",
            },
            targetDurationSeconds: {
                type: Type.NUMBER,
                description:
                    "The target duration of the video in seconds. Typically between 15 and 120 seconds.",
            },
            additionalNotes: {
                type: Type.STRING,
                description:
                    "Any additional notes or context about the project that don't fit elsewhere.",
            },
        },
        required: ["prompt", "aspectRatio", "targetDurationSeconds"],
    },
};

/**
 * Tool to save/update the aesthetic/style guidelines
 */
export const saveAestheticTool = {
    name: "save_aesthetic",
    description:
        "Save or update the visual style and aesthetic guidelines for the video. Call this after the user has described their preferred art style or uploaded reference images.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description:
                    "A short title for this aesthetic (e.g., 'Cyberpunk Neon', 'Warm Corporate').",
            },
            description: {
                type: Type.STRING,
                description:
                    "A detailed description of the visual style including colors, mood, lighting, and artistic influences.",
            },
            style: {
                type: Type.STRING,
                enum: [
                    "realistic",
                    "cartoonish",
                    "anime",
                    "painterly",
                    "other",
                ],
                description: "The broad category of the art style.",
            },
            referenceImageUrls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                    "URLs of reference images that represent the desired aesthetic. These should be UploadThing URLs from user uploads.",
            },
        },
        required: ["title", "description", "style"],
    },
};

/**
 * Tool to save/update brand guidelines
 */
export const saveBrandTool = {
    name: "save_brand",
    description:
        "Save or update the brand guidelines. Call this when the user provides brand information like logo, colors, or brand name. Can also be called with skipBrand=true if user wants no branding.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            skipBrand: {
                type: Type.BOOLEAN,
                description:
                    "Set to true if the user explicitly doesn't want any branding in the video.",
            },
            name: {
                type: Type.STRING,
                description: "The name of the brand.",
            },
            description: {
                type: Type.STRING,
                description: "A brief description of what the brand does.",
            },
            logoUrl: {
                type: Type.STRING,
                description: "URL of the brand logo (UploadThing URL).",
            },
            colors: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description:
                                "Name of the color (e.g., 'Primary Blue').",
                        },
                        hex: {
                            type: Type.STRING,
                            description:
                                "Hex code of the color (e.g., '#1a73e8').",
                        },
                    },
                    required: ["name", "hex"],
                },
                description: "Array of brand colors with names and hex codes.",
            },
        },
        required: [],
    },
};

/**
 * Tool to add a new character
 */
export const addCharacterTool = {
    name: "add_character",
    description:
        "Add a new character to the video project. Call this when the user provides information about a character including their name and reference images.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "The name of the character.",
            },
            referencePhotoUrls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                    "URLs of reference photos for this character (UploadThing URLs). At least 1 required, max 5 recommended.",
            },
            voiceSampleUrl: {
                type: Type.STRING,
                description:
                    "URL of an audio sample of the character's voice for cloning (UploadThing URL). Should be at least 10 seconds.",
            },
        },
        required: ["name", "referencePhotoUrls"],
    },
};

/**
 * Tool to update an existing character
 */
export const updateCharacterTool = {
    name: "update_character",
    description:
        "Update an existing character's information. Use this to add more reference photos, change the name, or add a voice sample.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            characterId: {
                type: Type.STRING,
                description: "The ID of the character to update.",
            },
            name: {
                type: Type.STRING,
                description: "New name for the character (if changing).",
            },
            referencePhotoUrls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                    "New or additional reference photos (replaces existing if provided).",
            },
            voiceSampleUrl: {
                type: Type.STRING,
                description: "URL of voice sample for cloning.",
            },
        },
        required: ["characterId"],
    },
};

/**
 * Tool to generate the video script
 * This calls the actual script generation API and returns scenes that will be
 * displayed inline in the chat and in the artifact panel.
 */
export const generateScriptTool = {
    name: "generate_script",
    description:
        "Generate a complete video script using AI. This will create a scene-by-scene breakdown with dialogue. The script will be displayed for the user to review and edit. Call this when the user is ready to generate their script. This is a LONG RUNNING operation that may take 30-60 seconds.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            additionalGuidance: {
                type: Type.STRING,
                description:
                    "Any additional guidance for the script generation (e.g., specific hooks, CTAs, pacing preferences, tone, style notes from the user).",
            },
        },
        required: [],
    },
};

/**
 * Tool to edit a specific scene in the script
 * This is used when the user wants to make targeted changes to a scene.
 * The output will show a diff of changes made.
 */
export const editSceneTool = {
    name: "edit_scene",
    description:
        "Edit a specific scene in the script. Use this when the user provides context from the script (highlighted text) and wants to make changes. This will show a before/after diff of the changes. You can reference scenes by their number (1-indexed).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            sceneNumber: {
                type: Type.NUMBER,
                description:
                    "The scene number to edit (1-indexed, e.g., 1 for first scene).",
            },
            sceneId: {
                type: Type.STRING,
                description:
                    "Alternative: the UUID of the scene to edit. Use sceneNumber if you know it.",
            },
            field: {
                type: Type.STRING,
                enum: [
                    "description",
                    "dialogue",
                    "type",
                    "speaker",
                    "includeBrandLogo",
                ],
                description:
                    "Which field to edit. Use 'includeBrandLogo' to enable/disable brand logo on a scene.",
            },
            newValue: {
                type: Type.STRING,
                description:
                    "The new value for the field. For type: 'scene', 'broll', or 'infographic'. For speaker: character ID or name. For includeBrandLogo: 'true' or 'false'.",
            },
            reason: {
                type: Type.STRING,
                description:
                    "Brief explanation of why this change is being made (shown to user).",
            },
        },
        required: ["field", "newValue"],
    },
};

/**
 * Tool to update multiple scenes at once
 */
export const updateScriptTool = {
    name: "update_script",
    description:
        "Update multiple scenes in the script at once. Use edit_scene for single targeted changes with diff view.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            updates: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sceneId: {
                            type: Type.STRING,
                            description: "ID of the scene to update.",
                        },
                        type: {
                            type: Type.STRING,
                            enum: ["scene", "broll", "infographic"],
                            description: "Type of scene.",
                        },
                        description: {
                            type: Type.STRING,
                            description: "Visual description of the scene.",
                        },
                        dialogue: {
                            type: Type.STRING,
                            description:
                                "Dialogue or voiceover text (if applicable).",
                        },
                        speakingCharacterId: {
                            type: Type.STRING,
                            description:
                                "ID of the character speaking (if applicable).",
                        },
                        duration: {
                            type: Type.NUMBER,
                            description:
                                "Duration in seconds (max 8 for video scenes).",
                        },
                        includeBrandLogo: {
                            type: Type.BOOLEAN,
                            description:
                                "Whether to include the brand logo in this scene.",
                        },
                    },
                    required: ["sceneId"],
                },
                description: "Array of scene updates to apply.",
            },
        },
        required: ["updates"],
    },
};

/**
 * Tool to add a new scene
 */
export const addSceneTool = {
    name: "add_scene",
    description: "Add a new scene to the script at a specific position.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            insertAfterSceneId: {
                type: Type.STRING,
                description:
                    "ID of the scene after which to insert the new scene. If null, insert at the beginning.",
            },
            type: {
                type: Type.STRING,
                enum: ["scene", "broll", "infographic"],
                description:
                    "Type of scene: 'scene' for speaking with lip sync, 'broll' for action/voiceover, 'infographic' for static image.",
            },
            description: {
                type: Type.STRING,
                description: "Visual description of what happens in the scene.",
            },
            dialogue: {
                type: Type.STRING,
                description: "Dialogue or voiceover text (if applicable).",
            },
            speakingCharacterId: {
                type: Type.STRING,
                description:
                    "ID of the character speaking (required for 'scene' type).",
            },
            visualCharacterIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                    "IDs of characters appearing visually in the scene.",
            },
            duration: {
                type: Type.NUMBER,
                description: "Duration in seconds (max 8 for video scenes).",
            },
            includeBrandLogo: {
                type: Type.BOOLEAN,
                description: "Whether to include the brand logo in this scene.",
            },
        },
        required: ["type", "description"],
    },
};

/**
 * Tool to remove a scene
 */
export const removeSceneTool = {
    name: "remove_scene",
    description: "Remove a scene from the script.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            sceneId: {
                type: Type.STRING,
                description: "ID of the scene to remove.",
            },
        },
        required: ["sceneId"],
    },
};

/**
 * Tool to run preprocessing on the finalized script
 * This extracts locations, attires, and tags scenes with visual characters
 */
export const preprocessScriptTool = {
    name: "preprocess_script",
    description:
        "Analyze the finalized script to extract unique locations, character attires, and tag each scene with visual characters. Call this ONLY after the user confirms the script is finalized. This is a long-running operation that will show progress.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            confirmFinalized: {
                type: Type.BOOLEAN,
                description:
                    "Must be true to confirm the script is finalized and ready for preprocessing.",
            },
        },
        required: ["confirmFinalized"],
    },
};

/**
 * Tool to generate ALL preprocessing assets at once (locations + attires)
 * This waits for completion and shows all generated images inline
 */
export const generatePreprocessingAssetsTool = {
    name: "generate_preprocessing_assets",
    description:
        "Generate reference images for ALL locations and 4-angle references for ALL character attires. This is a long-running operation that generates everything in parallel and waits for completion. Call this AFTER preprocess_script has extracted the locations and attires. The results will be shown inline.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            confirmGenerate: {
                type: Type.BOOLEAN,
                description:
                    "Must be true to confirm you want to generate all assets.",
            },
        },
        required: ["confirmGenerate"],
    },
};

/**
 * Tool to generate a single location image (for missing/failed locations)
 */
export const generateLocationImageTool = {
    name: "generate_location_image",
    description:
        "Generate a reference image for a specific location. Use this for locations that don't have images yet or where generation failed. For locations that already have images but need changes, use edit_location_image instead.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            locationId: {
                type: Type.STRING,
                description: "ID of the location to generate an image for.",
            },
        },
        required: ["locationId"],
    },
};

/**
 * Tool to regenerate a specific location image with new instructions
 */
export const editLocationImageTool = {
    name: "edit_location_image",
    description:
        "Regenerate a location's reference image with specific feedback or instructions. Use this ONLY when the user wants to CHANGE how an existing location looks. For locations without images, use generate_location_image instead. You can optionally reference another location's image to match its style.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            locationId: {
                type: Type.STRING,
                description: "ID of the location to regenerate.",
            },
            instructions: {
                type: Type.STRING,
                description:
                    "Instructions for how to change the image (e.g., 'make it brighter', 'add more modern furniture', 'change to night time').",
            },
            referenceLocationId: {
                type: Type.STRING,
                description:
                    "Optional: ID of another location to use as style reference. The new image will match the visual style of this referenced location.",
            },
        },
        required: ["locationId", "instructions"],
    },
};

/**
 * Tool to regenerate a specific attire's reference angles
 */
export const editAttireAnglesTool = {
    name: "edit_attire_angles",
    description:
        "Regenerate a character attire's 4-angle reference images with specific feedback. Use this when the user wants to change how an attire looks. You can optionally reference a location for style consistency.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            attireId: {
                type: Type.STRING,
                description: "ID of the attire to regenerate.",
            },
            instructions: {
                type: Type.STRING,
                description:
                    "Instructions for how to change the attire (e.g., 'make the suit darker', 'add a tie', 'change to casual style').",
            },
            referenceLocationId: {
                type: Type.STRING,
                description:
                    "Optional: ID of a location to use as style reference. The attire will match the visual style/palette of this location.",
            },
        },
        required: ["attireId", "instructions"],
    },
};

/**
 * Tool to generate thumbnails for all scenes
 * This generates scene-by-scene and waits for each to complete
 */
export const generateAllThumbnailsTool = {
    name: "generate_all_thumbnails",
    description:
        "Generate thumbnail images for ALL scenes in the script. This uses character attire references, location images, and scene descriptions to create compelling preview frames. Call this AFTER preprocessing is complete. Thumbnails are generated one by one and shown inline.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            confirmGenerate: {
                type: Type.BOOLEAN,
                description:
                    "Must be true to confirm you want to generate all thumbnails.",
            },
        },
        required: ["confirmGenerate"],
    },
};

/**
 * Tool to edit a specific scene's thumbnail
 */
export const editThumbnailTool = {
    name: "edit_thumbnail",
    description:
        "Edit or regenerate a specific scene's thumbnail with new instructions. Use this when the user wants to change how a scene thumbnail looks. The edit will use the same character and location references.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            sceneNumber: {
                type: Type.NUMBER,
                description:
                    "The scene number (1-indexed) to edit the thumbnail for.",
            },
            instructions: {
                type: Type.STRING,
                description:
                    "Instructions for how to change the thumbnail (e.g., 'make the character's expression more serious', 'change the camera angle to a close-up', 'add more dramatic lighting').",
            },
        },
        required: ["sceneNumber", "instructions"],
    },
};

/**
 * Tool to generate videos for all scenes using Veo 3.1
 */
export const generateAllVideosTool = {
    name: "generate_all_videos",
    description:
        "Generate video clips for ALL scenes using Veo 3.1. This uses thumbnails as reference frames and character reference images (for landscape) to generate 8-second video clips with audio. Call this AFTER all thumbnails are approved. Videos are generated one by one in sequence. For 16:9 (landscape) videos, character reference grids are included. For 9:16 (portrait) videos, only the thumbnail is used as the first frame.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            confirmGenerate: {
                type: Type.BOOLEAN,
                description:
                    "Must be true to confirm you want to generate all videos.",
            },
        },
        required: ["confirmGenerate"],
    },
};

/**
 * Tool to stitch all scene videos into a final video using ffmpeg
 */
export const stitchFinalVideoTool = {
    name: "stitch_final_video",
    description:
        "Stitch all scene videos together into a single final video using ffmpeg. Call this AFTER all scene videos are generated and approved. The final video will be available for download.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            confirmStitch: {
                type: Type.BOOLEAN,
                description:
                    "Must be true to confirm you want to create the final video.",
            },
        },
        required: ["confirmStitch"],
    },
};

/**
 * Tool to update the checklist status
 */
export const updateChecklistTool = {
    name: "update_checklist",
    description:
        "Update the status of a checklist item. Use this to mark items as in_progress, completed, or skipped.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            itemId: {
                type: Type.STRING,
                enum: [
                    "overview",
                    "aesthetic",
                    "brand",
                    "characters",
                    "script",
                    "preprocessing",
                    "thumbnails",
                    "videos",
                    "final_video",
                ],
                description: "ID of the checklist item to update.",
            },
            status: {
                type: Type.STRING,
                enum: ["not_started", "in_progress", "completed", "skipped"],
                description: "New status for the checklist item.",
            },
        },
        required: ["itemId", "status"],
    },
};

/**
 * Tool to show current project state in the preview panel
 */
export const showPreviewTool = {
    name: "show_preview",
    description:
        "Display specific project data in the preview panel on the right side. Use this to show the user what has been saved.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            artifactType: {
                type: Type.STRING,
                enum: [
                    "overview",
                    "aesthetic",
                    "brand",
                    "character",
                    "script",
                    "location",
                    "attire",
                ],
                description: "Type of artifact to display.",
            },
            artifactId: {
                type: Type.STRING,
                description:
                    "ID of the specific item to show (for character, location, attire). Not needed for overview, aesthetic, brand, or script.",
            },
        },
        required: ["artifactType"],
    },
};

/**
 * Tool to request file upload from user
 */
export const requestUploadTool = {
    name: "request_upload",
    description:
        "Request the user to upload specific files. This will show an upload prompt in the chat.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            uploadType: {
                type: Type.STRING,
                enum: ["image", "audio", "document"],
                description: "Type of file to request.",
            },
            purpose: {
                type: Type.STRING,
                description:
                    "What the upload is for (e.g., 'character reference', 'voice sample', 'brand logo', 'style reference', 'project brief').",
            },
            multiple: {
                type: Type.BOOLEAN,
                description: "Whether multiple files can be uploaded.",
            },
            targetId: {
                type: Type.STRING,
                description:
                    "ID of the entity this upload is for (e.g., character ID). Optional.",
            },
        },
        required: ["uploadType", "purpose"],
    },
};

/**
 * Tool to trigger character angle generation
 */
export const generateCharacterAnglesTool = {
    name: "generate_character_angles",
    description:
        "Trigger the generation of 4 reference angle images for a character. This uses AI to create consistent character references. Call this after a character has reference photos uploaded. The system will automatically match by character name if the exact ID is not found.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            characterId: {
                type: Type.STRING,
                description:
                    "ID of the character to generate angles for. If unsure of the ID, you can use the character's name and the system will find the matching character.",
            },
        },
        required: ["characterId"],
    },
};

/**
 * Tool to trigger voice cloning
 */
export const createVoiceCloneTool = {
    name: "create_voice_clone",
    description:
        "Create an Eleven Labs voice clone from a character's audio sample. Call this after a character has a voice sample uploaded. The system will automatically match by character name if the exact ID is not found.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            characterId: {
                type: Type.STRING,
                description:
                    "ID of the character to create voice clone for. If unsure of the ID, you can use the character's name and the system will find the matching character.",
            },
        },
        required: ["characterId"],
    },
};

// ============================================
// ALL TOOLS ARRAY
// ============================================

export const agentTools = [
    saveOverviewTool,
    saveAestheticTool,
    saveBrandTool,
    addCharacterTool,
    updateCharacterTool,
    generateScriptTool,
    editSceneTool,
    updateScriptTool,
    addSceneTool,
    removeSceneTool,
    preprocessScriptTool,
    generatePreprocessingAssetsTool,
    generateLocationImageTool,
    editLocationImageTool,
    editAttireAnglesTool,
    generateAllThumbnailsTool,
    editThumbnailTool,
    generateAllVideosTool,
    stitchFinalVideoTool,
    updateChecklistTool,
    showPreviewTool,
    requestUploadTool,
    generateCharacterAnglesTool,
    createVoiceCloneTool,
];

// ============================================
// SYSTEM INSTRUCTION
// ============================================

export const SYSTEM_INSTRUCTION = `You are a friendly and professional AI Video Director assistant helping users create videos using AI. Your role is to guide users through the video creation process step by step, gathering all necessary information before video generation can begin.

## CRITICAL: Always Respond to the User
**IMPORTANT**: Every response MUST include a conversational message to the user. Even when you use tool calls, you MUST also provide text that:
- Acknowledges what you've done or are doing
- Tells them what's happening next
- Asks for input if needed

Never send a response with only tool calls and no text message. The user should always see friendly feedback.

## Your Personality
- Be warm, encouraging, and helpful
- Ask clarifying questions when needed
- Offer creative suggestions and recommendations
- Be concise but thorough in your responses
- Celebrate progress and milestones with the user

## The Video Creation Process

You need to gather information in a **strict progression**. Each stage has prerequisites that MUST be completed first.

### STAGE DEPENDENCIES (CRITICAL):
1. **Project Overview** → No prerequisites
2. **Art Style & Aesthetic** → No prerequisites  
3. **Brand Guidelines** → No prerequisites (optional)
4. **Characters** → REQUIRES: Art Style (for generating angles in the right visual style)
   - Each character MUST have: reference angles AND voice clone before proceeding
5. **Script & Scenes** → REQUIRES: Overview, Aesthetic, AND all characters fully complete (angles + voice clone)
6. **Preprocessing** → REQUIRES: Finalized script, all characters fully complete
7. **Thumbnails** → REQUIRES: Preprocessing complete (locations and attires generated)
8. **Video Generation** → REQUIRES: All thumbnails approved
9. **Final Video** → REQUIRES: All scene videos generated

### 1. Project Overview (Required)
- What the video is about (main concept, message, purpose)
- Aspect ratio (9:16 for vertical/TikTok/Reels, 16:9 for horizontal/YouTube)
- Target duration (typically 15-120 seconds)
- Any supporting documents or briefs the user wants to upload

### 2. Art Style & Aesthetic (Required)
- Visual style preference (realistic, cartoonish, anime, painterly, etc.)
- Reference images for the desired look
- Mood, color palette, and atmosphere description
- **MUST be completed before adding characters** (so character angles match the style)

### 3. Brand Guidelines (Optional)
- Ask if the user wants to include branding
- If yes: brand name, logo, brand colors (hex codes)
- If no: mark as skipped

### 4. Characters (Required if video has people)
- **PREREQUISITE: Art Style must be set first**
- Each character needs:
  - A name
  - At least 1 reference photo (up to 5 recommended)
  - A voice sample for cloning (at least 10 seconds of clear speech)
- **Character Completion Flow (ALL steps required)**:
  1. Upload reference photos
  2. Generate 4-angle reference images (uses the art style/aesthetic)
  3. **Ask user if angles look good** - iterate if needed
  4. Upload voice sample (at least 10 seconds)
  5. Create voice clone
  6. **Confirm voice clone created successfully**
- **A character is NOT complete until they have BOTH generated angles AND a voice clone**
- Do NOT proceed to script generation until ALL characters are fully complete

### 5. Script & Scenes (Required)
- **PREREQUISITES**: Overview, Aesthetic, AND all characters with angles + voice clones
- Generate a scene-by-scene breakdown based on the overview using the generate_script tool
- The script will be displayed inline in the chat AND in the artifact panel on the right
- Each scene shows:
  - Type selector: "scene" (speaking), "broll" (b-roll), or "infographic"
  - Visual description: What appears on screen
  - Dialogue/voiceover: Character avatar + spoken text
  - Brand logo checkbox (use sparingly - typically only at the end or for key moments)
- **IMPORTANT: Script Iteration**:
  - The user can DIRECTLY EDIT the script in the artifact panel (change type, description, dialogue, speaker)
  - The user can also HIGHLIGHT text in the script and add it to context for their next message
  - When users provide context from the script (shown as "[Regarding Scene X, field: "text"]"), they want you to make specific changes
  - Use the edit_scene tool for targeted single-scene edits - this will show a before/after diff
  - Use update_script for multiple scene changes at once
  - The edit_scene tool takes sceneNumber (1-indexed), field (description/dialogue/type/speaker/includeBrandLogo), newValue, and optionally reason
  - For includeBrandLogo, use "true" or "false" as newValue
  - The script stage is iterative - keep refining until the user is happy
  - Only proceed to preprocessing AFTER user explicitly confirms the script is finalized

### 6. Preprocessing Assets (After script is finalized)
- **PREREQUISITES**: Finalized script, all characters fully complete (angles + voice clone)
- ONLY run preprocessing AFTER user explicitly confirms the script is finalized
- First, ask the user if they have any final changes to the script
- Once confirmed, call preprocess_script tool - this will:
  - Analyze the script to extract unique locations
  - Extract unique character attires (clothing for each character)
  - Tag each scene with which characters appear visually and which location
- The preprocessing results will be shown in the artifact panel

**After preprocessing completes:**
- Call generate_preprocessing_assets tool - this generates ALL assets at once:
  - Location reference images (one per location)
  - 4-angle references for each character attire
- This is a long-running operation - it will show loading and then display ALL generated images inline
- Wait for this to complete before moving on

**For missing/failed assets:**
- If a location image failed or is missing: use generate_location_image (not edit_location_image!)
- generate_location_image is for creating NEW images for locations that don't have one yet

**For user edits to existing assets:**
- If user wants to CHANGE an existing location image: use edit_location_image with instructions
- If user wants to CHANGE an existing attire: use edit_attire_angles with instructions
- These edit tools are ONLY for modifying images that already exist, not for generating missing ones

### 7. Scene Thumbnails (After preprocessing is complete)
- **PREREQUISITES**: Preprocessing complete with all location images and character attires generated
- ONLY generate thumbnails AFTER preprocessing assets are complete
- First, ask the user if they're happy with all the location images and character attires
- Once confirmed, call generate_all_thumbnails tool - this will:
  - Generate a thumbnail preview frame for EACH scene
  - Use the location image as the background
  - Include character attire references to maintain character consistency
  - Match the art style/aesthetic from the project
  - Generate in the correct aspect ratio (16:9 or 9:16)
- Thumbnails are generated ONE BY ONE in sequence (not parallel)
- All thumbnails will be displayed inline in the chat once complete
- The thumbnails will also appear in the artifact panel on the right

**Thumbnail Iteration:**
- After generating all thumbnails, ask the user if they want any changes
- If user wants to CHANGE a specific thumbnail: use edit_thumbnail with:
  - sceneNumber: which scene (1-indexed)
  - instructions: what to change (e.g., "make the character's expression more serious", "zoom out more", "add more dramatic lighting")
- The edit will regenerate that specific thumbnail with the same character/location references
- Iterate until the user is happy with all thumbnails
- Once all thumbnails are approved, mark thumbnails checklist as complete

**Important Notes:**
- Thumbnails serve as preview frames that help visualize each scene before video generation
- They use the same character and location references as the preprocessing stage
- If branding is enabled for a scene, it will be subtly incorporated into the thumbnail

### 8. Video Generation (Final stage)
- **PREREQUISITES**: All thumbnails approved by the user
- ONLY generate videos AFTER user explicitly confirms all thumbnails look good
- Ask the user: "Are you happy with all the thumbnails? If so, I'll proceed to generate the video clips for each scene."
- Once confirmed, call generate_all_videos tool - this will:
  - Generate an 8-second video clip for EACH scene using Veo 3.1
  - Use the thumbnail as a reference/first frame
  - For landscape (16:9) videos: Include character reference grids (2x2 grid of 4 angles) for up to 2 characters
  - For portrait (9:16) videos: Only use the thumbnail as the first frame (Veo 3.1 limitation)
  - Generate appropriate audio including dialogue and ambient sounds

**Video Generation Process:**
- Videos are generated ONE BY ONE in sequence (this is a long operation per scene)
- Each video is 8 seconds long
- The prompt includes the scene description, dialogue (if any), and character names
- For scenes with dialogue, the model will generate voice audio matching the character
- All generated videos will be displayed inline in the chat
- Videos will also appear in the artifact panel for playback

**Important Notes about Veo 3.1:**
- For 16:9 (landscape): Uses reference images (thumbnail + character grids) for better consistency
- For 9:16 (portrait): Due to API limitations, only uses the thumbnail as first frame (no reference images)
- All videos are 8 seconds long with natively generated audio
- Video generation can take 1-2 minutes per scene

**After Video Generation:**
- All videos will be displayed for playback
- Users can view each scene's video individually
- Mark the videos checklist as complete
- Ask the user if they're ready to create the final video

### 9. Final Video (Last stage)
- **PREREQUISITES**: All scene videos generated successfully
- Ask the user: "All scene videos are ready! Would you like me to stitch them together into a single final video for download?"
- Once confirmed, call stitch_final_video tool - this will:
  - Download all scene videos
  - Use ffmpeg to concatenate them in order
  - Upload the final video to storage
  - Provide a download button

**Final Video Process:**
- The final video is created by joining all scene videos in sequence
- Uses ffmpeg for fast, lossless concatenation
- The resulting video will be available with a clear download button
- Mark final_video checklist as complete
- 🎉 Congratulate the user on completing their video project!

## Important Guidelines

1. **Be Flexible**: Users can provide information in any order. Adapt to their flow while ensuring everything is eventually gathered.

2. **Use Tools Appropriately**: 
   - Call save tools when you have sufficient information
   - Use show_preview to display saved information to the user
   - Use request_upload when you need specific files
   - Update the checklist as sections are completed

3. **Iterate Collaboratively**: 
   - Show what you've saved and ask for confirmation
   - Accept feedback and make changes
   - Don't rush - quality matters more than speed

4. **Handle Uploads**:
   - When users upload files, acknowledge them
   - Each uploaded file has a "type" field: "image", "audio", or "document"
   - For character creation: images go to referencePhotoUrls, audio goes to voiceSampleUrl
   - If a user uploads multiple file types at once, sort them appropriately by type
   - Always confirm what you received (e.g., "I received 3 reference photos and 1 voice sample for Antoine")

5. **Script Writing**:
   - Create engaging hooks in the first few seconds
   - Keep dialogue natural and conversational
   - Balance speaking scenes with b-roll
   - Consider pacing and visual variety

6. **Be Proactive**:
   - Suggest improvements when you see opportunities
   - Warn about potential issues (e.g., too long scenes)
   - Offer creative alternatives

## Starting a Session

When the user first messages you:
1. Greet them warmly
2. Ask what kind of video they want to create
3. Offer to let them upload any existing briefs or documents
4. Guide them through the process naturally

Remember: Your goal is to gather all the information needed to create an amazing video while making the process enjoyable and collaborative for the user.`;
