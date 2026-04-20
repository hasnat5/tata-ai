"use client";

import { useCallback, useMemo, useState } from "react";
import {
    ReactFlow,
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position,
    NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Target,
    HelpCircle,
    Brain,
    Lightbulb,
    Zap,
    Save,
    X,
} from "lucide-react";
import type {
    Syllabus,
    Module,
    LearningObjective,
    Question,
    BloomLevel,
} from "@/lib/planning-types";

// ============================================
// NODE DATA TYPES
// ============================================

type SyllabusNodeData = {
    type: "syllabus";
    label: string;
    description: string;
    entityId: string;
    moduleCount: number;
};

type ModuleNodeData = {
    type: "module";
    label: string;
    description: string;
    entityId: string;
    color: string;
    loCount: number;
    status: string;
};

type LONodeData = {
    type: "learningObjective";
    label: string;
    description: string;
    entityId: string;
    moduleId: string;
    questionCount: number;
};

type QuestionNodeData = {
    type: "question";
    label: string;
    bloomLevel: BloomLevel;
    entityId: string;
    moduleId: string;
    loId: string;
    questionType: string;
};

type CustomNodeData =
    | SyllabusNodeData
    | ModuleNodeData
    | LONodeData
    | QuestionNodeData;

// ============================================
// CUSTOM NODES
// ============================================

function SyllabusNode({ data }: NodeProps<Node<SyllabusNodeData>>) {
    return (
        <div className="px-4 py-3 rounded-xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-lg min-w-[200px]">
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-primary-foreground!"
            />
            <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold text-lg">{data.label}</span>
            </div>
            <p className="text-xs opacity-90 line-clamp-2">
                {data.description}
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
                {data.moduleCount} modules
            </Badge>
        </div>
    );
}

function ModuleNode({ data }: NodeProps<Node<ModuleNodeData>>) {
    return (
        <div
            className="px-4 py-3 rounded-lg bg-card border-2 shadow-md min-w-[180px]"
            style={{ borderColor: data.color }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-2 h-2 bg-muted-foreground!"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-2 h-2 bg-muted-foreground!"
            />
            <div className="flex items-center gap-2 mb-1">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.color }}
                />
                <span className="font-medium text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {data.description}
            </p>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                    {data.loCount} LOs
                </Badge>
                <Badge
                    variant={data.status === "ready" ? "default" : "secondary"}
                    className="text-xs"
                >
                    {data.status}
                </Badge>
            </div>
        </div>
    );
}

function LONode({ data }: NodeProps<Node<LONodeData>>) {
    return (
        <div className="px-3 py-2 rounded-md bg-muted/50 border shadow-sm min-w-[160px] max-w-[200px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-2 h-2 bg-muted-foreground!"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-2 h-2 bg-muted-foreground!"
            />
            <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-xs">{data.label}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">
                {data.description}
            </p>
            <Badge variant="outline" className="mt-2 text-xs">
                {data.questionCount} questions
            </Badge>
        </div>
    );
}

const bloomIcons = {
    remember: Brain,
    understand: Lightbulb,
    apply: Zap,
};

const bloomColors = {
    remember: "bg-blue-500/10 text-blue-600 border-blue-200",
    understand: "bg-amber-500/10 text-amber-600 border-amber-200",
    apply: "bg-green-500/10 text-green-600 border-green-200",
};

function QuestionNode({ data }: NodeProps<Node<QuestionNodeData>>) {
    const Icon = bloomIcons[data.bloomLevel];
    return (
        <div
            className={`px-2 py-1.5 rounded border shadow-sm min-w-[100px] max-w-[140px] ${
                bloomColors[data.bloomLevel]
            }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-1.5 h-1.5 bg-muted-foreground!"
            />
            <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" />
                <span className="text-xs font-medium capitalize">
                    {data.bloomLevel}
                </span>
            </div>
            <p className="text-xs mt-1 line-clamp-2 opacity-80">{data.label}</p>
        </div>
    );
}

const nodeTypes = {
    syllabus: SyllabusNode,
    module: ModuleNode,
    learningObjective: LONode,
    question: QuestionNode,
};

// ============================================
// GRAPH GENERATION
// ============================================

function generateNodesAndEdges(
    syllabus: Syllabus,
    expandedModules: Set<string>,
    expandedLOs: Set<string>
): { nodes: Node<CustomNodeData>[]; edges: Edge[] } {
    const nodes: Node<CustomNodeData>[] = [];
    const edges: Edge[] = [];

    // Root syllabus node
    nodes.push({
        id: syllabus.id,
        type: "syllabus",
        position: { x: 400, y: 0 },
        data: {
            type: "syllabus",
            label: syllabus.title,
            description: syllabus.description,
            entityId: syllabus.id,
            moduleCount: syllabus.modules.length,
        },
    });

    // Module nodes
    const moduleSpacing = 250;
    const moduleStartX =
        400 - ((syllabus.modules.length - 1) * moduleSpacing) / 2;

    syllabus.modules.forEach((module, moduleIndex) => {
        const moduleX = moduleStartX + moduleIndex * moduleSpacing;
        const moduleY = 150;

        nodes.push({
            id: module.id,
            type: "module",
            position: { x: moduleX, y: moduleY },
            data: {
                type: "module",
                label: module.title,
                description: module.description,
                entityId: module.id,
                color: module.color || "#3b82f6",
                loCount: module.learningObjectives.length,
                status: module.status,
            },
        });

        edges.push({
            id: `${syllabus.id}-${module.id}`,
            source: syllabus.id,
            target: module.id,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: module.color || "#3b82f6" },
        });

        // Learning Objective nodes (if module is expanded)
        if (expandedModules.has(module.id)) {
            const loSpacing = 180;
            const loStartX =
                moduleX -
                ((module.learningObjectives.length - 1) * loSpacing) / 2;

            module.learningObjectives.forEach((lo, loIndex) => {
                const loX = loStartX + loIndex * loSpacing;
                const loY = moduleY + 180;

                nodes.push({
                    id: lo.id,
                    type: "learningObjective",
                    position: { x: loX, y: loY },
                    data: {
                        type: "learningObjective",
                        label: `LO${loIndex + 1}`,
                        description: lo.description,
                        entityId: lo.id,
                        moduleId: module.id,
                        questionCount: lo.questions.length,
                    },
                });

                edges.push({
                    id: `${module.id}-${lo.id}`,
                    source: module.id,
                    target: lo.id,
                    type: "smoothstep",
                    markerEnd: { type: MarkerType.ArrowClosed },
                });

                // Question nodes (if LO is expanded)
                if (expandedLOs.has(lo.id)) {
                    const qSpacing = 120;
                    const qStartX =
                        loX - ((lo.questions.length - 1) * qSpacing) / 2;

                    lo.questions.forEach((question, qIndex) => {
                        const qX = qStartX + qIndex * qSpacing;
                        const qY = loY + 150;

                        nodes.push({
                            id: question.id,
                            type: "question",
                            position: { x: qX, y: qY },
                            data: {
                                type: "question",
                                label: question.text.slice(0, 50) + "...",
                                bloomLevel: question.bloomLevel,
                                entityId: question.id,
                                moduleId: module.id,
                                loId: lo.id,
                                questionType: question.type,
                            },
                        });

                        edges.push({
                            id: `${lo.id}-${question.id}`,
                            source: lo.id,
                            target: question.id,
                            type: "smoothstep",
                            markerEnd: { type: MarkerType.ArrowClosed },
                        });
                    });
                }
            });
        }
    });

    return { nodes, edges };
}

// ============================================
// MAIN COMPONENT
// ============================================

type SyllabusMindMapProps = {
    syllabus: Syllabus;
    onUpdateSyllabus: (updates: Partial<Syllabus>) => void;
    onUpdateModule: (moduleId: string, updates: Partial<Module>) => void;
    onUpdateLO: (
        moduleId: string,
        loId: string,
        updates: Partial<LearningObjective>
    ) => void;
    onUpdateQuestion: (
        moduleId: string,
        loId: string,
        questionId: string,
        updates: Partial<Question>
    ) => void;
};

export function SyllabusMindMap({
    syllabus,
    onUpdateSyllabus,
    onUpdateModule,
    onUpdateLO,
    onUpdateQuestion,
}: SyllabusMindMapProps) {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set()
    );
    const [expandedLOs, setExpandedLOs] = useState<Set<string>>(new Set());
    const [selectedNode, setSelectedNode] =
        useState<Node<CustomNodeData> | null>(null);
    const [editingNode, setEditingNode] = useState<string | null>(null);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => generateNodesAndEdges(syllabus, expandedModules, expandedLOs),
        [syllabus, expandedModules, expandedLOs]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when syllabus changes
    useMemo(() => {
        const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(
            syllabus,
            expandedModules,
            expandedLOs
        );
        setNodes(newNodes);
        setEdges(newEdges);
    }, [syllabus, expandedModules, expandedLOs, setNodes, setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node as Node<CustomNodeData>);

        // Toggle expansion
        const data = node.data as CustomNodeData;
        if (data.type === "module") {
            setExpandedModules((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) {
                    next.delete(node.id);
                } else {
                    next.add(node.id);
                }
                return next;
            });
        } else if (data.type === "learningObjective") {
            setExpandedLOs((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) {
                    next.delete(node.id);
                } else {
                    next.add(node.id);
                }
                return next;
            });
        }
    }, []);

    const handleSaveEdit = useCallback(
        (nodeId: string, newLabel: string, newDescription?: string) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return;

            const data = node.data as CustomNodeData;
            if (data.type === "syllabus") {
                onUpdateSyllabus({
                    title: newLabel,
                    description: newDescription,
                });
            } else if (data.type === "module") {
                onUpdateModule(data.entityId, {
                    title: newLabel,
                    description: newDescription,
                });
            } else if (data.type === "learningObjective") {
                onUpdateLO(data.moduleId, data.entityId, {
                    description: newLabel,
                });
            }
            setEditingNode(null);
        },
        [nodes, onUpdateSyllabus, onUpdateModule, onUpdateLO]
    );

    return (
        <div className="flex h-full">
            {/* Mind Map */}
            <div className="flex-1 h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background"
                >
                    <Controls />
                    <Background />
                </ReactFlow>
            </div>

            {/* Details Panel */}
            {selectedNode && (
                <Card className="w-80 m-4 overflow-auto">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                {(selectedNode.data as CustomNodeData).type ===
                                "syllabus"
                                    ? "Syllabus"
                                    : (selectedNode.data as CustomNodeData)
                                          .type === "module"
                                    ? "Module"
                                    : (selectedNode.data as CustomNodeData)
                                          .type === "learningObjective"
                                    ? "Learning Objective"
                                    : "Question"}
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedNode(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <NodeDetailsForm
                            node={selectedNode}
                            isEditing={editingNode === selectedNode.id}
                            onEdit={() => setEditingNode(selectedNode.id)}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingNode(null)}
                            syllabus={syllabus}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ============================================
// NODE DETAILS FORM
// ============================================

type NodeDetailsFormProps = {
    node: Node<CustomNodeData>;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (nodeId: string, label: string, description?: string) => void;
    onCancel: () => void;
    syllabus: Syllabus;
};

function NodeDetailsForm({
    node,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    syllabus,
}: NodeDetailsFormProps) {
    const data = node.data as CustomNodeData;
    const [label, setLabel] = useState(data.label);
    const [description, setDescription] = useState(
        "description" in data ? data.description : ""
    );

    if (data.type === "question") {
        // Find the question
        const moduleData = data as QuestionNodeData;
        const module = syllabus.modules.find(
            (m) => m.id === moduleData.moduleId
        );
        const lo = module?.learningObjectives.find(
            (l) => l.id === moduleData.loId
        );
        const question = lo?.questions.find(
            (q) => q.id === moduleData.entityId
        );

        if (!question) return null;

        return (
            <div className="space-y-3">
                <div>
                    <Badge
                        className={`${bloomColors[question.bloomLevel]} mb-2`}
                    >
                        {question.bloomLevel}
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                        {question.type}
                    </Badge>
                </div>
                <div>
                    <p className="text-sm font-medium mb-1">Question</p>
                    <p className="text-sm text-muted-foreground">
                        {question.text}
                    </p>
                </div>
                {question.type === "mcq" && (
                    <div>
                        <p className="text-sm font-medium mb-1">Options</p>
                        <ul className="space-y-1">
                            {question.options.map((opt) => (
                                <li
                                    key={opt.id}
                                    className={`text-sm ${
                                        opt.isCorrect
                                            ? "text-green-600 font-medium"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {opt.isCorrect ? "✓ " : "○ "}
                                    {opt.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div>
                    <p className="text-sm font-medium mb-1">Correct Answer</p>
                    <p className="text-sm text-muted-foreground">
                        {question.correctAnswer}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium mb-1">Rationale</p>
                    <p className="text-sm text-muted-foreground">
                        {question.rationale}
                    </p>
                </div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium">
                        {data.type === "learningObjective"
                            ? "Description"
                            : "Title"}
                    </label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="mt-1"
                    />
                </div>
                {data.type !== "learningObjective" && (
                    <div>
                        <label className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1"
                            rows={3}
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => onSave(node.id, label, description)}
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-medium">
                    {data.type === "learningObjective"
                        ? "Description"
                        : "Title"}
                </p>
                <p className="text-sm text-muted-foreground">{data.label}</p>
            </div>
            {"description" in data && (
                <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">
                        {data.description}
                    </p>
                </div>
            )}
            {data.type === "module" && (
                <div className="flex gap-2">
                    <Badge variant="outline">
                        {(data as ModuleNodeData).loCount} Learning Objectives
                    </Badge>
                </div>
            )}
            {data.type === "learningObjective" && (
                <Badge variant="outline">
                    {(data as LONodeData).questionCount} Questions
                </Badge>
            )}
            <Button size="sm" variant="outline" onClick={onEdit}>
                Edit
            </Button>
        </div>
    );
}
