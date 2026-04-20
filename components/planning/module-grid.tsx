"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Target,
    HelpCircle,
    Play,
    CheckCircle2,
    Clock,
    Brain,
    Lightbulb,
    Zap,
} from "lucide-react";
import type { Module, BloomLevel } from "@/lib/planning-types";
import { BLOOM_POINTS } from "@/lib/planning-types";

const statusConfig = {
    draft: {
        label: "Draft",
        variant: "secondary" as const,
        icon: Clock,
    },
    ready: {
        label: "Ready",
        variant: "default" as const,
        icon: CheckCircle2,
    },
    in_progress: {
        label: "In Progress",
        variant: "outline" as const,
        icon: Play,
    },
    completed: {
        label: "Completed",
        variant: "default" as const,
        icon: CheckCircle2,
    },
};

const bloomIcons: Record<BloomLevel, typeof Brain> = {
    remember: Brain,
    understand: Lightbulb,
    apply: Zap,
};

type ModuleGridProps = {
    modules: Module[];
    onModuleClick: (moduleId: string) => void;
    selectedModuleId?: string | null;
};

export function ModuleGrid({
    modules,
    onModuleClick,
    selectedModuleId,
}: ModuleGridProps) {
    if (modules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                    No modules yet
                </p>
                <p className="text-sm text-muted-foreground">
                    Upload PDFs and process them to generate modules
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((module) => (
                <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={() => onModuleClick(module.id)}
                    isSelected={selectedModuleId === module.id}
                />
            ))}
        </div>
    );
}

type ModuleCardProps = {
    module: Module;
    onClick: () => void;
    isSelected: boolean;
};

function ModuleCard({ module, onClick, isSelected }: ModuleCardProps) {
    const status = statusConfig[module.status];
    const StatusIcon = status.icon;

    // Calculate stats
    const totalLOs = module.learningObjectives.length;
    const totalQuestions = module.learningObjectives.reduce(
        (acc, lo) => acc + lo.questions.length,
        0
    );

    // Count questions by bloom level
    const bloomCounts: Record<BloomLevel, number> = {
        remember: 0,
        understand: 0,
        apply: 0,
    };

    module.learningObjectives.forEach((lo) => {
        lo.questions.forEach((q) => {
            bloomCounts[q.bloomLevel]++;
        });
    });

    // Calculate total points possible
    const totalPoints = Object.entries(bloomCounts).reduce(
        (acc, [level, count]) =>
            acc + count * BLOOM_POINTS[level as BloomLevel],
        0
    );

    return (
        <Card
            className={`
                cursor-pointer transition-all hover:shadow-md
                ${isSelected ? "ring-2 ring-primary" : ""}
            `}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div
                        className="w-4 h-4 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: module.color }}
                    />
                    <Badge
                        variant={status.variant}
                        className="flex items-center gap-1"
                    >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </Badge>
                </div>
                <CardTitle className="text-base line-clamp-2">
                    {module.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-primary" />
                        <span>{totalLOs} LOs</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{totalQuestions} Qs</span>
                    </div>
                </div>

                {/* Bloom distribution */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        Question Distribution
                    </p>
                    <div className="flex gap-2">
                        {(
                            Object.entries(bloomCounts) as [
                                BloomLevel,
                                number
                            ][]
                        ).map(([level, count]) => {
                            const Icon = bloomIcons[level];
                            return (
                                <div
                                    key={level}
                                    className="flex items-center gap-1 text-xs"
                                    title={`${level}: ${count} questions`}
                                >
                                    <Icon className="h-3 w-3" />
                                    <span>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Points */}
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Total Points
                        </span>
                        <span className="font-medium">{totalPoints}</span>
                    </div>
                </div>

                {/* Action button */}
                <Button
                    className="w-full"
                    variant={module.status === "ready" ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    {module.status === "draft" ? (
                        <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Session
                        </>
                    ) : module.status === "ready" ? (
                        <>
                            <Play className="h-4 w-4 mr-2" />
                            Begin Training
                        </>
                    ) : (
                        <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Details
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

// ============================================
// MODULE DETAILS PANEL
// ============================================

type ModuleDetailsPanelProps = {
    module: Module;
    onClose: () => void;
};

export function ModuleDetailsPanel({
    module,
    onClose,
}: ModuleDetailsPanelProps) {
    return (
        <Card className="h-full overflow-auto">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <div
                            className="w-4 h-4 rounded-full mb-2"
                            style={{ backgroundColor: module.color }}
                        />
                        <CardTitle>{module.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">
                        {module.description}
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="text-sm font-medium">
                        Learning Objectives ({module.learningObjectives.length})
                    </p>
                    {module.learningObjectives.map((lo, index) => (
                        <div
                            key={lo.id}
                            className="p-3 bg-muted/50 rounded-lg space-y-2"
                        >
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">LO{index + 1}</Badge>
                                <span className="text-xs text-muted-foreground">
                                    {lo.questions.length} questions
                                </span>
                            </div>
                            <p className="text-sm">{lo.description}</p>

                            {/* Questions preview */}
                            <div className="space-y-1 pt-2 border-t">
                                {lo.questions.slice(0, 3).map((q) => {
                                    const Icon = bloomIcons[q.bloomLevel];
                                    return (
                                        <div
                                            key={q.id}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <Icon className="h-3 w-3 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground line-clamp-1">
                                                {q.text}
                                            </span>
                                        </div>
                                    );
                                })}
                                {lo.questions.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                        +{lo.questions.length - 3} more
                                        questions
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Agent Session
                </Button>
            </CardContent>
        </Card>
    );
}
