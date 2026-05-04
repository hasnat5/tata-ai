import { NextRequest, NextResponse } from "next/server";

// ============================================
// META WEBHOOKS HANDLER
// ============================================
// Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started

export async function GET(req: NextRequest) {
    // Parse the query params
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (
            mode === "subscribe" &&
            token === process.env.META_WEBHOOK_VERIFY_TOKEN
        ) {
            // Respond with the challenge token from the request
            console.log("[Meta Webhook] WEBHOOK_VERIFIED");
            return new NextResponse(challenge, { status: 200 });
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            console.error("[Meta Webhook] Verification failed. Tokens do not match.");
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check the Webhook event is from a Page subscription
        if (body.object === "page" || body.object === "instagram") {
            // Iterate over each entry - there may be multiple if batched
            body.entry?.forEach((entry: any) => {
                // Gets the body of the webhook event
                const webhook_event = entry.messaging?.[0] || entry.changes?.[0];
                console.log("[Meta Webhook] Event received:", JSON.stringify(webhook_event, null, 2));

                // TODO: Handle specific events here if needed (like comment replies, message receives, etc)
            });

            // Return a '200 OK' response to all requests
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
        } else {
            // Return a '404 Not Found' if event is not from a page subscription
            return new NextResponse("Not Found", { status: 404 });
        }
    } catch (error) {
        console.error("[Meta Webhook] Error processing event:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
