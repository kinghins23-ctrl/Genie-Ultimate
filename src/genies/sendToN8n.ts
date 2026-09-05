/**
 * Send funnel JSON to n8n webhook.
 * @param funnelResult - The full object from Funnel Genie.
 */
export async function sendFunnelToN8n(funnelResult: any) {
  const url = process.env.N8N_WEBHOOK_URL;

  if (!url) {
    console.error("N8N_WEBHOOK_URL is not set in .env");
    return;
  }

  try {
    console.log(
      "[sendFunnelToN8n] Sending funnel payload to n8n. Keys:",
      Object.keys(funnelResult)
    );

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(funnelResult),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`n8n webhook error: HTTP ${res.status} – ${text}`);
    }

    console.log("✅ Successfully sent funnel JSON to n8n.");
  } catch (err) {
    console.error("❌ Failed to send funnel to n8n:", err);
    // Don't throw, just log, so the UI doesn't crash if automation fails
  }
}

/**
 * Send Post Campaign JSON to n8n for Image Gen & Scheduling.
 * @param campaignResult - The full output from Post Genie.
 * @param locationId - The GHL Location ID.
 */
export async function sendPostToN8n(campaignResult: any, locationId: string) {
  const url = process.env.N8N_POST_WEBHOOK_URL;

  if (!url) {
    console.error("N8N_POST_WEBHOOK_URL is missing in .env");
    return;
  }

  const payload = {
    location_id: locationId,
    campaign: campaignResult.campaign // The nested campaign object
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`n8n Post Genie error: ${res.status} - ${text}`);
    }

    console.log("✅ Successfully dispatched Post Campaign to n8n.");
  } catch (err) {
    console.error("❌ Failed to send to n8n:", err);
  }
}
