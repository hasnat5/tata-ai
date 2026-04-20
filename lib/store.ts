import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    VideoProject,
    Character,
    Brand,
    Aesthetic,
    ProjectOverview,
    Scene,
    Location,
    CharacterAttire,
    ChatMessage,
    ChecklistItem,
    Artifact,
    ProjectStatus,
    ScriptContext,
} from "./types";

// ============================================
// STORE STATE TYPE
// ============================================

type AppState = {
    // ========== HYDRATION ==========
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // ========== PROJECT ==========
    project: VideoProject | null;

    // ========== CHAT ==========
    messages: ChatMessage[];
    isGenerating: boolean;

    // ========== CHECKLIST ==========
    checklist: ChecklistItem[];

    // ========== CURRENT ARTIFACT (for preview) ==========
    currentArtifact: Artifact | null;

    // ========== SCRIPT CONTEXT (for highlight-to-context) ==========
    scriptContext: ScriptContext | null;
    setScriptContext: (context: ScriptContext | null) => void;

    // ========== ACTIONS: PROJECT ==========
    initProject: (name: string) => string;
    updateProjectStatus: (status: ProjectStatus) => void;
    resetProject: () => void;

    // ========== ACTIONS: OVERVIEW ==========
    setOverview: (overview: ProjectOverview) => void;
    updateOverview: (updates: Partial<ProjectOverview>) => void;

    // ========== ACTIONS: AESTHETIC ==========
    setAesthetic: (aesthetic: Aesthetic) => void;
    updateAesthetic: (updates: Partial<Aesthetic>) => void;

    // ========== ACTIONS: BRAND ==========
    setBrand: (brand: Brand | null) => void;
    updateBrand: (updates: Partial<Brand>) => void;

    // ========== ACTIONS: CHARACTERS ==========
    addCharacter: (character: Character) => void;
    updateCharacter: (id: string, updates: Partial<Character>) => void;
    removeCharacter: (id: string) => void;

    // ========== ACTIONS: SCENES ==========
    setScenes: (scenes: Scene[]) => void;
    updateScene: (id: string, updates: Partial<Scene>) => void;
    addScene: (scene: Scene) => void;
    removeScene: (id: string) => void;
    reorderScenes: (sceneIds: string[]) => void;

    // ========== ACTIONS: FINAL VIDEO ==========
    setFinalVideoUrl: (url: string) => void;

    // ========== ACTIONS: LOCATIONS ==========
    setLocations: (locations: Location[]) => void;
    updateLocation: (id: string, updates: Partial<Location>) => void;
    addLocation: (location: Location) => void;

    // ========== ACTIONS: ATTIRES ==========
    setCharacterAttires: (attires: CharacterAttire[]) => void;
    updateCharacterAttire: (
        id: string,
        updates: Partial<CharacterAttire>
    ) => void;
    addCharacterAttire: (attire: CharacterAttire) => void;

    // ========== ACTIONS: CHAT ==========
    addMessage: (message: ChatMessage) => void;
    updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
    clearMessages: () => void;
    setIsGenerating: (isGenerating: boolean) => void;

    // ========== ACTIONS: CHECKLIST ==========
    updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
    initChecklist: () => void;

    // ========== ACTIONS: ARTIFACT ==========
    setCurrentArtifact: (artifact: Artifact | null) => void;

    // ========== ACTIONS: GLOBAL ==========
    resetAll: () => void;
};

// ============================================
// DEFAULT CHECKLIST
// ============================================

const defaultChecklist: ChecklistItem[] = [
    {
        id: "overview",
        name: "Project Overview",
        description:
            "Basic info about the video (prompt, aspect ratio, duration)",
        status: "not_started",
        required: true,
    },
    {
        id: "aesthetic",
        name: "Art Style & Aesthetic",
        description: "Visual style, reference images, and description",
        status: "not_started",
        required: true,
    },
    {
        id: "brand",
        name: "Brand Guidelines",
        description: "Logo, colors, and brand name (optional)",
        status: "not_started",
        required: false,
    },
    {
        id: "characters",
        name: "Characters",
        description: "Character references and voice samples",
        status: "not_started",
        required: true,
    },
    {
        id: "script",
        name: "Script & Scenes",
        description: "Scene breakdown with dialogue and descriptions",
        status: "not_started",
        required: true,
    },
    {
        id: "preprocessing",
        name: "Preprocessing Assets",
        description: "Location images and character attire references",
        status: "not_started",
        required: true,
    },
    {
        id: "thumbnails",
        name: "Scene Thumbnails",
        description: "Preview images for each scene",
        status: "not_started",
        required: true,
    },
    {
        id: "videos",
        name: "Video Generation",
        description: "Generated video clips for each scene",
        status: "not_started",
        required: true,
    },
    {
        id: "final_video",
        name: "Final Video",
        description: "Stitched final video ready for download",
        status: "not_started",
        required: true,
    },
];

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
    _hasHydrated: false,
    project: null as VideoProject | null,
    messages: [] as ChatMessage[],
    isGenerating: false,
    checklist: defaultChecklist,
    currentArtifact: null as Artifact | null,
    scriptContext: null as ScriptContext | null,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========== HYDRATION ==========
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            // ========== PROJECT ACTIONS ==========
            initProject: (name: string) => {
                const id = crypto.randomUUID();
                const now = Date.now();
                set({
                    project: {
                        id,
                        name,
                        createdAt: now,
                        updatedAt: now,
                        overview: null,
                        aesthetic: null,
                        brand: null,
                        characters: [],
                        scenes: [],
                        locations: [],
                        characterAttires: [],
                        finalVideoUrl: null,
                        status: "gathering_overview",
                    },
                    messages: [],
                    checklist: defaultChecklist,
                    currentArtifact: null,
                });
                return id;
            },

            updateProjectStatus: (status) =>
                set((state) => ({
                    project: state.project
                        ? { ...state.project, status, updatedAt: Date.now() }
                        : null,
                })),

            resetProject: () =>
                set({
                    project: null,
                    messages: [],
                    checklist: defaultChecklist,
                    currentArtifact: null,
                }),

            // ========== OVERVIEW ACTIONS ==========
            setOverview: (overview) =>
                set((state) => ({
                    project: state.project
                        ? { ...state.project, overview, updatedAt: Date.now() }
                        : null,
                })),

            updateOverview: (updates) =>
                set((state) => ({
                    project: state.project?.overview
                        ? {
                              ...state.project,
                              overview: {
                                  ...state.project.overview,
                                  ...updates,
                              },
                              updatedAt: Date.now(),
                          }
                        : state.project,
                })),

            // ========== AESTHETIC ACTIONS ==========
            setAesthetic: (aesthetic) =>
                set((state) => ({
                    project: state.project
                        ? { ...state.project, aesthetic, updatedAt: Date.now() }
                        : null,
                })),

            updateAesthetic: (updates) =>
                set((state) => ({
                    project: state.project?.aesthetic
                        ? {
                              ...state.project,
                              aesthetic: {
                                  ...state.project.aesthetic,
                                  ...updates,
                              },
                              updatedAt: Date.now(),
                          }
                        : state.project,
                })),

            // ========== BRAND ACTIONS ==========
            setBrand: (brand) =>
                set((state) => ({
                    project: state.project
                        ? { ...state.project, brand, updatedAt: Date.now() }
                        : null,
                })),

            updateBrand: (updates) =>
                set((state) => ({
                    project: state.project?.brand
                        ? {
                              ...state.project,
                              brand: { ...state.project.brand, ...updates },
                              updatedAt: Date.now(),
                          }
                        : state.project,
                })),

            // ========== CHARACTER ACTIONS ==========
            addCharacter: (character) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              characters: [
                                  ...state.project.characters,
                                  character,
                              ],
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            updateCharacter: (id, updates) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              characters: state.project.characters.map((c) =>
                                  c.id === id ? { ...c, ...updates } : c
                              ),
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            removeCharacter: (id) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              characters: state.project.characters.filter(
                                  (c) => c.id !== id
                              ),
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            // ========== SCENE ACTIONS ==========
            setScenes: (scenes) =>
                set((state) => ({
                    project: state.project
                        ? { ...state.project, scenes, updatedAt: Date.now() }
                        : null,
                })),

            updateScene: (id, updates) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              scenes: state.project.scenes.map((s) =>
                                  s.id === id ? { ...s, ...updates } : s
                              ),
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            addScene: (scene) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              scenes: [...state.project.scenes, scene],
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            removeScene: (id) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              scenes: state.project.scenes.filter(
                                  (s) => s.id !== id
                              ),
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            reorderScenes: (sceneIds) =>
                set((state) => {
                    if (!state.project) return state;
                    const scenesMap = new Map(
                        state.project.scenes.map((s) => [s.id, s])
                    );
                    const reordered = sceneIds
                        .map((id, index) => {
                            const scene = scenesMap.get(id);
                            return scene ? { ...scene, index } : null;
                        })
                        .filter((s): s is Scene => s !== null);
                    return {
                        project: {
                            ...state.project,
                            scenes: reordered,
                            updatedAt: Date.now(),
                        },
                    };
                }),

            // ========== FINAL VIDEO ACTIONS ==========
            setFinalVideoUrl: (url) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              finalVideoUrl: url,
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            // ========== LOCATION ACTIONS ==========
            setLocations: (locations) =>
                set((state) => ({
                    project: state.project
                        ? { ...state.project, locations, updatedAt: Date.now() }
                        : null,
                })),

            updateLocation: (id, updates) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              locations: state.project.locations.map((l) =>
                                  l.id === id ? { ...l, ...updates } : l
                              ),
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            addLocation: (location) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              locations: [...state.project.locations, location],
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            // ========== ATTIRE ACTIONS ==========
            setCharacterAttires: (attires) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              characterAttires: attires,
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            updateCharacterAttire: (id, updates) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              characterAttires:
                                  state.project.characterAttires.map((a) =>
                                      a.id === id ? { ...a, ...updates } : a
                                  ),
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            addCharacterAttire: (attire) =>
                set((state) => ({
                    project: state.project
                        ? {
                              ...state.project,
                              characterAttires: [
                                  ...state.project.characterAttires,
                                  attire,
                              ],
                              updatedAt: Date.now(),
                          }
                        : null,
                })),

            // ========== CHAT ACTIONS ==========
            addMessage: (message) =>
                set((state) => ({
                    messages: [...state.messages, message],
                })),

            updateMessage: (id, updates) =>
                set((state) => ({
                    messages: state.messages.map((m) =>
                        m.id === id ? { ...m, ...updates } : m
                    ),
                })),

            clearMessages: () => set({ messages: [] }),

            setIsGenerating: (isGenerating) => set({ isGenerating }),

            // ========== CHECKLIST ACTIONS ==========
            updateChecklistItem: (id, updates) =>
                set((state) => ({
                    checklist: state.checklist.map((item) =>
                        item.id === id ? { ...item, ...updates } : item
                    ),
                })),

            initChecklist: () => set({ checklist: defaultChecklist }),

            // ========== ARTIFACT ACTIONS ==========
            setCurrentArtifact: (artifact) =>
                set({ currentArtifact: artifact }),

            // ========== SCRIPT CONTEXT ACTIONS ==========
            setScriptContext: (context) => set({ scriptContext: context }),

            // ========== GLOBAL ACTIONS ==========
            resetAll: () => set({ ...initialState, _hasHydrated: true }),
        }),
        {
            name: "gemini-video-director-storage",
            partialize: (state) => {
                // Helper to check if a string is base64 data (starts with data:)
                const isBase64 = (str: string) =>
                    str?.startsWith("data:") && str.includes("base64");

                // Sanitize images in messages to prevent base64 from bloating localStorage
                const sanitizedMessages = state.messages.map((msg) => ({
                    ...msg,
                    // Remove base64 images from outputImages in tool calls
                    agentSteps: msg.agentSteps?.map((step) => ({
                        ...step,
                        toolCall: step.toolCall
                            ? {
                                  ...step.toolCall,
                                  outputImages:
                                      step.toolCall.outputImages?.filter(
                                          (img) => !isBase64(img)
                                      ),
                              }
                            : undefined,
                        // Filter generatedAssets if present
                        generatedAssets: step.generatedAssets
                            ? {
                                  generatedLocations:
                                      step.generatedAssets.generatedLocations?.map(
                                          (loc) => ({
                                              ...loc,
                                              imageUrl: isBase64(
                                                  loc.imageUrl || ""
                                              )
                                                  ? undefined
                                                  : loc.imageUrl,
                                          })
                                      ),
                                  generatedAttires:
                                      step.generatedAssets.generatedAttires?.map(
                                          (att) => ({
                                              ...att,
                                              generatedAngles:
                                                  att.generatedAngles?.filter(
                                                      (img) => !isBase64(img)
                                                  ),
                                          })
                                      ),
                              }
                            : undefined,
                    })),
                }));

                return {
                    project: state.project,
                    messages: sanitizedMessages,
                    checklist: state.checklist,
                };
            },
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Ensure checklist has all items from defaultChecklist
                    // This handles migrations when new checklist items are added
                    const existingIds = new Set(
                        state.checklist.map((item) => item.id)
                    );
                    const missingItems = defaultChecklist.filter(
                        (item) => !existingIds.has(item.id)
                    );

                    if (missingItems.length > 0) {
                        console.log(
                            "Adding missing checklist items:",
                            missingItems.map((i) => i.id)
                        );
                        state.checklist = [...state.checklist, ...missingItems];
                    }

                    state.setHasHydrated(true);
                }
            },
        }
    )
);

// ============================================
// SELECTORS
// ============================================

export const selectHasHydrated = (state: AppState) => state._hasHydrated;
export const selectProject = (state: AppState) => state.project;
export const selectMessages = (state: AppState) => state.messages;
export const selectChecklist = (state: AppState) => state.checklist;
export const selectCurrentArtifact = (state: AppState) => state.currentArtifact;
export const selectIsGenerating = (state: AppState) => state.isGenerating;

export const selectChecklistProgress = (state: AppState) => {
    const completed = state.checklist.filter(
        (item) => item.status === "completed" || item.status === "skipped"
    ).length;
    return {
        completed,
        total: state.checklist.length,
        percentage: Math.round((completed / state.checklist.length) * 100),
    };
};

export const selectCharacterById = (id: string) => (state: AppState) =>
    state.project?.characters.find((c) => c.id === id);

export const selectSceneById = (id: string) => (state: AppState) =>
    state.project?.scenes.find((s) => s.id === id);

export const selectLocationById = (id: string) => (state: AppState) =>
    state.project?.locations.find((l) => l.id === id);
