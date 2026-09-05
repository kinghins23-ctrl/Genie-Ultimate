// src/app/api/genie/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callOrchestrator } from "@/genies/orchestratorGenie";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      businessName,
      niche,
      targetAudience,
      leadMagnetType,
      platforms,
      locationId,
      state,
    } = body;

    const userMessage = message || [
      businessName && `Business name: ${businessName}`,
      niche && `Niche / industry: ${niche}`,
      targetAudience && `Target audience: ${targetAudience}`,
      leadMagnetType && `Lead magnet type: ${leadMagnetType}`,
      Array.isArray(platforms) && `Platforms: ${platforms.join(", ")}`,
    ].filter(Boolean).join("\n");

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const previousState = state || {};
    if (locationId) {
      previousState.ghl = { ...previousState.ghl, location_id: locationId };
    }

    console.log("🤖 Orchestrator received:", userMessage);
    console.log("📍 Location ID:", locationId);

    const response = await callOrchestrator(userMessage, previousState);
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
