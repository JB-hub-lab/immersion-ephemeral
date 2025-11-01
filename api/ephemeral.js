// /api/ephemeral.js
export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return new Response("Missing OPENAI_API_KEY", { status: 500, headers: CORS });
  }

  // Accept empty body; fall back to calm, CEFR-friendly defaults if needed
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

  // Full instruction string from Replit is best; otherwise use a calm fallback
  const instructions =
    body.instructions ||
    "You are a patient English tutor. SPEAK SLOWLY and CLEARLY. Keep replies to 1–2 sentences. Pause briefly between sentences (~300 ms). Adapt difficulty to the student's CEFR level. Encourage, correct gently, and avoid long monologues.";

  const voice = body.voice || "alloy";
  const speed = (typeof body.speed === "number") ? body.speed : 0.9;     // calmer than default
  const temperature = (typeof body.temperature === "number") ? body.temperature : 0.7;

  // Accept BOTH camelCase and snake_case from the client
  const providedTurnDetection = body.turnDetection || body.turn_detection || null;

  // Gentle defaults to prevent abrupt cut-ins if client forgets to send settings
  const defaultTurnDetection = {
    type: "server_vad",
    threshold: 0.6,            // slightly stricter than 0.5 to reduce false starts
    prefix_padding_ms: 300,
    silence_duration_ms: 350,  // waits a bit longer before responding
    create_response: true,
    interrupt_response: true,  // set to false if you never want the AI to cut in
  };

  const sessionConfig = {
    model: "gpt-4o-mini-realtime-preview-2024-12-17",
    instructions,
    voice,
    output_audio_format: "pcm16",
    modalities: ["text", "audio"],
    temperature,
    speed,
    turn_detection: providedTurnDetection || defaultTurnDetection,
  };

  try {
    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    // Add a small version header so you can confirm you’re on the new code
    const headers = new Headers({ "Content-Type": "application/json", ...CORS, "x-immersion-version": "v2025-11-01" });

    return new Response(r.body, { status: r.status, headers });
  } catch (err) {
    console.error("[Ephemeral] Error:", err);
    return new Response(JSON.stringify({ error: "failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
