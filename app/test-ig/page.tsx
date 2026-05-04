"use client";

import { useState } from "react";
import { Loader2, Instagram, CheckCircle, AlertCircle, ExternalLink, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type UploadState = "idle" | "checking" | "verified" | "uploading" | "success" | "error";

export default function TestInstagramUpload() {
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [videoUrl, setVideoUrl] = useState("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
    const [username, setUsername] = useState("");
    const [verifiedUsername, setVerifiedUsername] = useState<string | null>(null);
    const [caption, setCaption] = useState("Testing Instagram API upload from TATA AI #test");
    const [errorMessage, setErrorMessage] = useState("");
    const [uploadResult, setUploadResult] = useState<{ mediaId: string; postUrl: string; username: string } | null>(null);

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
                setUploadState("verified");
            } else {
                setErrorMessage(data.error || "Account not found. Please check the username.");
                setUploadState("idle");
            }
        } catch {
            setErrorMessage("Network error. Please try again.");
            setUploadState("idle");
        }
    };

    const handleUpload = async () => {
        if (!verifiedUsername || !videoUrl.trim()) {
            setErrorMessage("Please provide a valid video URL and verify your account first.");
            return;
        }

        setUploadState("uploading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/upload-to-social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl: videoUrl.trim(),
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
                setErrorMessage(data.error || "Upload failed. Please try again.");
                setUploadState("error");
            }
        } catch {
            setErrorMessage("Network error during upload. Please try again.");
            setUploadState("error");
        }
    };

    const handleReset = () => {
        setUploadState("idle");
        setVerifiedUsername(null);
        setUploadResult(null);
        setErrorMessage("");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="w-full max-w-md p-6 space-y-6 border rounded-xl shadow-sm bg-card">
                <div className="text-center space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                        <Instagram className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold">Instagram Upload Tester</h1>
                    <p className="text-sm text-muted-foreground">
                        Use this temporary page to test the Meta Graph API Reels upload functionality.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Step 1: Video URL */}
                    <div className="space-y-2">
                        <Label htmlFor="videoUrl">Video URL (Publicly accessible)</Label>
                        <Input
                            id="videoUrl"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            disabled={uploadState === "uploading" || uploadState === "success"}
                        />
                    </div>

                    {/* Step 2: Account Verification */}
                    {!verifiedUsername && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="username">Instagram Username</Label>
                                <Input
                                    id="username"
                                    placeholder="yourusername"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
                                    disabled={uploadState === "checking"}
                                />
                            </div>
                            <Button
                                onClick={handleCheckAccount}
                                disabled={uploadState === "checking" || !username.trim()}
                                className="w-full"
                            >
                                {uploadState === "checking" ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                ) : (
                                    "Verify Account"
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Caption & Upload */}
                    {verifiedUsername && uploadState !== "success" && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                Verified: <strong>@{verifiedUsername}</strong>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="caption">Caption</Label>
                                <Textarea
                                    id="caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    disabled={uploadState === "uploading"}
                                    rows={3}
                                />
                            </div>

                            <Button
                                onClick={handleUpload}
                                disabled={uploadState === "uploading" || !videoUrl.trim()}
                                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 text-white border-0"
                            >
                                {uploadState === "uploading" ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading to Instagram...</>
                                ) : (
                                    <><Instagram className="mr-2 h-4 w-4" /> Publish Reel</>
                                )}
                            </Button>
                            {uploadState === "uploading" && (
                                <p className="text-xs text-center text-muted-foreground mt-2">
                                    This can take a minute as Instagram processes the video.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Success State */}
                    {uploadState === "success" && uploadResult && (
                        <div className="p-4 space-y-4 text-center border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/50 rounded-lg">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-700 dark:text-green-300">Successfully Published!</h3>
                                <p className="text-sm text-green-600 dark:text-green-400">Your Reel is live on @{uploadResult.username}</p>
                            </div>
                            <a
                                href={uploadResult.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" /> View on Instagram
                            </a>
                            <Button variant="outline" onClick={handleReset} className="w-full">
                                Test Another Upload
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
