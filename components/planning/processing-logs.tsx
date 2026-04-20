"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Brain,
    Search,
    FileText,
    Wrench,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronRight,
    Loader2,
    BookOpen,
    Sparkles,
    Timer,
    Database,
    ScrollText,
} from "lucide-react";
import type { ProcessingSession, ProcessingLogEntry } from "@/lib/planning-types";

// ============================================
// TYPES
// ============================================

export type LiveLogEntry = {
    id: string;
    type: string;
    timestamp: number;
    title: string;
    content: string;
    phase?: string;
    metadata?: Record<string, unknown>;
};

type ProcessingLogsProps = {
    // For live streaming
    isLive?: boolean;
    liveEntries?: LiveLogEntry[];
    currentPhase?: string;
    // For viewing historical sessions
    session?: ProcessingSession;
    // Common
    onClose?: () => void;
    // When embedded in another card, don't render the outer card
    embedded?: boolean;
};

// ============================================
// ICON MAPPING
// ============================================

const getLogIcon = (type: string) => {
    switch (type) {
        case "status":
            return Clock;
        case "thought":
            return Brain;
        case "tool_call":
            return Wrench;
        case "search":
            return Search;
        case "read":
            return FileText;
        case "content":
            return ScrollText;
        case "research_output":
            return BookOpen;
        case "structuring":
            return Database;
        case "complete":
            return CheckCircle2;
        case "error":
            return AlertCircle;
        default:
            return Sparkles;
    }
};

const getLogColor = (type: string) => {
    switch (type) {
        case "status":
            return "text-blue-500 bg-blue-500/10";
        case "thought":
            return "text-purple-500 bg-purple-500/10";
        case "tool_call":
            return "text-orange-500 bg-orange-500/10";
        case "search":
            return "text-cyan-500 bg-cyan-500/10";
        case "read":
            return "text-green-500 bg-green-500/10";
        case "research_output":
            return "text-emerald-500 bg-emerald-500/10";
        case "structuring":
            return "text-amber-500 bg-amber-500/10";
        case "complete":
            return "text-green-600 bg-green-600/10";
        case "error":
            return "text-red-500 bg-red-500/10";
        default:
            return "text-muted-foreground bg-muted";
    }
};

// ============================================
// LOG ENTRY COMPONENT
// ============================================

function LogEntry({
    entry,
    isExpanded,
    onToggle,
}: {
    entry: LiveLogEntry | ProcessingLogEntry;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const Icon = getLogIcon(entry.type);
    const colorClass = getLogColor(entry.type);
    const hasContent = entry.content && entry.content.length > 100;

    return (
        <div className="flex gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
            {/* Icon - fixed size container */}
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize h-4 px-1.5">
                        {entry.type.replace("_", " ")}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                </div>

                {/* Expandable content */}
                {entry.content && (
                    <div className="mt-1">
                        {hasContent ? (
                            <>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {isExpanded
                                        ? entry.content
                                        : entry.content.slice(0, 150) + "..."}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 mt-1 text-xs"
                                    onClick={onToggle}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            Show less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-3 w-3 mr-1" />
                                            Show more
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {entry.content}
                            </p>
                        )}
                    </div>
                )}

                {/* Metadata */}
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {Object.entries(entry.metadata).map(([key, value]) => (
                            <Badge
                                key={key}
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5"
                            >
                                {key}: {String(value)}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// LIVE PROCESSING VIEW
// ============================================

function LiveProcessingView({
    entries,
    currentPhase,
}: {
    entries: LiveLogEntry[];
    currentPhase?: string;
}) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new entries
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries.length]);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getPhaseLabel = (phase: string) => {
        switch (phase) {
            case "fetching":
                return "Loading Documents";
            case "documents_loaded":
                return "Documents Ready";
            case "researching":
                return "Deep Research";
            case "research_complete":
                return "Research Complete";
            case "structuring":
                return "Generating Syllabus";
            case "fallback":
                return "Fallback Analysis";
            default:
                return "Processing";
        }
    };

    return (
        <div className="space-y-3">
            {/* Current phase indicator - compact inline */}
            {currentPhase && (
                <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <span className="font-medium text-primary">
                            {getPhaseLabel(currentPhase)}
                        </span>
                    </div>
                    <span className="text-muted-foreground">
                        {entries.length} events
                    </span>
                </div>
            )}

            {/* Log entries */}
            <div
                ref={scrollRef}
                className="max-h-[500px] overflow-y-auto space-y-0.5 pr-1"
            >
                {entries.map((entry) => (
                    <LogEntry
                        key={entry.id}
                        entry={entry}
                        isExpanded={expandedIds.has(entry.id)}
                        onToggle={() => toggleExpand(entry.id)}
                    />
                ))}

                {entries.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Waiting for processing to start...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// HISTORICAL SESSION VIEW
// ============================================

function HistoricalSessionView({ session }: { session: ProcessingSession }) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [showResearchReport, setShowResearchReport] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const duration = session.completedAt
        ? Math.round((session.completedAt - session.startedAt) / 1000)
        : null;

    return (
        <div className="space-y-4">
            {/* Session header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {new Date(session.startedAt).toLocaleString()}
                    </p>
                </div>
                {session.completedAt && (
                    <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                    </Badge>
                )}
            </div>

            {/* Stats */}
            {session.stats && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">
                            {session.stats.documentsAnalyzed}
                        </p>
                        <p className="text-xs text-muted-foreground">Documents</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <Search className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">
                            {session.stats.searchQueries}
                        </p>
                        <p className="text-xs text-muted-foreground">Analysis Steps</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <Timer className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{duration}s</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                </div>
            )}

            <Separator />

            {/* Research Report Toggle */}
            {session.researchReport && (
                <div>
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setShowResearchReport(!showResearchReport)}
                    >
                        <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Research Report
                        </span>
                        {showResearchReport ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                    {showResearchReport && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg max-h-[300px] overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                                {session.researchReport}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Log entries */}
            <div>
                <p className="text-sm font-medium mb-2">
                    Processing Log ({session.logs.length} entries)
                </p>
                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                    {session.logs.map((entry) => (
                        <LogEntry
                            key={entry.id}
                            entry={entry}
                            isExpanded={expandedIds.has(entry.id)}
                            onToggle={() => toggleExpand(entry.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProcessingLogs({
    isLive = false,
    liveEntries = [],
    currentPhase,
    session,
    onClose,
    embedded = false,
}: ProcessingLogsProps) {
    const content = isLive ? (
        <LiveProcessingView entries={liveEntries} currentPhase={currentPhase} />
    ) : session ? (
        <HistoricalSessionView session={session} />
    ) : (
        <div className="text-center py-8 text-muted-foreground">
            <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No processing history available</p>
        </div>
    );

    // If embedded, just return the content without a card wrapper
    if (embedded) {
        return content;
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {isLive ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Live Processing
                            </>
                        ) : (
                            <>
                                <ScrollText className="h-4 w-4" />
                                Processing History
                            </>
                        )}
                    </CardTitle>
                    {onClose && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}
