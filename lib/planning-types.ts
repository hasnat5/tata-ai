// ============================================
// BLOOM'S TAXONOMY CONSTANTS
// ============================================

export const BLOOM_LEVELS = {
    remember: 1,
    understand: 2,
    apply: 3,
} as const;

export const BLOOM_POINTS = {
    remember: 1,
    understand: 2,
    apply: 3,
} as const;

export type BloomLevel = keyof typeof BLOOM_LEVELS;

// ============================================
// QUESTION TYPES
// ============================================

export type QuestionType = "mcq" | "short" | "paragraph";

export type MCQOption = {
    id: string;
    text: string;
    isCorrect: boolean;
};

export type Question = {
    id: string;
    bloomLevel: BloomLevel;
    type: QuestionType;
    text: string;
    options: MCQOption[]; // For MCQ only, empty for other types
    correctAnswer: string;
    rationale: string;
    // Time limits in seconds
    timeLimitSeconds: number;
};

// ============================================
// LEARNING OBJECTIVE TYPES
// ============================================

export type LearningObjective = {
    id: string;
    description: string;
    questions: Question[];
};

// ============================================
// MODULE TYPES
// ============================================

export type ModuleStatus = "draft" | "ready" | "in_progress" | "completed";

export type Module = {
    id: string;
    title: string;
    description: string;
    learningObjectives: LearningObjective[];
    status: ModuleStatus;
    // Metadata for UI
    color?: string;
    order: number;
};

// ============================================
// SYLLABUS TYPES
// ============================================

export type Syllabus = {
    id: string;
    title: string;
    description: string;
    modules: Module[];
    createdAt: number;
    updatedAt: number;
};

// ============================================
// PROCESSING LOG TYPES
// ============================================

export type ProcessingLogType =
    | "status"
    | "thought"
    | "tool_call"
    | "tool_result"
    | "search"
    | "read"
    | "content"
    | "research_output"
    | "structuring"
    | "complete"
    | "error";

export type ProcessingLogEntry = {
    id: string;
    type: ProcessingLogType;
    timestamp: number;
    phase: string;
    title: string;
    content: string;
    metadata?: {
        toolName?: string;
        sourceUrl?: string;
        searchQuery?: string;
        tokenCount?: number;
        duration?: number;
    };
};

export type ProcessingSession = {
    id: string;
    projectId: string;
    startedAt: number;
    completedAt?: number;
    logs: ProcessingLogEntry[];
    researchReport?: string;
    stats?: {
        totalTokens?: number;
        searchQueries: number;
        documentsAnalyzed: number;
        processingTimeMs: number;
    };
};

// ============================================
// PLANNING PROJECT TYPES
// ============================================

export type PlanningProjectStatus =
    | "uploading"
    | "processing"
    | "editing"
    | "ready";

export type PlanningProject = {
    id: string;
    title: string;
    description: string;
    pdfUrls: string[];
    pdfNames: string[];
    syllabus: Syllabus | null;
    status: PlanningProjectStatus;
    createdAt: number;
    updatedAt: number;
    // Processing metadata
    processingProgress?: number;
    processingError?: string;
    // Processing sessions history
    processingSessions: ProcessingSession[];
};

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export type ProcessSyllabusRequest = {
    pdfUrls: string[];
    projectTitle?: string;
};

export type ProcessSyllabusResponse = {
    syllabus: Syllabus;
};

// ============================================
// MIND MAP NODE TYPES (for ReactFlow)
// ============================================

export type MindMapNodeType =
    | "syllabus"
    | "module"
    | "learningObjective"
    | "question";

export type MindMapNodeData = {
    type: MindMapNodeType;
    label: string;
    description?: string;
    bloomLevel?: BloomLevel;
    status?: ModuleStatus;
    entityId: string;
    moduleId?: string;
    loId?: string;
};

// ============================================
// HELPER CONSTANTS
// ============================================

export const QUESTION_TIME_LIMITS: Record<QuestionType, number> = {
    mcq: 30,
    short: 45,
    paragraph: 90,
};

export const QUESTIONS_PER_LO = {
    remember: { min: 1, max: 2 },
    understand: { min: 2, max: 2 },
    apply: { min: 2, max: 3 },
};

export const MODULE_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
];
