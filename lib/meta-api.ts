// ============================================
// META GRAPH API WRAPPER — INSTAGRAM REELS
// ============================================
// Wraps the Instagram Content Publishing API for uploading
// Reels to an Instagram Business/Creator account.
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing

const META_GRAPH_API_VERSION = "v22.0";
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

/**
 * How long to wait between status checks when polling for container readiness.
 */
const POLL_INTERVAL_MS = 5_000; // 5 seconds

/**
 * Maximum time to wait for a container to become ready before giving up.
 */
const MAX_POLL_DURATION_MS = 5 * 60 * 1_000; // 5 minutes

// ============================================
// TYPES
// ============================================

export type InstagramUploadResult = {
    success: true;
    mediaId: string;
    postUrl: string;
};

export type InstagramUploadError = {
    success: false;
    error: string;
    errorCode?: number;
    errorSubcode?: number;
};

export type InstagramUploadResponse =
    | InstagramUploadResult
    | InstagramUploadError;

type ContainerStatus =
    | "IN_PROGRESS"
    | "FINISHED"
    | "ERROR"
    | "EXPIRED"
    | "PUBLISHED";

// ============================================
// CORE UPLOAD FUNCTION
// ============================================

/**
 * Upload a video as an Instagram Reel using the Instagram Content Publishing API.
 *
 * The flow is:
 *   1. Create a media container  → POST /{ig-user-id}/media
 *   2. Poll until the container is FINISHED
 *   3. Publish the container     → POST /{ig-user-id}/media_publish
 *
 * The video must be publicly accessible (e.g. an UploadThing URL).
 *
 * @param igUserId     - The Instagram User ID (not username — numeric ID).
 * @param accessToken  - A User Access Token with `instagram_basic` and
 *                       `instagram_content_publish` permissions.
 * @param videoUrl     - A publicly accessible URL to the video file.
 * @param caption      - The caption for the Reel.
 * @returns            - A result object with the media ID and link, or an error.
 */
export async function uploadReelToInstagram(
    igUserId: string,
    accessToken: string,
    videoUrl: string,
    caption: string
): Promise<InstagramUploadResponse> {
    try {
        // ---- Step 1: Create the media container ----
        const containerRes = await fetch(
            `${META_GRAPH_BASE_URL}/${igUserId}/media`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    media_type: "REELS",
                    video_url: videoUrl,
                    caption: caption,
                    access_token: accessToken,
                }),
            }
        );

        const containerData = await containerRes.json();

        if (containerData.error) {
            console.error(
                "[Instagram API] Container creation failed:",
                containerData.error
            );
            return {
                success: false,
                error:
                    containerData.error.message ||
                    "Failed to create media container",
                errorCode: containerData.error.code,
                errorSubcode: containerData.error.error_subcode,
            };
        }

        const containerId = containerData.id;
        if (!containerId) {
            return {
                success: false,
                error: "No container ID returned from Instagram API.",
            };
        }

        console.log(
            `[Instagram API] Container created: ${containerId}. Polling for readiness...`
        );

        // ---- Step 2: Poll for container readiness ----
        const readyResult = await pollContainerStatus(
            containerId,
            accessToken
        );

        if (!readyResult.ready) {
            return {
                success: false,
                error: readyResult.error || "Container did not become ready.",
            };
        }

        console.log(
            `[Instagram API] Container ${containerId} is FINISHED. Publishing...`
        );

        // ---- Step 3: Publish the container ----
        const publishRes = await fetch(
            `${META_GRAPH_BASE_URL}/${igUserId}/media_publish`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    creation_id: containerId,
                    access_token: accessToken,
                }),
            }
        );

        const publishData = await publishRes.json();

        if (publishData.error) {
            console.error(
                "[Instagram API] Publish failed:",
                publishData.error
            );
            return {
                success: false,
                error:
                    publishData.error.message || "Failed to publish the Reel",
                errorCode: publishData.error.code,
                errorSubcode: publishData.error.error_subcode,
            };
        }

        const mediaId = publishData.id;
        if (!mediaId) {
            return {
                success: false,
                error: "No media ID returned after publishing.",
            };
        }

        // Construct a permalink — we'll also try to fetch the real one
        let postUrl = `https://www.instagram.com/reel/${mediaId}/`;

        // Try to get the actual permalink from the API
        try {
            const permalinkRes = await fetch(
                `${META_GRAPH_BASE_URL}/${mediaId}?fields=permalink&access_token=${accessToken}`
            );
            const permalinkData = await permalinkRes.json();
            if (permalinkData.permalink) {
                postUrl = permalinkData.permalink;
            }
        } catch {
            // Fallback to constructed URL — not critical
        }

        console.log(
            `[Instagram API] Reel published successfully! Media ID: ${mediaId}`
        );

        return {
            success: true,
            mediaId: mediaId,
            postUrl: postUrl,
        };
    } catch (err: unknown) {
        const message =
            err instanceof Error
                ? err.message
                : "Network error during upload";
        console.error("[Instagram API] Exception:", message);
        return {
            success: false,
            error: message,
        };
    }
}

// ============================================
// CONTAINER STATUS POLLING
// ============================================

async function pollContainerStatus(
    containerId: string,
    accessToken: string
): Promise<{ ready: boolean; error?: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLL_DURATION_MS) {
        await sleep(POLL_INTERVAL_MS);

        try {
            const res = await fetch(
                `${META_GRAPH_BASE_URL}/${containerId}?fields=status_code,status&access_token=${accessToken}`
            );
            const data = await res.json();

            if (data.error) {
                return {
                    ready: false,
                    error:
                        data.error.message ||
                        "Error checking container status.",
                };
            }

            const status: ContainerStatus = data.status_code;

            switch (status) {
                case "FINISHED":
                    return { ready: true };
                case "ERROR":
                    return {
                        ready: false,
                        error: `Container processing failed: ${data.status || "Unknown error"}`,
                    };
                case "EXPIRED":
                    return {
                        ready: false,
                        error: "Container expired before publishing.",
                    };
                case "IN_PROGRESS":
                    console.log(
                        `[Instagram API] Container ${containerId} still processing...`
                    );
                    break;
                default:
                    console.log(
                        `[Instagram API] Container status: ${status}`
                    );
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Network error";
            console.error(
                "[Instagram API] Error polling container status:",
                message
            );
            // Continue polling — transient network errors shouldn't abort
        }
    }

    return {
        ready: false,
        error: "Timed out waiting for video processing (5 min). The video may still be processing — try again later.",
    };
}

// ============================================
// INSTAGRAM ACCOUNT DISCOVERY
// ============================================

export type InstagramAccountInfo = {
    igUserId: string;
    username: string;
    pageName: string;
};

/**
 * List all Instagram Business/Creator accounts accessible via this token.
 * The token can manage multiple Facebook Pages, each potentially linked
 * to a different Instagram account.
 */
export async function listInstagramAccounts(
    accessToken: string
): Promise<{ accounts: InstagramAccountInfo[]; error?: string }> {
    try {
        const pagesRes = await fetch(
            `${META_GRAPH_BASE_URL}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`
        );

        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            return {
                accounts: [],
                error: pagesData.error.message || "Invalid token",
            };
        }

        const pages = pagesData.data || [];
        const accounts: InstagramAccountInfo[] = [];

        for (const page of pages) {
            if (page.instagram_business_account) {
                accounts.push({
                    igUserId: page.instagram_business_account.id,
                    username:
                        page.instagram_business_account.username || "",
                    pageName: page.name,
                });
            }
        }

        return { accounts };
    } catch (err: unknown) {
        const message =
            err instanceof Error
                ? err.message
                : "Network error during account discovery";
        return { accounts: [], error: message };
    }
}

/**
 * Find a specific Instagram Business account by username.
 * The username can be provided with or without the @ prefix.
 *
 * If only one account is accessible and no username is given,
 * that account is returned as the default.
 */
export async function findInstagramAccount(
    accessToken: string,
    username?: string
): Promise<{
    found: boolean;
    account?: InstagramAccountInfo;
    allAccounts?: InstagramAccountInfo[];
    error?: string;
}> {
    const { accounts, error } = await listInstagramAccounts(accessToken);

    if (error) {
        return { found: false, error };
    }

    if (accounts.length === 0) {
        return {
            found: false,
            error: "No Instagram Business/Creator accounts found linked to the configured token.",
        };
    }

    // If no username specified and there's exactly one account, use it
    if (!username && accounts.length === 1) {
        return { found: true, account: accounts[0] };
    }

    // If no username specified and there are multiple, return them all
    if (!username) {
        return {
            found: false,
            allAccounts: accounts,
            error: "Multiple Instagram accounts found. Please specify which account to use.",
        };
    }

    // Normalize the username (strip @, lowercase)
    const normalized = username.replace(/^@/, "").toLowerCase();

    const match = accounts.find(
        (a) => a.username.toLowerCase() === normalized
    );

    if (match) {
        return { found: true, account: match };
    }

    return {
        found: false,
        allAccounts: accounts,
        error: `Instagram account "@${normalized}" was not found. Available accounts: ${accounts.map((a) => "@" + a.username).join(", ")}`,
    };
}

// ============================================
// ACCESS TOKEN HELPER
// ============================================

/**
 * Read the Meta access token from the environment.
 * This is the token set by the app owner in .env.local.
 */
export function getAccessToken(): string | null {
    return process.env.META_ACCESS_TOKEN || null;
}

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

