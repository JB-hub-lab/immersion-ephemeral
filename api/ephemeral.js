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
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

  const instructions =
    typeof body.instructions === "string" && body.instructions.trim().length > 0
      ? body.instructions
      : "You are Clara, a warm, encouraging AI language tutor. You ALWAYS speak ONLY in the target language selected by the student. Keep replies to 1–2 short sentences. Ask one question per turn.";
  const voice = typeof body.voice === "string" ? body.voice : "marin";
  const temperature = body.temperature ?? 0.7;

  const providedTurnDetection = body.turnDetection || body.turn_detection || null;
  const defaultTurnDetection = {
    type: "server_vad",
    threshold: 0.6,
    prefix_padding_ms: 300,
    silence_duration_ms: 350,
    create_response: true,
    interrupt_response: true,
  };

  const sessionConfig = {
    type: "realtime",
    model: typeof body.model === "string" ? body.model : "gpt-realtime-mini",
    instructions,
    voice,
    output_audio_format: "pcm16",
    modalities: ["text", "audio"],
    temperature,
    turn_detection: providedTurnDetection !== undefined ? providedTurnDetection : defaultTurnDetection,
  };

  try {
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session: sessionConfig }),
    });
    const text = await r.text();
    console.log("[OpenAI Realtime Response]", r.status, text);
    const headers = new Headers({
      "Content-Type": "application/json",
      ...CORS,
      "x-immersion-version": "v2026-05-20-ga",
    });
    return new Response(text, { status: r.status, headers });
  } catch (err) {
    console.error("[Ephemeral] Error:", err);
    return new Response(JSON.stringify({ error: "failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
