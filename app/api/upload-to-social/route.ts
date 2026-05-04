import { NextRequest, NextResponse } from "next/server";
import {
    uploadReelToInstagram,
    findInstagramAccount,
    getAccessToken,
} from "@/lib/meta-api";

// ============================================
// POST /api/upload-to-social
// ============================================
// The access token is read from process.env.META_ACCESS_TOKEN.
// The client sends:
//   - username: the user's Instagram Business account (e.g. "@myaccount")
//   - caption:  optional caption for the Reel
//   - videoUrl: the URL of the video to upload
//
// For action "check":
//   - username: the IG username to verify
//   Returns whether the account is accessible via our token.

export async function POST(req: NextRequest) {
    try {
        const accessToken = getAccessToken();

        if (!accessToken) {
            return NextResponse.json(
                {
                    error: "Instagram is not configured. META_ACCESS_TOKEN is missing from the server environment.",
                },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { videoUrl, caption, username, action } = body;

        // ---------- Pre-flight: check if the IG account is accessible ----------
        if (action === "check") {
            if (!username) {
                return NextResponse.json(
                    { error: "Please provide your Instagram username." },
                    { status: 400 }
                );
            }

            const result = await findInstagramAccount(accessToken, username);

            if (result.found && result.account) {
                return NextResponse.json({
                    valid: true,
                    username: result.account.username,
                    igUserId: result.account.igUserId,
                });
            }

            return NextResponse.json({
                valid: false,
                error: result.error,
                availableAccounts: result.allAccounts?.map(
                    (a) => "@" + a.username
                ),
            });
        }

        // ---------- Reel upload ----------
        if (!videoUrl) {
            return NextResponse.json(
                { error: "videoUrl is required." },
                { status: 400 }
            );
        }

        if (!username) {
            return NextResponse.json(
                { error: "Instagram username is required." },
                { status: 400 }
            );
        }

        // Look up the user's IG account
        const lookup = await findInstagramAccount(accessToken, username);

        if (!lookup.found || !lookup.account) {
            return NextResponse.json(
                {
                    error: lookup.error || "Could not find the specified Instagram account.",
                },
                { status: 400 }
            );
        }

        console.log(
            `[upload-to-social] Uploading Reel to @${lookup.account.username}...`
        );

        const result = await uploadReelToInstagram(
            lookup.account.igUserId,
            accessToken,
            videoUrl,
            caption || ""
        );

        if (!result.success) {
            console.error("[upload-to-social] Upload failed:", result.error);
            return NextResponse.json(
                { error: result.error, errorCode: result.errorCode },
                { status: 400 }
            );
        }

        console.log(
            `[upload-to-social] Reel published! URL: ${result.postUrl}`
        );

        return NextResponse.json({
            success: true,
            mediaId: result.mediaId,
            postUrl: result.postUrl,
            username: lookup.account.username,
        });
    } catch (error: unknown) {
        console.error("[upload-to-social] Internal error:", error);
        const message =
            error instanceof Error
                ? error.message
                : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
