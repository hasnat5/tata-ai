import {
  GoogleGenAI,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { UTApi } from "uploadthing/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION,
});
const utapi = new UTApi();

type CharacterInScene = {
  name: string;
  attireName: string;
  attireAngles: string[]; // 4 angle reference images
};

type GenerateVideoRequest = {
  sceneId: string;
  sceneIndex: number;
  sceneType: "scene" | "broll" | "infographic";
  sceneDescription: string;
  dialogue: string | null;
  speakerName: string | null;
  aspectRatio: "16:9" | "9:16";
  aestheticDescription: string;
  thumbnailUrl: string;
  charactersInScene: CharacterInScene[];
  brandName: string | null;
  includeBrandLogo: boolean;
};

/**
 * Fetch an image from URL and return as buffer
 */
async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Create a 2x2 grid from 4 character angle images
 * Each input image is assumed to be square
 */
async function createCharacterGrid(angleUrls: string[]): Promise<Buffer> {
  // Fetch all 4 images
  const images: Buffer[] = [];
  for (let i = 0; i < Math.min(4, angleUrls.length); i++) {
    if (angleUrls[i]) {
      const buffer = await fetchImageAsBuffer(angleUrls[i]);
      images.push(buffer);
    }
  }

  // If we don't have 4 images, duplicate to fill
  while (images.length < 4) {
    images.push(images[0] || Buffer.alloc(0));
  }

  // Resize each image to consistent size (512x512)
  const tileSize = 512;
  const resizedImages = await Promise.all(
    images.map((img) =>
      sharp(img).resize(tileSize, tileSize, { fit: "cover" }).toBuffer(),
    ),
  );

  // Create 2x2 grid (1024x1024)
  const gridSize = tileSize * 2;
  const grid = await sharp({
    create: {
      width: gridSize,
      height: gridSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      { input: resizedImages[0], left: 0, top: 0 },
      { input: resizedImages[1], left: tileSize, top: 0 },
      { input: resizedImages[2], left: 0, top: tileSize },
      { input: resizedImages[3], left: tileSize, top: tileSize },
    ])
    .png()
    .toBuffer();

  return grid;
}

/**
 * Build the Veo prompt from scene info
 */
function buildVideoPrompt(
  sceneDescription: string,
  dialogue: string | null,
  speakerName: string | null,
  sceneType: string,
  aestheticDescription: string,
  brandName: string | null,
  includeBrandLogo: boolean,
  charactersInScene: CharacterInScene[],
): string {
  const characterNames = charactersInScene.map((c) => c.name).join(" and ");

  let prompt = `Create a cinematic video scene with the following details:

VISUAL DESCRIPTION: ${sceneDescription}

ART STYLE: ${aestheticDescription}

SCENE TYPE: ${
    sceneType === "scene"
      ? "Speaking/dialogue scene"
      : sceneType === "broll"
        ? "B-roll/ambient footage"
        : "Infographic/visual display"
  }`;

  if (characterNames) {
    prompt += `\n\nCHARACTERS IN SCENE: ${characterNames}`;
    if (charactersInScene.length > 0) {
      prompt += ` (reference images provided for character consistency)`;
    }
  }

  if (dialogue && speakerName) {
    prompt += `\n\nDIALOGUE: ${speakerName} says: "${dialogue}"`;
    prompt += `\nGenerate appropriate voice audio for this dialogue that matches the character.`;
  } else if (dialogue) {
    prompt += `\n\nVOICEOVER: "${dialogue}"`;
  }

  if (includeBrandLogo && brandName) {
    prompt += `\n\nBRANDING: Subtly incorporate "${brandName}" branding into the scene.`;
  }

  prompt += `\n\nREQUIREMENTS:
- Maintain consistent character appearance using the provided reference images
- Create smooth, cinematic motion
- Generate appropriate ambient sound and any dialogue audio
- Match the visual style described above`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateVideoRequest = await request.json();
    const {
      sceneId,
      sceneIndex,
      sceneType,
      sceneDescription,
      dialogue,
      speakerName,
      aspectRatio,
      aestheticDescription,
      thumbnailUrl,
      charactersInScene,
      brandName,
      includeBrandLogo,
    } = body;

    const isPortrait = aspectRatio === "9:16";
    const sceneTag = `[Scene ${sceneIndex + 1}]`;

    console.log(`${sceneTag} === GENERATING VIDEO ===`);
    console.log(
      `${sceneTag} Aspect ratio: ${aspectRatio} (${isPortrait ? "portrait" : "landscape"})`,
    );
    console.log(`${sceneTag} Characters in scene: ${charactersInScene.length}`);

    // Build the prompt
    const prompt = buildVideoPrompt(
      sceneDescription,
      dialogue,
      speakerName,
      sceneType,
      aestheticDescription,
      brandName,
      includeBrandLogo,
      charactersInScene,
    );

    console.log(`${sceneTag} Prompt length: ${prompt.length} characters`);

    // Fetch thumbnail as buffer
    const thumbnailBuffer = await fetchImageAsBuffer(thumbnailUrl);
    const thumbnailBase64 = thumbnailBuffer.toString("base64");

    let operation;

    if (isPortrait) {
      // PORTRAIT MODE: Use image-to-video (no reference images allowed per docs)
      // Reference images only support 16:9 aspect ratio
      console.log(`${sceneTag} Using image-to-video mode (portrait)`);

      operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-001",
        prompt: prompt,
        image: {
          imageBytes: thumbnailBase64,
          mimeType: "image/png",
        },
        config: {
          aspectRatio: "9:16",
          personGeneration: "allow_adult",
        },
      });
    } else {
      // LANDSCAPE MODE: Use reference images (up to 3)
      // Per docs: referenceImages only supports 16:9 and requires 8s duration
      console.log(`${sceneTag} Using reference images mode (landscape)`);

      // Prepare reference images - match the API structure from docs
      const referenceImages: VideoGenerationReferenceImage[] = [];

      // Add thumbnail as first reference
      referenceImages.push({
        image: {
          imageBytes: thumbnailBase64,
          mimeType: "image/png",
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      });

      // Add character grids (up to 2 characters to stay within 3 reference images limit)
      for (let i = 0; i < Math.min(2, charactersInScene.length); i++) {
        const char = charactersInScene[i];
        if (char.attireAngles && char.attireAngles.length >= 4) {
          try {
            console.log(
              `${sceneTag} Creating character grid for ${char.name}...`,
            );
            const gridBuffer = await createCharacterGrid(char.attireAngles);
            const gridBase64 = gridBuffer.toString("base64");
            referenceImages.push({
              image: {
                imageBytes: gridBase64,
                mimeType: "image/png",
              },
              referenceType: VideoGenerationReferenceType.ASSET,
            });
            console.log(`${sceneTag} ✓ Added character grid for ${char.name}`);
          } catch (e) {
            console.warn(
              `${sceneTag} Failed to create grid for ${char.name}:`,
              e,
            );
          }
        }
      }

      console.log(
        `${sceneTag} Total reference images: ${referenceImages.length}`,
      );

      operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-001",
        prompt: prompt,
        config: {
          aspectRatio: "16:9",
          // Per docs: Must be 8 seconds when using referenceImages (only supports 16:9)
          durationSeconds: 8,
          personGeneration: "allow_adult",
          referenceImages: referenceImages,
        },
      });
    }

    // Poll for completion - per docs, videos can take up to 6 minutes
    console.log(
      `${sceneTag} Video generation started, polling for completion...`,
    );
    let pollCount = 0;
    const maxPolls = 60; // 10 minutes max (10 seconds per poll)

    while (!operation.done && pollCount < maxPolls) {
      pollCount++;
      console.log(`${sceneTag} Poll ${pollCount}/${maxPolls}...`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      console.log(
        `${sceneTag} Poll ${pollCount}/${maxPolls} returned done=${operation.done}`,
      );
    }

    if (!operation.done) {
      throw new Error(`${sceneTag} Video generation timed out`);
    }

    // Check if the operation itself returned an error (e.g., safety block)
    if (operation.error) {
      console.error(
        `${sceneTag} Vertex AI Operation Error:`,
        JSON.stringify(operation.error, null, 2),
      );
      throw new Error(
        `${sceneTag} Video generation failed: ${operation.error.message || "Unknown error"}`,
      );
    }

    // Get the video file from response
    // Vertex AI's Veo can return the video in two shapes:
    //   - video.uri:        a downloadable URL (Google AI / API-key mode)
    //   - video.videoBytes: base64-encoded MP4 inline (Vertex AI mode)
    // Treat done=true with neither field as a hard failure (safety block,
    // quota, etc.), so we don't silently skip the upload step.
    const generatedVideo = operation.response?.generatedVideos?.[0];
    const videoFile = generatedVideo?.video;
    if (!videoFile || (!videoFile.uri && !videoFile.videoBytes)) {
      console.error(
        `${sceneTag} Operation done but no usable video. Full response:`,
        JSON.stringify(operation, null, 2),
      );
      throw new Error(
        `${sceneTag} No video generated (operation completed without uri or videoBytes). Check server logs for full response.`,
      );
    }

    console.log(
      `${sceneTag} Video generation complete after ${pollCount} poll(s).`,
    );

    // Download the video to a temp file, then upload to UploadThing for persistent storage
    let videoUrl: string;
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(
      tempDir,
      `scene-${sceneIndex + 1}-${Date.now()}.mp4`,
    );

    try {
      // Vertex AI returns videoBytes (base64) inline; the public Gemini API
      // returns a downloadable uri. Handle both.
      let buffer: Buffer;
      if (videoFile.videoBytes) {
        console.log(
          `${sceneTag} Decoding base64 videoBytes from Vertex response...`,
        );
        buffer = Buffer.from(videoFile.videoBytes, "base64");
      } else if (videoFile.uri) {
        console.log(`${sceneTag} Downloading video from Vertex URI...`);
        const downloadResponse = await fetch(videoFile.uri);
        if (!downloadResponse.ok) {
          throw new Error(
            `Failed to download video from URI: ${downloadResponse.status} ${downloadResponse.statusText}`,
          );
        }
        buffer = Buffer.from(await downloadResponse.arrayBuffer());
      } else {
        throw new Error("Video object has neither videoBytes nor uri.");
      }

      // Sanity check: a real Veo MP4 will be much larger than this. If we got
      // back something tiny, decoding probably failed or the response was
      // empty, and we should fail loudly instead of uploading garbage.
      if (buffer.byteLength < 1024) {
        throw new Error(
          `Decoded video is suspiciously small (${buffer.byteLength} bytes). Likely not a valid MP4.`,
        );
      }

      fs.writeFileSync(tempFilePath, buffer);
      console.log(
        `${sceneTag} Video written to ${tempFilePath} (${buffer.byteLength} bytes)`,
      );

      // Read the file and upload to UploadThing
      const videoBuffer = fs.readFileSync(tempFilePath);
      const blob = new Blob([videoBuffer], { type: "video/mp4" });
      const file = new File([blob], `scene-${sceneIndex + 1}-video.mp4`, {
        type: "video/mp4",
      });

      const uploadResponse = await utapi.uploadFiles([file]);

      if (uploadResponse[0]?.data?.ufsUrl || uploadResponse[0]?.data?.url) {
        videoUrl =
          uploadResponse[0].data.ufsUrl || uploadResponse[0].data.url || "";
        console.log(`${sceneTag} Video uploaded to UploadThing: ${videoUrl}`);
      } else {
        throw new Error(
          `Failed to upload video to UploadThing: ${JSON.stringify(uploadResponse[0]?.error ?? uploadResponse[0])}`,
        );
      }
    } finally {
      // Always try to clean up the temp file, even if upload failed
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.warn(
          `${sceneTag} Failed to clean up temp file:`,
          cleanupError,
        );
      }
    }

    console.log(`${sceneTag} Final video URL: ${videoUrl}`);

    return NextResponse.json({
      sceneId,
      sceneIndex,
      videoUrl,
      message: `Generated video for Scene ${sceneIndex + 1}`,
    });
  } catch (error) {
    console.error("[generate-video] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate video",
      },
      { status: 500 },
    );
  }
}
