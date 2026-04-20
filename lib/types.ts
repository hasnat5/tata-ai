// ============================================
// CORE ENTITY TYPES
// ============================================

export type AspectRatio = "9:16" | "16:9";

export type ProjectStatus =
    | "gathering_overview"
    | "gathering_aesthetic"
    | "gathering_brand"
    | "gathering_characters"
    | "scripting"
    | "preprocessing"
    | "ready";

// ============================================
// CHARACTER TYPES
// ============================================

export type Character = {
    id: string;
    name: string;
    createdAt: number;
    // User inputs (uploaded to UploadThing, stored as URLs)
    referencePhotos: string[]; // UploadThing URLs, max 5
    voiceSampleUrl: string | null; // UploadThing URL, min 10 seconds audio
    // Generated outputs
    generatedAngles: string[]; // 4 angle reference images from NanoBanana Pro
    voiceCloneId: string | null; // Eleven Labs voice clone ID
    // Status
    status: "draft" | "processing" | "ready" | "error";
    error?: string;
};

// ============================================
// BRAND TYPES
// ============================================

export type BrandColor = {
    name: string;
    hex: string;
};

export type Brand = {
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    colors: BrandColor[];
};

// ============================================
// AESTHETIC TYPES
// ============================================

export type Aesthetic = {
    id: string;
    title: string;
    description: string;
    referenceImages: string[]; // UploadThing URLs
    style: "realistic" | "cartoonish" | "anime" | "painterly" | "other";
};

// ============================================
// OVERVIEW TYPES
// ============================================

export type ProjectOverview = {
    prompt: string;
    aspectRatio: AspectRatio;
    targetDurationSeconds: number;
    supportingDocuments: string[]; // URLs to uploaded PDFs or documents
    additionalNotes: string;
};

// ============================================
// SCENE AND SCRIPT TYPES
// ============================================

export type SceneType = "scene" | "broll" | "infographic";

export type SceneScript = {
    characterId: string;
    dialogue: string;
};

export type Scene = {
    id: string;
    index: number;
    type: SceneType;
    duration: number; // seconds (max 8 for video scenes)
    description: string;
    // WHO SPEAKS - character providing dialogue/voiceover audio
    script: SceneScript | null;
    // Whether to include brand logo in this scene
    includeBrandLogo: boolean;
    // Location for this scene
    locationId: string | null;
    // WHO APPEARS VISUALLY - ordered list of character IDs
    visualCharacterIds: string[];
    // Which attire each character wears (characterId -> attireId)
    characterAttireIds: Record<string, string>;
    // Generated thumbnail for this scene
    thumbnailUrl: string | null;
    thumbnailStatus: "pending" | "generating" | "ready" | "error";
    // Generated video for this scene
    videoUrl: string | null;
    videoStatus: "pending" | "generating" | "ready" | "error";
};

// ============================================
// PREPROCESSING TYPES
// ============================================

export type Location = {
    id: string;
    name: string;
    description: string;
    referenceImageUrl: string | null;
    status: "pending" | "generating" | "ready" | "error";
};

export type CharacterAttire = {
    id: string;
    characterId: string;
    name: string;
    description: string;
    // 4 angle reference images in this attire
    referenceAngles: string[];
    status: "pending" | "generating" | "ready" | "error";
};

// ============================================
// VIDEO PROJECT TYPES
// ============================================

export type VideoProject = {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    // Gathering stages
    overview: ProjectOverview | null;
    aesthetic: Aesthetic | null;
    brand: Brand | null;
    characters: Character[];
    // Script
    scenes: Scene[];
    // Preprocessing
    locations: Location[];
    characterAttires: CharacterAttire[];
    // Final output
    finalVideoUrl: string | null;
    // Status
    status: ProjectStatus;
};

// ============================================
// CHAT MESSAGE TYPES
// ============================================

export type MessageRole = "user" | "assistant";

export type UploadedFile = {
    url: string;
    name: string;
    type: "image" | "audio" | "document";
};

export type ToolExecutionStatus = "pending" | "running" | "completed" | "error";

export type ToolCallResult = {
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    status?: ToolExecutionStatus;
    error?: string;
    // For tools that produce visual output
    outputImages?: string[];
    outputMessage?: string;
};

// Script edit diff for display
export type ScriptEditDiff = {
    sceneNumber: number;
    field: string;
    oldValue: string;
    newValue: string;
    reason?: string;
};

// Preprocessing result for display
export type PreprocessingResult = {
    locationsCount: number;
    attiresCount: number;
    scenesTagged: number;
};

// Generated assets result for display
export type GeneratedAssetsResult = {
    generatedLocations: Array<{
        id: string;
        name: string;
        imageUrl?: string;
    }>;
    generatedAttires: Array<{
        id: string;
        name: string;
        characterName: string;
        generatedAngles?: string[];
    }>;
};

export type GeneratedThumbnailsResult = {
    thumbnails: Array<{
        sceneId: string;
        sceneIndex: number;
        thumbnailUrl: string;
        description: string;
    }>;
    totalGenerated: number;
    totalScenes: number;
    aspectRatio?: "16:9" | "9:16";
};

export type GeneratedVideosResult = {
    videos: Array<{
        sceneId: string;
        sceneIndex: number;
        videoUrl: string;
        description: string;
    }>;
    totalGenerated: number;
    totalScenes: number;
    aspectRatio?: "16:9" | "9:16";
};

export type FinalVideoResult = {
    videoUrl: string;
    totalScenes: number;
    totalDuration: number; // in seconds
    aspectRatio: "16:9" | "9:16";
    fileName: string;
};

// A step in the agent's response - can be thinking, tool execution, or text
export type AgentStep = {
    id: string;
    type:
        | "thinking"
        | "tool"
        | "text"
        | "upload_request"
        | "script_preview"
        | "script_edit"
        | "preprocessing_result"
        | "assets_generated"
        | "thumbnails_generated"
        | "videos_generated"
        | "final_video_ready";
    content?: string;
    toolCall?: ToolCallResult;
    // For script preview step
    scenes?: Scene[];
    // For script edit step - single or multiple diffs
    editDiff?: ScriptEditDiff;
    editDiffs?: ScriptEditDiff[];
    // For preprocessing result
    preprocessingResult?: PreprocessingResult;
    // For generated assets
    generatedAssets?: GeneratedAssetsResult;
    // For thumbnails
    generatedThumbnails?: GeneratedThumbnailsResult;
    // For videos
    generatedVideos?: GeneratedVideosResult;
    // For final stitched video
    finalVideo?: FinalVideoResult;
    timestamp: number;
};

// Script context for iterative editing
export type ScriptContext = {
    selectedText?: string;
    sceneId?: string;
    sceneNumber?: number;
    fieldType?: "type" | "description" | "dialogue" | "speaker";
};

export type ChatMessage = {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
    // Files uploaded with this message
    attachments?: UploadedFile[];
    // Agent steps for progressive display
    agentSteps?: AgentStep[];
    // Thought summary from Gemini (if available)
    thoughtSummary?: string;
    // Thought signature for multi-turn context
    thoughtSignature?: string;
    // Whether this message is still being processed
    isStreaming?: boolean;
};

// ============================================
// AGENT CHECKLIST TYPES
// ============================================

export type ChecklistItemStatus =
    | "not_started"
    | "in_progress"
    | "completed"
    | "skipped";

export type ChecklistItem = {
    id: string;
    name: string;
    description: string;
    status: ChecklistItemStatus;
    required: boolean;
};

// ============================================
// ARTIFACT TYPES (for preview panel)
// ============================================

export type ArtifactType =
    | "overview"
    | "aesthetic"
    | "brand"
    | "character"
    | "script"
    | "location"
    | "attire"
    | "preprocessing"
    | "thumbnails"
    | "videos"
    | "final_video";

export type Artifact = {
    type: ArtifactType;
    data: unknown;
};

// ============================================
// GEMINI API TYPES
// ============================================

export type GeminiInlineData = {
    inlineData: {
        mimeType: string;
        data: string;
    };
};

export type GeminiTextPart = {
    text: string;
};

export type GeminiFunctionCallPart = {
    functionCall: {
        name: string;
        args: Record<string, unknown>;
    };
    thoughtSignature?: string;
};

export type GeminiFunctionResponsePart = {
    functionResponse: {
        name: string;
        response: Record<string, unknown>;
    };
};

export type GeminiPart =
    | GeminiTextPart
    | GeminiInlineData
    | GeminiFunctionCallPart
    | GeminiFunctionResponsePart;

export type GeminiContent = {
    role: "user" | "model";
    parts: GeminiPart[];
};

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export type ChatRequest = {
    message: string;
    attachments?: UploadedFile[];
    projectId: string;
};

export type ChatResponse = {
    message: string;
    toolCalls?: ToolCallResult[];
    thoughtSummary?: string;
    thoughtSignature?: string;
};
