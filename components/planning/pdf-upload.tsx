"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "@uploadthing/react";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    FileText,
    Upload,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

type UploadedPdf = {
    url: string;
    name: string;
};

type PdfUploadProps = {
    onFilesUploaded: (files: UploadedPdf[]) => void;
    uploadedFiles: UploadedPdf[];
    onRemoveFile: (url: string) => void;
    disabled?: boolean;
};

export function PdfUpload({
    onFilesUploaded,
    uploadedFiles,
    onRemoveFile,
    disabled = false,
}: PdfUploadProps) {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { startUpload, isUploading, routeConfig } = useUploadThing(
        "syllabusPdfUploader",
        {
            onClientUploadComplete: (res) => {
                const uploaded = res.map((r) => ({
                    url: r.ufsUrl,
                    name: r.name,
                }));
                onFilesUploaded(uploaded);
                setPendingFiles([]);
                setUploadError(null);
            },
            onUploadError: (error) => {
                setUploadError(error.message);
                setPendingFiles([]);
            },
        }
    );

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (disabled) return;
            setPendingFiles(acceptedFiles);
            setUploadError(null);
            startUpload(acceptedFiles);
        },
        [startUpload, disabled]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: routeConfig
            ? generateClientDropzoneAccept(
                  generatePermittedFileTypes(routeConfig).fileTypes
              )
            : { "application/pdf": [".pdf"] },
        disabled: disabled || isUploading,
        maxFiles: 10,
    });

    const { size: _size, ...dropzoneProps } = getRootProps();

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <Card
                {...dropzoneProps}
                className={`
                    border-2 border-dashed transition-colors cursor-pointer
                    ${
                        isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                    }
                    ${
                        disabled || isUploading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                    }
                `}
            >
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">
                                Uploading {pendingFiles.length} file(s)...
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-1">
                                {isDragActive
                                    ? "Drop PDF files here"
                                    : "Drag & drop PDF files here"}
                            </p>
                            <p className="text-xs text-muted-foreground mb-3">
                                or click to browse (max 10 files, 32MB each)
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                            >
                                Select Files
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Error message */}
            {uploadError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                </div>
            )}

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Uploaded Files ({uploadedFiles.length})
                    </p>
                    <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                            <div
                                key={file.url}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-medium truncate max-w-[200px]">
                                        {file.name}
                                    </span>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveFile(file.url);
                                    }}
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
