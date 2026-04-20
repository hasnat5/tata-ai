import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    PlanningProject,
    PlanningProjectStatus,
    Syllabus,
    Module,
    LearningObjective,
    Question,
    ProcessingSession,
    ProcessingLogEntry,
} from "./planning-types";

// ============================================
// STORE STATE TYPE
// ============================================

type PlanningState = {
    // ========== HYDRATION ==========
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // ========== PROJECTS ==========
    projects: PlanningProject[];
    currentProjectId: string | null;

    // ========== UI STATE ==========
    selectedModuleId: string | null;
    selectedLOId: string | null;
    isProcessing: boolean;

    // ========== ACTIONS: PROJECTS ==========
    createProject: (title: string, description?: string) => string;
    updateProject: (id: string, updates: Partial<PlanningProject>) => void;
    deleteProject: (id: string) => void;
    setCurrentProject: (id: string | null) => void;
    updateProjectStatus: (id: string, status: PlanningProjectStatus) => void;

    // ========== ACTIONS: PDFS ==========
    addPdfToProject: (projectId: string, url: string, name: string) => void;
    removePdfFromProject: (projectId: string, url: string) => void;

    // ========== ACTIONS: SYLLABUS ==========
    setSyllabus: (projectId: string, syllabus: Syllabus) => void;
    updateSyllabus: (
        projectId: string,
        updates: Partial<Omit<Syllabus, "modules">>
    ) => void;

    // ========== ACTIONS: MODULES ==========
    addModule: (projectId: string, module: Module) => void;
    updateModule: (
        projectId: string,
        moduleId: string,
        updates: Partial<Module>
    ) => void;
    removeModule: (projectId: string, moduleId: string) => void;
    reorderModules: (projectId: string, moduleIds: string[]) => void;

    // ========== ACTIONS: LEARNING OBJECTIVES ==========
    addLearningObjective: (
        projectId: string,
        moduleId: string,
        lo: LearningObjective
    ) => void;
    updateLearningObjective: (
        projectId: string,
        moduleId: string,
        loId: string,
        updates: Partial<LearningObjective>
    ) => void;
    removeLearningObjective: (
        projectId: string,
        moduleId: string,
        loId: string
    ) => void;

    // ========== ACTIONS: QUESTIONS ==========
    addQuestion: (
        projectId: string,
        moduleId: string,
        loId: string,
        question: Question
    ) => void;
    updateQuestion: (
        projectId: string,
        moduleId: string,
        loId: string,
        questionId: string,
        updates: Partial<Question>
    ) => void;
    removeQuestion: (
        projectId: string,
        moduleId: string,
        loId: string,
        questionId: string
    ) => void;

    // ========== ACTIONS: UI ==========
    setSelectedModule: (moduleId: string | null) => void;
    setSelectedLO: (loId: string | null) => void;
    setIsProcessing: (isProcessing: boolean) => void;

    // ========== ACTIONS: PROCESSING SESSIONS ==========
    startProcessingSession: (projectId: string) => string;
    addLogEntry: (projectId: string, sessionId: string, entry: Omit<ProcessingLogEntry, "id" | "timestamp">) => void;
    completeProcessingSession: (
        projectId: string,
        sessionId: string,
        researchReport?: string,
        stats?: ProcessingSession["stats"]
    ) => void;

    // ========== ACTIONS: GLOBAL ==========
    resetAll: () => void;
};

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
    _hasHydrated: false,
    projects: [] as PlanningProject[],
    currentProjectId: null as string | null,
    selectedModuleId: null as string | null,
    selectedLOId: null as string | null,
    isProcessing: false,
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePlanningStore = create<PlanningState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========== HYDRATION ==========
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            // ========== PROJECT ACTIONS ==========
            createProject: (title: string, description = "") => {
                const id = crypto.randomUUID();
                const now = Date.now();
                const newProject: PlanningProject = {
                    id,
                    title,
                    description,
                    pdfUrls: [],
                    pdfNames: [],
                    syllabus: null,
                    status: "uploading",
                    createdAt: now,
                    updatedAt: now,
                    processingSessions: [],
                };
                set((state) => ({
                    projects: [...state.projects, newProject],
                    currentProjectId: id,
                }));
                return id;
            },

            updateProject: (id, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id
                            ? { ...p, ...updates, updatedAt: Date.now() }
                            : p
                    ),
                })),

            deleteProject: (id) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    currentProjectId:
                        state.currentProjectId === id
                            ? null
                            : state.currentProjectId,
                })),

            setCurrentProject: (id) => set({ currentProjectId: id }),

            updateProjectStatus: (id, status) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === id
                            ? { ...p, status, updatedAt: Date.now() }
                            : p
                    ),
                })),

            // ========== PDF ACTIONS ==========
            addPdfToProject: (projectId, url, name) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                  ...p,
                                  pdfUrls: [...p.pdfUrls, url],
                                  pdfNames: [...p.pdfNames, name],
                                  updatedAt: Date.now(),
                              }
                            : p
                    ),
                })),

            removePdfFromProject: (projectId, url) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId) return p;
                        const index = p.pdfUrls.indexOf(url);
                        if (index === -1) return p;
                        return {
                            ...p,
                            pdfUrls: p.pdfUrls.filter((_, i) => i !== index),
                            pdfNames: p.pdfNames.filter((_, i) => i !== index),
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            // ========== SYLLABUS ACTIONS ==========
            setSyllabus: (projectId, syllabus) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                  ...p,
                                  syllabus,
                                  status: "editing" as const,
                                  updatedAt: Date.now(),
                              }
                            : p
                    ),
                })),

            updateSyllabus: (projectId, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                ...updates,
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            // ========== MODULE ACTIONS ==========
            addModule: (projectId, module) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: [...p.syllabus.modules, module],
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            updateModule: (projectId, moduleId, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId ? { ...m, ...updates } : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            removeModule: (projectId, moduleId) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.filter(
                                    (m) => m.id !== moduleId
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            reorderModules: (projectId, moduleIds) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        const modulesMap = new Map(
                            p.syllabus.modules.map((m) => [m.id, m])
                        );
                        const reordered = moduleIds
                            .map((id, index) => {
                                const mod = modulesMap.get(id);
                                return mod ? { ...mod, order: index } : null;
                            })
                            .filter((m): m is Module => m !== null);
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: reordered,
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            // ========== LEARNING OBJECTIVE ACTIONS ==========
            addLearningObjective: (projectId, moduleId, lo) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId
                                        ? {
                                              ...m,
                                              learningObjectives: [
                                                  ...m.learningObjectives,
                                                  lo,
                                              ],
                                          }
                                        : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            updateLearningObjective: (projectId, moduleId, loId, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId
                                        ? {
                                              ...m,
                                              learningObjectives:
                                                  m.learningObjectives.map(
                                                      (lo) =>
                                                          lo.id === loId
                                                              ? {
                                                                    ...lo,
                                                                    ...updates,
                                                                }
                                                              : lo
                                                  ),
                                          }
                                        : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            removeLearningObjective: (projectId, moduleId, loId) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId
                                        ? {
                                              ...m,
                                              learningObjectives:
                                                  m.learningObjectives.filter(
                                                      (lo) => lo.id !== loId
                                                  ),
                                          }
                                        : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            // ========== QUESTION ACTIONS ==========
            addQuestion: (projectId, moduleId, loId, question) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId
                                        ? {
                                              ...m,
                                              learningObjectives:
                                                  m.learningObjectives.map(
                                                      (lo) =>
                                                          lo.id === loId
                                                              ? {
                                                                    ...lo,
                                                                    questions: [
                                                                        ...lo.questions,
                                                                        question,
                                                                    ],
                                                                }
                                                              : lo
                                                  ),
                                          }
                                        : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            updateQuestion: (projectId, moduleId, loId, questionId, updates) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId
                                        ? {
                                              ...m,
                                              learningObjectives:
                                                  m.learningObjectives.map(
                                                      (lo) =>
                                                          lo.id === loId
                                                              ? {
                                                                    ...lo,
                                                                    questions:
                                                                        lo.questions.map(
                                                                            (
                                                                                q
                                                                            ) =>
                                                                                q.id ===
                                                                                questionId
                                                                                    ? {
                                                                                          ...q,
                                                                                          ...updates,
                                                                                      }
                                                                                    : q
                                                                        ),
                                                                }
                                                              : lo
                                                  ),
                                          }
                                        : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            removeQuestion: (projectId, moduleId, loId, questionId) =>
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId || !p.syllabus) return p;
                        return {
                            ...p,
                            syllabus: {
                                ...p.syllabus,
                                modules: p.syllabus.modules.map((m) =>
                                    m.id === moduleId
                                        ? {
                                              ...m,
                                              learningObjectives:
                                                  m.learningObjectives.map(
                                                      (lo) =>
                                                          lo.id === loId
                                                              ? {
                                                                    ...lo,
                                                                    questions:
                                                                        lo.questions.filter(
                                                                            (
                                                                                q
                                                                            ) =>
                                                                                q.id !==
                                                                                questionId
                                                                        ),
                                                                }
                                                              : lo
                                                  ),
                                          }
                                        : m
                                ),
                                updatedAt: Date.now(),
                            },
                            updatedAt: Date.now(),
                        };
                    }),
                })),

            // ========== UI ACTIONS ==========
            setSelectedModule: (moduleId) =>
                set({ selectedModuleId: moduleId }),
            setSelectedLO: (loId) => set({ selectedLOId: loId }),
            setIsProcessing: (isProcessing) => set({ isProcessing }),

            // ========== PROCESSING SESSION ACTIONS ==========
            startProcessingSession: (projectId) => {
                const sessionId = crypto.randomUUID();
                const now = Date.now();
                const newSession: ProcessingSession = {
                    id: sessionId,
                    projectId,
                    startedAt: now,
                    logs: [],
                };
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? {
                                  ...p,
                                  processingSessions: [
                                      ...(p.processingSessions || []),
                                      newSession,
                                  ],
                                  updatedAt: now,
                              }
                            : p
                    ),
                }));
                return sessionId;
            },

            addLogEntry: (projectId, sessionId, entry) => {
                const logEntry: ProcessingLogEntry = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    ...entry,
                };
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId) return p;
                        return {
                            ...p,
                            processingSessions: (p.processingSessions || []).map(
                                (s) =>
                                    s.id === sessionId
                                        ? { ...s, logs: [...s.logs, logEntry] }
                                        : s
                            ),
                        };
                    }),
                }));
            },

            completeProcessingSession: (
                projectId,
                sessionId,
                researchReport,
                stats
            ) => {
                const now = Date.now();
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId) return p;
                        return {
                            ...p,
                            processingSessions: (p.processingSessions || []).map(
                                (s) =>
                                    s.id === sessionId
                                        ? {
                                              ...s,
                                              completedAt: now,
                                              researchReport,
                                              stats,
                                          }
                                        : s
                            ),
                            updatedAt: now,
                        };
                    }),
                }));
            },

            // ========== GLOBAL ACTIONS ==========
            resetAll: () => set({ ...initialState, _hasHydrated: true }),
        }),
        {
            name: "gemini-planning-storage",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// ============================================
// SELECTORS
// ============================================

export const selectHasHydrated = (state: PlanningState) => state._hasHydrated;
export const selectProjects = (state: PlanningState) => state.projects;
export const selectCurrentProjectId = (state: PlanningState) =>
    state.currentProjectId;
export const selectIsProcessing = (state: PlanningState) => state.isProcessing;

export const selectCurrentProject = (state: PlanningState) => {
    if (!state.currentProjectId) return null;
    return state.projects.find((p) => p.id === state.currentProjectId) || null;
};

export const selectProjectById = (id: string) => (state: PlanningState) =>
    state.projects.find((p) => p.id === id);

export const selectModuleById =
    (projectId: string, moduleId: string) => (state: PlanningState) => {
        const project = state.projects.find((p) => p.id === projectId);
        return project?.syllabus?.modules.find((m) => m.id === moduleId);
    };

export const selectLOById =
    (projectId: string, moduleId: string, loId: string) =>
    (state: PlanningState) => {
        const project = state.projects.find((p) => p.id === projectId);
        const module = project?.syllabus?.modules.find(
            (m) => m.id === moduleId
        );
        return module?.learningObjectives.find((lo) => lo.id === loId);
    };
