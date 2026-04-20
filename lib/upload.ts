import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Upload a base64 image to UploadThing
 */
export async function uploadBase64Image(
    base64DataUrl: string,
    filename: string
): Promise<string> {
    // Convert base64 to buffer
    const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: "image/png" });

    // Create a File object
    const file = new File([blob], filename, { type: "image/png" });

    // Upload to UploadThing
    const response = await utapi.uploadFiles([file]);

    if (response[0]?.error) {
        throw new Error(`Upload failed: ${response[0].error.message}`);
    }

    return response[0]?.data?.ufsUrl || response[0]?.data?.url || "";
}

/**
 * Upload a base64 audio file to UploadThing
 */
export async function uploadBase64Audio(
    base64DataUrl: string,
    filename: string
): Promise<string> {
    // Extract mime type and base64 data
    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = matches?.[1] || "audio/mpeg";
    const base64Data = matches?.[2] || base64DataUrl;

    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    const response = await utapi.uploadFiles([file]);

    if (response[0]?.error) {
        throw new Error(`Upload failed: ${response[0].error.message}`);
    }

    return response[0]?.data?.ufsUrl || response[0]?.data?.url || "";
}

/**
 * Upload a file from URL to UploadThing
 */
export async function uploadFromUrl(url: string): Promise<string> {
    const response = await utapi.uploadFilesFromUrl(url);

    if (response.error) {
        throw new Error(`Upload failed: ${response.error.message}`);
    }

    return response.data?.ufsUrl || response.data?.url || "";
}
