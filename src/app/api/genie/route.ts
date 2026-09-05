// src/app/api/genie/route.ts
import { NextRequest, NextResponse } from "next/server";
// Import the REAL Orchestrator logic we just built
import { callOrchestrator } from "@/genies/orchestratorGenie";

export const maxDuration = 60; // Allow 60 seconds for GPT-4 to think (Vercel specific)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Extract inputs
    const { message, locationId, state } = body;

    // 2. Validate
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 3. Prepare State
    // We inject the locationId into the state so the Orchestrator passes it to the Post Genie
    const previousState = state || {};
    
    // Ensure GHL context is available
    if (locationId) {
      previousState.ghl = { 
        ...previousState.ghl, 
        location_id: locationId 
      };
    }

    console.log("🤖 Orchestrator received:", message);
    console.log("📍 Location ID:", locationId);

    // 4. Call the Genie (The Brain)
    const response = await callOrchestrator(message, previousState);

    // 5. Return the result to the Frontend
    return NextResponse.json(response);

  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
