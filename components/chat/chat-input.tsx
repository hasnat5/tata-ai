"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Send,
    Paperclip,
    X,
    Image as ImageIcon,
    Mic,
    FileText,
    MessageSquare,
    Square,
    Loader2,
} from "lucide-react";
import type { UploadedFile, ScriptContext } from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAppStore } from "@/lib/store";

// Audio visualizer component
function AudioVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Get the primary color from CSS
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor =
            computedStyle.getPropertyValue("--primary").trim() || "0 0% 9%";

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = 3;
            const gap = 2;
            const bars = Math.floor(canvas.width / (barWidth + gap));
            const step = Math.max(1, Math.floor(bufferLength / bars));

            // Set fill color using the primary color
            ctx.fillStyle = `hsl(${primaryColor})`;

            for (let i = 0; i < bars; i++) {
                const value = dataArray[i * step] || 0;
                // Minimum bar height of 4px so something is always visible
                const minHeight = 4;
                const barHeight = Math.max(
                    minHeight,
                    (value / 255) * canvas.height * 0.9
                );
                const x = i * (barWidth + gap);
                const y = (canvas.height - barHeight) / 2;

                // Draw rounded rectangle manually for better compatibility
                const radius = 1.5;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + barWidth - radius, y);
                ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
                ctx.lineTo(x + barWidth, y + barHeight - radius);
                ctx.quadraticCurveTo(
                    x + barWidth,
                    y + barHeight,
                    x + barWidth - radius,
                    y + barHeight
                );
                ctx.lineTo(x + radius, y + barHeight);
                ctx.quadraticCurveTo(
                    x,
                    y + barHeight,
                    x,
                    y + barHeight - radius
                );
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
            }
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser]);

    return (
        <canvas ref={canvasRef} width={80} height={24} className="h-6 w-20" />
    );
}

type ChatInputProps = {
    onSend: (message: string, attachments?: UploadedFile[]) => void;
    isLoading?: boolean;
    placeholder?: string;
};

/**
 * Detect file type from MIME type or extension
 */
function detectFileType(file: {
    type?: string;
    name: string;
}): UploadedFile["type"] {
    const mimeType = file.type?.toLowerCase() || "";
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    // Check MIME type first
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf" || mimeType.startsWith("text/"))
        return "document";

    // Fallback to extension
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const audioExts = ["mp3", "wav", "m4a", "ogg", "aac", "flac"];
    const docExts = ["pdf", "txt", "doc", "docx"];

    if (imageExts.includes(extension)) return "image";
    if (audioExts.includes(extension)) return "audio";
    if (docExts.includes(extension)) return "document";

    return "document"; // Default fallback
}

export function ChatInput({
    onSend,
    isLoading = false,
    placeholder = "Type your message...",
}: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const { scriptContext, setScriptContext, project } = useAppStore();

    // Cleanup audio context on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            // Set up audio context for visualization
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            // Resume audio context if suspended (browser autoplay policy)
            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }

            const source = audioContext.createMediaStreamSource(stream);
            const analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            analyserNode.smoothingTimeConstant = 0.5;
            source.connect(analyserNode);
            setAnalyser(analyserNode);

            // Set up media recorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm",
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());

                // Close audio context
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
                setAnalyser(null);

                // Create blob and transcribe
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });

                if (audioBlob.size > 0) {
                    setIsTranscribing(true);
                    try {
                        // Convert to base64
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = async () => {
                            const base64 = (reader.result as string).split(
                                ","
                            )[1];

                            // Send to transcription API
                            const response = await fetch(
                                "/api/transcribe-audio",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        audioBase64: base64,
                                        mimeType: "audio/webm",
                                    }),
                                }
                            );

                            if (response.ok) {
                                const { transcript } = await response.json();
                                if (transcript) {
                                    setMessage((prev) =>
                                        prev
                                            ? `${prev} ${transcript}`
                                            : transcript
                                    );
                                }
                            }
                            setIsTranscribing(false);
                        };
                    } catch (error) {
                        console.error("Transcription error:", error);
                        setIsTranscribing(false);
                    }
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Failed to start recording:", error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const { startUpload } = useUploadThing("chatAttachmentUploader", {
        onClientUploadComplete: (res) => {
            if (res) {
                const newAttachments: UploadedFile[] = res.map((file) => ({
                    url: file.ufsUrl || file.url,
                    name: file.name,
                    type: detectFileType({ type: file.type, name: file.name }),
                }));
                setAttachments((prev) => [...prev, ...newAttachments]);
            }
            setIsUploading(false);
        },
        onUploadError: (error) => {
            console.error("Upload error:", error);
            setIsUploading(false);
        },
    });

    const handleSend = useCallback(() => {
        if (!message.trim() && attachments.length === 0 && !scriptContext)
            return;

        // Build the message with script context if present
        let fullMessage = message.trim();
        if (scriptContext?.selectedText) {
            // Use sceneNumber from context if available, otherwise look it up
            const sceneNum =
                scriptContext.sceneNumber ||
                (scriptContext.sceneId
                    ? (project?.scenes.findIndex(
                          (s) => s.id === scriptContext.sceneId
                      ) ?? -1) + 1
                    : undefined);

            const fieldLabel = scriptContext.fieldType
                ? scriptContext.fieldType === "dialogue"
                    ? "dialogue"
                    : scriptContext.fieldType === "description"
                    ? "visual description"
                    : scriptContext.fieldType
                : "content";

            const contextInfo =
                sceneNum && sceneNum > 0
                    ? `[Regarding Scene ${sceneNum}, ${fieldLabel}: "${scriptContext.selectedText}"]`
                    : `[Regarding: "${scriptContext.selectedText}"]`;
            fullMessage = `${contextInfo}\n\n${fullMessage}`;
        }

        onSend(fullMessage, attachments.length > 0 ? attachments : undefined);
        setMessage("");
        setAttachments([]);
        setScriptContext(null);
    }, [
        message,
        attachments,
        scriptContext,
        project,
        onSend,
        setScriptContext,
    ]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        await startUpload(Array.from(files));

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (type: UploadedFile["type"]) => {
        switch (type) {
            case "image":
                return <ImageIcon className="h-4 w-4" />;
            case "audio":
                return <Mic className="h-4 w-4" />;
            case "document":
                return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <div className="border-t border-border bg-background p-4">
            {/* Combined context and attachments preview */}
            {(scriptContext?.selectedText || attachments.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {/* Script context as an attachment-like element */}
                    {scriptContext?.selectedText && (
                        <div className="group relative flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 max-w-full">
                            <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="font-medium text-primary">
                                        {scriptContext.sceneNumber
                                            ? `Scene ${scriptContext.sceneNumber}`
                                            : "Script"}
                                    </span>
                                    {scriptContext.fieldType && (
                                        <>
                                            <span className="text-muted-foreground">
                                                •
                                            </span>
                                            <span className="text-muted-foreground capitalize">
                                                {scriptContext.fieldType}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground italic line-clamp-1 mt-0.5">
                                    &ldquo;{scriptContext.selectedText}&rdquo;
                                </p>
                            </div>
                            <button
                                onClick={() => setScriptContext(null)}
                                className="shrink-0 rounded-full p-0.5 opacity-50 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {/* File attachments */}
                    {attachments.map((attachment, index) => (
                        <div
                            key={index}
                            className="group relative flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1"
                        >
                            {attachment.type === "image" ? (
                                <div className="relative h-10 w-10 overflow-hidden rounded">
                                    <Image
                                        src={attachment.url}
                                        alt={attachment.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                getFileIcon(attachment.type)
                            )}
                            <span className="max-w-[100px] truncate text-sm">
                                {attachment.name}
                            </span>
                            <button
                                onClick={() => removeAttachment(index)}
                                className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-2">
                {/* File upload button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,audio/*,.pdf,.txt,.doc,.docx"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoading || isRecording}
                    className="shrink-0"
                >
                    <Paperclip
                        className={cn(
                            "h-4 w-4",
                            isUploading && "animate-pulse"
                        )}
                    />
                </Button>

                {/* Voice recording button */}
                {isRecording ? (
                    <div className="flex items-center gap-2 rounded-md border border-primary bg-primary/10 px-3 py-2">
                        <AudioVisualizer analyser={analyser} />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={stopRecording}
                            className="h-7 w-7 shrink-0"
                        >
                            <Square className="h-3 w-3" />
                        </Button>
                    </div>
                ) : isTranscribing ? (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">
                            Transcribing...
                        </span>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={startRecording}
                        disabled={isLoading || isUploading}
                        className="shrink-0"
                        title="Voice input"
                    >
                        <Mic className="h-4 w-4" />
                    </Button>
                )}

                {/* Text input */}
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isLoading || isRecording}
                    rows={1}
                    className="min-h-[44px] max-h-[200px] resize-none"
                />

                {/* Send button */}
                <Button
                    type="button"
                    size="icon"
                    onClick={handleSend}
                    disabled={
                        isLoading ||
                        isUploading ||
                        isRecording ||
                        isTranscribing ||
                        (!message.trim() && attachments.length === 0)
                    }
                    className="shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>

            {/* Helper text */}
            <p className="mt-2 text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    );
}
