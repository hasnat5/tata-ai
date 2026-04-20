"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Mic, FileText, Loader2 } from "lucide-react";
import type { UploadedFile } from "@/lib/types";
import { useUploadThing } from "@/lib/uploadthing";

type UploadRequestModalProps = {
    type: "image" | "audio" | "document";
    purpose: string;
    onUploadComplete: (files: UploadedFile[]) => void;
    onCancel: () => void;
};

export function UploadRequestModal({
    type,
    purpose,
    onUploadComplete,
    onCancel,
}: UploadRequestModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload } = useUploadThing("chatAttachmentUploader", {
        onClientUploadComplete: (res) => {
            if (res) {
                const newFiles: UploadedFile[] = res.map((file) => ({
                    url: file.ufsUrl || file.url,
                    name: file.name,
                    type: type,
                }));
                setUploadedFiles((prev) => [...prev, ...newFiles]);
            }
            setIsUploading(false);
        },
        onUploadError: (error) => {
            console.error("Upload error:", error);
            setIsUploading(false);
        },
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        await startUpload(Array.from(files));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDone = () => {
        if (uploadedFiles.length > 0) {
            onUploadComplete(uploadedFiles);
        }
    };

    const getAcceptString = () => {
        switch (type) {
            case "image":
                return "image/*";
            case "audio":
                return "audio/*";
            case "document":
                return ".pdf,.txt,.doc,.docx";
            default:
                return "*/*";
        }
    };

    const getIcon = () => {
        switch (type) {
            case "image":
                return <ImageIcon className="h-8 w-8" />;
            case "audio":
                return <Mic className="h-8 w-8" />;
            case "document":
                return <FileText className="h-8 w-8" />;
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case "image":
                return "images";
            case "audio":
                return "audio files";
            case "document":
                return "documents";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Upload Required</h3>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Purpose */}
                <p className="mb-6 text-sm text-muted-foreground">
                    The AI Director needs you to upload <strong>{purpose}</strong>
                </p>

                {/* Upload area */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptString()}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mb-4 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">
                                Uploading...
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="mb-2 text-primary">{getIcon()}</div>
                            <span className="text-sm font-medium">
                                Click to upload {getTypeLabel()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                or drag and drop
                            </span>
                        </>
                    )}
                </button>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                            Uploaded ({uploadedFiles.length})
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                            {uploadedFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
                                >
                                    {type === "image" ? (
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    ) : type === "audio" ? (
                                        <Mic className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="truncate">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleDone}
                        disabled={uploadedFiles.length === 0 || isUploading}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Done ({uploadedFiles.length})
                    </Button>
                </div>
            </div>
        </div>
    );
}
