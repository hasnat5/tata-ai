"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
    Download,
    Video,
    Clock,
    Film,
    CheckCircle,
    Instagram,
    Loader2,
    ExternalLink,
    AlertCircle,
    PartyPopper,
    AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type UploadState =
    | "idle"
    | "form"
    | "checking"
    | "uploading"
    | "success"
    | "error";

type UploadResult = {
    mediaId: string;
    postUrl: string;
    username: string;
};

export function FinalVideoArtifact() {
    const { project } = useAppStore();
    const finalVideoUrl = project?.finalVideoUrl;
    const scenes = project?.scenes || [];
    const aspectRatio = project?.overview?.aspectRatio || "16:9";
    const isPortrait = aspectRatio === "9:16";

    const totalDuration = scenes.length * 8; // 8 seconds per scene

    // ---------- Social upload state ----------
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [username, setUsername] = useState("");
    const [verifiedUsername, setVerifiedUsername] = useState<string | null>(
        null
    );
    const [caption, setCaption] = useState("");
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(
        null
    );
    const [errorMessage, setErrorMessage] = useState("");

    const handleDownload = () => {
        if (!finalVideoUrl) return;

        const link = document.createElement("a");
        link.href = finalVideoUrl;
        link.download = `${project?.name || "video"}-final.mp4`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCheckAccount = async () => {
        if (!username.trim()) {
            setErrorMessage("Please enter your Instagram username.");
            return;
        }

        setUploadState("checking");
        setErrorMessage("");

        try {
            const res = await fetch("/api/upload-to-social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "check",
                    username: username.trim(),
                }),
            });

            const data = await res.json();

            if (data.valid) {
                setVerifiedUsername(data.username);
                setUploadState("form");
            } else {
                setErrorMessage(
                    data.error || "Account not found. Please check the username."
                );
                setUploadState("form");
            }
        } catch {
            setErrorMessage("Network error. Please try again.");
            setUploadState("form");
        }
    };

    const handleUpload = async () => {
        if (!verifiedUsername) {
            setErrorMessage("Please verify your Instagram account first.");
            return;
        }

        setUploadState("uploading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/upload-to-social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl: finalVideoUrl,
                    caption: caption.trim(),
                    username: verifiedUsername,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setUploadResult({
                    mediaId: data.mediaId,
                    postUrl: data.postUrl,
                    username: data.username || verifiedUsername,
                });
                setUploadState("success");
            } else {
                setErrorMessage(
                    data.error || "Upload failed. Please try again."
                );
                setUploadState("error");
            }
        } catch {
            setErrorMessage("Network error during upload. Please try again.");
            setUploadState("error");
        }
    };

    const handleReset = () => {
        setUploadState("idle");
        setUsername("");
        setVerifiedUsername(null);
        setCaption("");
        setUploadResult(null);
        setErrorMessage("");
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

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={handleDownload}
                    className="flex-1 gap-2"
                    size="lg"
                    variant="outline"
                >
                    <Download className="h-5 w-5" />
                    Download
                </Button>
                {uploadState === "idle" && (
                    <Button
                        onClick={() => setUploadState("form")}
                        className="flex-1 gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white border-0"
                        size="lg"
                    >
                        <Instagram className="h-5 w-5" />
                        Post as Reel
                    </Button>
                )}
            </div>

            {/* ============================================ */}
            {/* UPLOAD TO INSTAGRAM FORM                      */}
            {/* ============================================ */}
            {(uploadState === "form" ||
                uploadState === "checking" ||
                uploadState === "uploading") && (
                <div className="border border-pink-200 dark:border-pink-900/50 rounded-xl bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-orange-50/20 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-orange-950/10 p-4 space-y-4 transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                                <Instagram className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold">
                                    Post as Instagram Reel
                                </h4>
                                {verifiedUsername && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Posting to @{verifiedUsername}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleReset}
                            className="text-muted-foreground"
                        >
                            Cancel
                        </Button>
                    </div>

                    {/* Instagram Username */}
                    {!verifiedUsername && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="ig-username"
                                    className="text-xs"
                                >
                                    Your Instagram Account
                                </Label>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        id="ig-username"
                                        placeholder="yourusername"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(
                                                e.target.value.replace(
                                                    /^@/,
                                                    ""
                                                )
                                            )
                                        }
                                        disabled={
                                            uploadState === "checking"
                                        }
                                        className="text-xs h-8 pl-8"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleCheckAccount();
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Enter your Instagram Business or Creator
                                    account username.
                                </p>
                            </div>

                            <Button
                                onClick={handleCheckAccount}
                                disabled={
                                    uploadState === "checking" ||
                                    !username.trim()
                                }
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                            >
                                {uploadState === "checking" ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Verifying account...
                                    </>
                                ) : (
                                    <>
                                        <Instagram className="h-3 w-3" />
                                        Connect Account
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Caption — shown after account is verified */}
                    {verifiedUsername && (
                        <div className="space-y-1.5">
                            <Label htmlFor="ig-caption" className="text-xs">
                                Caption{" "}
                                <span className="text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="ig-caption"
                                placeholder="Write a caption for your Reel... #hashtags"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                disabled={uploadState === "uploading"}
                                className="text-xs min-h-[60px]"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Publish Button — shown after account is verified */}
                    {verifiedUsername && (
                        <>
                            <Button
                                onClick={handleUpload}
                                disabled={uploadState === "uploading"}
                                className="w-full gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white border-0"
                                size="lg"
                            >
                                {uploadState === "uploading" ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading Reel...
                                    </>
                                ) : (
                                    <>
                                        <Instagram className="h-4 w-4" />
                                        Publish Reel
                                    </>
                                )}
                            </Button>

                            {/* Processing note */}
                            {uploadState === "uploading" && (
                                <p className="text-[10px] text-muted-foreground text-center">
                                    Instagram needs to process the video
                                    before publishing. This may take a minute
                                    or two.
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* SUCCESS STATE                                 */}
            {/* ============================================ */}
            {uploadState === "success" && uploadResult && (
                <div className="border border-green-200 dark:border-green-900/50 rounded-xl bg-green-50/50 dark:bg-green-950/20 p-4 space-y-3 transition-all">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                            <PartyPopper className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">
                                Reel Published!
                            </h4>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                Live on @{uploadResult.username}
                            </p>
                        </div>
                    </div>

                    <a
                        href={uploadResult.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View on Instagram
                    </a>

                    <Button
                        onClick={handleReset}
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                    >
                        Upload again
                    </Button>
                </div>
            )}

            {/* ============================================ */}
            {/* ERROR STATE                                   */}
            {/* ============================================ */}
            {uploadState === "error" && (
                <div className="border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50/50 dark:bg-red-950/20 p-4 space-y-3 transition-all">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-300">
                                Upload Failed
                            </h4>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {errorMessage}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                setUploadState("form");
                                setErrorMessage("");
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-muted-foreground"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

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
