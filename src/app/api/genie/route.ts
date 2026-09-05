// src/app/api/genie/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  callOrchestrator,
  executeOrchestratorActions,
  toFunnel,
  toLeadMagnet,
} from "@/genies/orchestratorGenie";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, locationId, state } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const previousState = state || {};
    if (locationId) {
      previousState.ghl = {
        ...previousState.ghl,
        location_id: locationId,
      };
    }

    // Ask the Orchestrator which Genies are needed, then execute them.
    const response = await callOrchestrator(message, previousState);
    const executed = await executeOrchestratorActions(response, previousState, {
      runFullPipeline: body.runFullPipeline !== false,
    });

    return NextResponse.json({
      lead_magnet: executed.lead_magnet || toLeadMagnet({}),
      offer: executed.offer || {
        big_idea: "",
        hook: "",
        core_offer: "",
        value_stack: [],
        bonuses: [],
        guarantee: "",
        cta: "",
        slug: "",
      },
      funnel: executed.funnel || toFunnel({}),
      workflow_build_guide: executed.workflow_build_guide || {
        title: "",
        summary: "",
        ghl_area: "",
        estimated_time_minutes: 0,
        steps: [],
        full_markdown: "",
      },
      posts: executed.posts || [],
      assistant_message_for_user: executed.assistant_message_for_user || "",
      state: executed.state,
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
