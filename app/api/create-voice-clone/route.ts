import { NextRequest, NextResponse } from "next/server";

// ElevenLabs built-in preset voice. Available on all plans (including Free),
// so this works without the `create_instant_voice_clone` permission.
// Rachel: calm, female, American. Swap to any valid voice ID from
// https://elevenlabs.io/app/voice-library if you prefer a different default.
const DEFAULT_PRESET_VOICE_ID = "kPzsL2i3teMYv0FxEYQ6";

// ============================================
// REQUEST TYPE
// ============================================

type CreateVoiceCloneRequest = {
  characterId: string;
  characterName: string;
  voiceSampleUrl: string;
};

// ============================================
// MAIN ENDPOINT
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateVoiceCloneRequest = await request.json();
    const { characterId, characterName, voiceSampleUrl } = body;

    if (!voiceSampleUrl) {
      return NextResponse.json(
        { error: "Voice sample is required" },
        { status: 400 },
      );
    }

    console.log("=== VOICE ASSIGNMENT (preset) ===");
    console.log("Character:", characterName);
    console.log(
      "IVC unavailable on this plan; assigning preset voice:",
      DEFAULT_PRESET_VOICE_ID,
    );
    console.log(
      "Voice sample kept on character for future upgrade:",
      voiceSampleUrl,
    );

    return NextResponse.json({
      characterId,
      voiceCloneId: DEFAULT_PRESET_VOICE_ID,
    });
  } catch (error) {
    console.error("Error assigning preset voice:", error);
    return NextResponse.json(
      { error: "Failed to assign voice" },
      { status: 500 },
    );
  }
}
