import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const utapi = new UTApi();

type StitchVideoRequest = {
    videoUrls: string[]; // URLs of scene videos in order
    projectName: string;
    aspectRatio: "16:9" | "9:16";
};

/**
 * Download a video from URL to a temp file
 */
async function downloadVideo(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
}

/**
 * Stitch videos together using ffmpeg concat demuxer
 */
async function stitchVideos(
    inputPaths: string[],
    outputPath: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        // Create a concat file listing all inputs
        const tempDir = os.tmpdir();
        const concatFilePath = path.join(tempDir, `concat-${Date.now()}.txt`);

        // Write concat file with proper escaping
        const concatContent = inputPaths
            .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
            .join("\n");
        fs.writeFileSync(concatFilePath, concatContent);

        console.log("Concat file content:", concatContent);

        ffmpeg()
            .input(concatFilePath)
            .inputOptions(["-f", "concat", "-safe", "0"])
            .outputOptions(["-c", "copy"]) // Copy streams without re-encoding for speed
            .output(outputPath)
            .on("start", (cmd) => {
                console.log("FFmpeg command:", cmd);
            })
            .on("progress", (progress) => {
                console.log(`Processing: ${progress.percent?.toFixed(1)}%`);
            })
            .on("end", () => {
                // Clean up concat file
                fs.unlinkSync(concatFilePath);
                resolve();
            })
            .on("error", (err) => {
                console.error("FFmpeg error:", err);
                // Clean up concat file
                if (fs.existsSync(concatFilePath)) {
                    fs.unlinkSync(concatFilePath);
                }
                reject(err);
            })
            .run();
    });
}

export async function POST(request: NextRequest) {
    const tempFiles: string[] = [];

    try {
        const body: StitchVideoRequest = await request.json();
        const { videoUrls, projectName, aspectRatio } = body;

        if (!videoUrls || videoUrls.length === 0) {
            return NextResponse.json(
                { error: "No video URLs provided" },
                { status: 400 }
            );
        }

        console.log(`=== STITCHING ${videoUrls.length} VIDEOS ===`);
        console.log(`Project: ${projectName}`);
        console.log(`Aspect ratio: ${aspectRatio}`);

        const tempDir = os.tmpdir();
        const timestamp = Date.now();

        // Download all videos in parallel
        console.log("Downloading videos...");
        const downloadPromises = videoUrls.map(async (url, index) => {
            const tempPath = path.join(
                tempDir,
                `scene-${index}-${timestamp}.mp4`
            );
            tempFiles.push(tempPath);
            await downloadVideo(url, tempPath);
            console.log(`✓ Downloaded scene ${index + 1}`);
            return tempPath;
        });

        const inputPaths = await Promise.all(downloadPromises);

        // Stitch videos together
        console.log("Stitching videos...");
        const outputPath = path.join(
            tempDir,
            `final-${projectName.replace(
                /[^a-zA-Z0-9]/g,
                "-"
            )}-${timestamp}.mp4`
        );
        tempFiles.push(outputPath);

        await stitchVideos(inputPaths, outputPath);
        console.log("✓ Videos stitched successfully");

        // Upload to UploadThing
        console.log("Uploading final video...");
        const videoBuffer = fs.readFileSync(outputPath);
        const blob = new Blob([videoBuffer], { type: "video/mp4" });
        const fileName = `${projectName.replace(
            /[^a-zA-Z0-9]/g,
            "-"
        )}-final.mp4`;
        const file = new File([blob], fileName, { type: "video/mp4" });

        const uploadResponse = await utapi.uploadFiles([file]);

        if (!uploadResponse[0]?.data?.ufsUrl && !uploadResponse[0]?.data?.url) {
            throw new Error("Failed to upload final video to UploadThing");
        }

        const finalVideoUrl =
            uploadResponse[0].data.ufsUrl || uploadResponse[0].data.url || "";
        console.log(`✓ Final video uploaded: ${finalVideoUrl}`);

        // Calculate total duration (8 seconds per scene for Veo 3.1)
        const totalDuration = videoUrls.length * 8;

        // Clean up temp files
        for (const tempPath of tempFiles) {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }

        return NextResponse.json({
            videoUrl: finalVideoUrl,
            totalScenes: videoUrls.length,
            totalDuration,
            aspectRatio,
            fileName,
            message: `Successfully stitched ${videoUrls.length} videos into final video`,
        });
    } catch (error) {
        console.error("Error stitching videos:", error);

        // Clean up temp files on error
        for (const tempPath of tempFiles) {
            if (fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                } catch {
                    // Ignore cleanup errors
                }
            }
        }

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to stitch videos",
            },
            { status: 500 }
        );
    }
}
