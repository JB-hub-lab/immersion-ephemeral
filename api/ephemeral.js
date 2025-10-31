// api/ephemeral.js
// This is a Vercel "Edge Function". It creates short-lived Realtime sessions.
// Your browser will call this URL to get the session ticket.
// It scales automatically and handles 100+ students starting at once.

export const config = { runtime: "edge" };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",          // allow your Replit site
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default async function handler(req) {
  // Handle browser "preflight" checks
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return new Response("Missing OPENAI_API_KEY", { status: 500, headers: corsHeaders() });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const userId = body?.userId || null;

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        // Keep answers brief & fast (1–2 short sentences)
        max_output_tokens: 90,
        instructions: "Speak clearly and briefly: 1–2 short sentences per reply.",
      }),
    });

    // Pass through the JSON body from OpenAI
    return new Response(r.body, {
      status: r.status,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}

