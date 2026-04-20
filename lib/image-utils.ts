/**
 * Check if a string is a URL
 */
export function isUrl(str: string): boolean {
    return str.startsWith("http://") || str.startsWith("https://");
}

/**
 * Check if a string is a base64 data URL
 */
export function isBase64DataUrl(str: string): boolean {
    return str.startsWith("data:");
}

/**
 * Extract base64 data from a data URL
 */
export function extractBase64(dataUrl: string): string {
    const matches = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (matches && matches[1]) {
        return matches[1];
    }
    return dataUrl;
}

/**
 * Convert an image URL or base64 to base64 string (without data URL prefix)
 */
export async function toBase64(imageSource: string): Promise<string> {
    if (isBase64DataUrl(imageSource)) {
        return extractBase64(imageSource);
    }

    if (isUrl(imageSource)) {
        const response = await fetch(imageSource);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString("base64");
    }

    // Assume it's already base64
    return imageSource;
}

/**
 * Convert an image URL or base64 to Buffer
 */
export async function toBuffer(imageSource: string): Promise<Buffer> {
    if (isBase64DataUrl(imageSource)) {
        const base64 = extractBase64(imageSource);
        return Buffer.from(base64, "base64");
    }

    if (isUrl(imageSource)) {
        const response = await fetch(imageSource);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    // Assume it's base64
    return Buffer.from(imageSource, "base64");
}

/**
 * Get MIME type from a URL or data URL
 */
export function getMimeType(source: string): string {
    if (isBase64DataUrl(source)) {
        const matches = source.match(/^data:([^;]+);/);
        return matches?.[1] || "image/jpeg";
    }

    const extension = source.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        m4a: "audio/mp4",
        pdf: "application/pdf",
    };

    return mimeTypes[extension || ""] || "application/octet-stream";
}
