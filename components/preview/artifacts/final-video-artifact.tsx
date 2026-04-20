"use client";

import { useAppStore } from "@/lib/store";
import { Download, Video, Clock, Film, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalVideoArtifact() {
    const { project } = useAppStore();
    const finalVideoUrl = project?.finalVideoUrl;
    const scenes = project?.scenes || [];
    const aspectRatio = project?.overview?.aspectRatio || "16:9";
    const isPortrait = aspectRatio === "9:16";

    const totalDuration = scenes.length * 8; // 8 seconds per scene

    const handleDownload = () => {
        if (!finalVideoUrl) return;

        // Create a temporary link to download the video
        const link = document.createElement("a");
        link.href = finalVideoUrl;
        link.download = `${project?.name || "video"}-final.mp4`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!finalVideoUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Video className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <h4 className="font-medium mb-2">Final Video Not Ready</h4>
                <p className="text-sm text-muted-foreground">
                    Generate all scene videos first, then stitch them together
                    to create the final video.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Success Badge */}
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Your video is ready!</span>
            </div>

            {/* Video Preview */}
            <div
                className={`relative rounded-lg border bg-black overflow-hidden ${
                    isPortrait
                        ? "aspect-[9/16] max-w-[240px] mx-auto"
                        : "aspect-video"
                }`}
            >
                <video
                    src={finalVideoUrl}
                    className="h-full w-full object-contain"
                    controls
                    playsInline
                />
            </div>

            {/* Download Button */}
            <Button onClick={handleDownload} className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" />
                Download Final Video
            </Button>

            {/* Video Info */}
            <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                    Video Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <span>{scenes.length} scenes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>~{totalDuration}s duration</span>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    Format: {aspectRatio} (
                    {isPortrait ? "Portrait" : "Landscape"})
                </div>
            </div>

            {/* Alternative: Open in New Tab */}
            <div className="text-center">
                <a
                    href={finalVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary underline"
                >
                    Open video in new tab
                </a>
            </div>
        </div>
    );
}
