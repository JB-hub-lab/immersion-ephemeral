// /api/ephemeral.js
export const config = { runtime: "edge" };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return new Response("Missing OPENAI_API_KEY", { status: 500, headers: corsHeaders() });
    }

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-realtime-preview-2024-12-17",
        // Keep replies short using instructions only (session-level)
        instructions: "Speak clearly and briefly: 1–2 short sentences per reply."
      }),
    });

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
