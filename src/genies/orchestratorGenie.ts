import { callJsonModel } from "./openaiClient";
import { ORCHESTRATOR_PROMPT } from "./prompts";
import { callLeadMagnetGenie } from "./leadMagnetGenie";
import { callOfferGenie } from "./offerGenie";
import { callFunnelGenie } from "./funnelGenie";
import { callPostGenie } from "./postGenie";

type GenieAction = {
  type?: string;
  payload?: Record<string, any>;
};

type OrchestratorResult = {
  assistant_message_for_user?: string;
  actions?: GenieAction[];
  state_update?: Record<string, any>;
  [key: string]: any;
};

/**
 * Call the Orchestrator Genie.
 *
 * @param userMessage - Raw user text from the human.
 * @param state - Previous state object
 */
export async function callOrchestrator(userMessage: string, state: any = {}) {
  const userPayload = {
    user_message: userMessage,
    previous_state: state,
  };

  // Pass the constant string (ORCHESTRATOR_PROMPT) to the model
  const result = await callJsonModel({
    system: ORCHESTRATOR_PROMPT,
    user: userPayload,
  });

  return result;
}

/**
 * Execute the actions selected by the Orchestrator and preserve the structured
 * outputs for the next turn. The model decides what to run; this server-side
 * runner is responsible for actually calling each Genie.
 */
export async function executeOrchestratorActions(
  orchestration: OrchestratorResult,
  initialState: Record<string, any> = {},
  options: { runFullPipeline?: boolean } = {}
): Promise<OrchestratorResult & Record<string, any>> {
  const state: Record<string, any> = {
    ...initialState,
    ...(orchestration.state_update || {}),
  };
  const results: Record<string, any> = {};
  const actions = Array.isArray(orchestration.actions)
    ? orchestration.actions.filter(action => action && typeof action === "object")
    : [];

  for (const action of actions) {
    await executeAction(action, state, results);
  }

  // The web form asks for the complete system in one submission. The
  // Orchestrator prompt may correctly emit only the first action (lead magnet),
  // so continue the dependent chain after that first result is available.
  const requestedLeadMagnet = actions.some(
    action => action.type === "CALL_LEAD_MAGNET_GENIE"
  );
  if (
    options.runFullPipeline &&
    requestedLeadMagnet &&
    state.lead_magnet_json &&
    !state.offer_json
  ) {
    await executeAction({ type: "CALL_OFFER_GENIE" }, state, results);
    await executeAction({ type: "CALL_FUNNEL_GENIE" }, state, results);
    await executeAction({ type: "CALL_POST_GENIE" }, state, results);
  }

  return {
    ...orchestration,
    ...results,
    state,
  };
}

async function executeAction(
  action: GenieAction,
  state: Record<string, any>,
  results: Record<string, any>
) {
  switch (action.type) {
    case "CALL_LEAD_MAGNET_GENIE": {
      const payload = {
        ...(action.payload || {}),
      };
      const result = await callLeadMagnetGenie(payload);
      state.lead_magnet_json = result.lead_magnet_json;
      state.lead_magnet_document_markdown = result.lead_magnet_document_markdown;
      results.lead_magnet = toLeadMagnet(result);
      return;
    }

    case "CALL_OFFER_GENIE": {
      const payload = {
        ...(action.payload || {}),
        lead_magnet: state.lead_magnet_json || action.payload?.lead_magnet,
      };
      const result = await callOfferGenie(payload);
      state.offer_json = result.offer_json;
      results.offer = toOffer(result.offer_json);
      return;
    }

    case "CALL_FUNNEL_GENIE": {
      const payload = {
        ...(action.payload || {}),
        lead_magnet: state.lead_magnet_json || action.payload?.lead_magnet,
        offer: state.offer_json || action.payload?.offer,
        ghl: {
          ...(action.payload?.ghl || {}),
          ...(state.ghl || {}),
        },
      };
      const result = await callFunnelGenie(payload);
      state.funnel = result.funnel;
      state.workflow_build_guide = result.workflow_build_guide;
      results.funnel = toFunnel(result.funnel);
      results.workflow_build_guide = toWorkflowGuide(result.workflow_build_guide);
      return;
    }

    case "CALL_POST_GENIE": {
      const payload = {
        ...(action.payload || {}),
        offer: state.offer_json || action.payload?.offer,
        lead_magnet: state.lead_magnet_json || action.payload?.lead_magnet || null,
        platforms:
          state.platforms || action.payload?.platforms || ["facebook", "instagram", "linkedin"],
      };
      const locationId = state.ghl?.location_id || "";
      const result = await callPostGenie(payload, locationId);
      state.campaign = result.campaign;
      results.posts = toPosts(result.campaign);
      return;
    }

    default:
      return;
  }
}

export function toLeadMagnet(result: any) {
  const lead = result?.lead_magnet_json?.lead_magnet || {};
  return {
    title: lead.title || "Lead Magnet",
    subtitle: lead.subtitle || lead.promise || "",
    target_audience: lead.client?.audience || lead.audience || "",
    problem: lead.problem || "",
    solution: lead.promise || lead.intended_outcome || "",
    sections: Array.isArray(lead.sections)
      ? lead.sections.map((section: any) => ({
          heading: section.title || section.heading || "",
          content: section.summary || (section.bullets || []).join("\n"),
        }))
      : [],
    slug: lead.slug || "",
    markdown: result?.lead_magnet_document_markdown || "",
  };
}

function toOffer(offer: any) {
  return {
    big_idea: offer?.big_idea || offer?.name || "",
    hook: offer?.hook || offer?.headline || "",
    core_offer: offer?.core_offer || offer?.description || "",
    value_stack: Array.isArray(offer?.value_stack) ? offer.value_stack : [],
    bonuses: Array.isArray(offer?.bonuses) ? offer.bonuses : [],
    guarantee: offer?.guarantee || "",
    cta: offer?.cta || "",
    slug: offer?.slug || "",
  };
}

export function toFunnel(funnel: any) {
  return {
    funnel_name: funnel?.funnel_name || funnel?.name || "",
    slug: funnel?.slug || "",
    pages: Array.isArray(funnel?.pages) ? funnel.pages : [],
    event: funnel?.event || {},
  };
}

function toWorkflowGuide(guide: any) {
  return {
    title: guide?.title || "Workflow Build Guide",
    summary: guide?.summary || "",
    ghl_area: guide?.ghl_area || "",
    estimated_time_minutes: guide?.estimated_time_minutes || 0,
    steps: Array.isArray(guide?.steps) ? guide.steps : [],
    full_markdown: guide?.full_markdown || "",
  };
}

function toPosts(campaign: any) {
  if (!Array.isArray(campaign?.platforms)) return [];
  return campaign.platforms.flatMap((platform: any) =>
    (Array.isArray(platform.posts) ? platform.posts : []).map((post: any) => ({
      platform: platform.platform || "",
      primary_post: post.primary_text || post.primary_post || "",
      comments: Array.isArray(post.comments) ? post.comments : [],
      image_prompt: post.image_prompt || "",
    }))
  );
}
