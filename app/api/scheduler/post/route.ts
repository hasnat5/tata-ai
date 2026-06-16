import { NextRequest, NextResponse } from "next/server";
import type { ScheduledPost } from "@/lib/scheduler-types";

export async function POST(request: NextRequest) {
  try {
    const post: ScheduledPost = await request.json();

    console.log(`📤 Posting to ${post.platform}:`, post.title);

    let result;
    switch (post.platform) {
      case "instagram":
        result = await postToInstagram(post);
        break;
      case "facebook":
        result = await postToFacebook(post);
        break;
      default:
        throw new Error(`Unknown platform: ${post.platform}`);
    }

    return NextResponse.json({
      success: true,
      message: `Posted to ${post.platform}`,
      result,
    });
  } catch (error) {
    console.error("❌ Posting failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// SOCIAL MEDIA API FUNCTIONS (Your wrapper)
// ============================================

async function postToInstagram(post: ScheduledPost) {
  // TODO: Use your Instagram API wrapper
  console.log("📷 Posting to Instagram:", post.description);
  return { platform: "instagram", posted: true };
}

async function postToFacebook(post: ScheduledPost) {
  // TODO: Use your Facebook API wrapper
  console.log("👥 Posting to Facebook:", post.description);
  return { platform: "facebook", posted: true };
}
