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
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500, headers: corsHeaders() });
    }

    // Parse request body to get user config from Replit
    let body = {};
    try { 
      body = await req.json(); 
    } catch (err) {
      return new Response("Invalid JSON body", { status: 400, headers: corsHeaders() });
    }

    // Extract parameters (sent from Replit via frontend)
    const instructions = body?.instructions || "You are an AI English tutor. Speak clearly and briefly.";
    const voice = body?.voice || "alloy";
    const speed = body?.speed || 0.9;  // CRITICAL: Default to 0.9 (slow)
    const turnDetection = body?.turnDetection || null;

    // Build session config for OpenAI
    const sessionConfig = {
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      instructions: instructions,
      voice: voice,
      output_audio_format: "pcm16",
      modalities: ["text", "audio"]
    };

    // Add speech speed (CRITICAL for slow AI voice)
    if (speed) {
      sessionConfig.speed = speed;
    }

    // Add turn detection if provided
    if (turnDetection) {
      sessionConfig.turn_detection = turnDetection;
    }

    console.log('[Ephemeral] Creating session with speed:', speed, 'voice:', voice);

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    return new Response(r.body, {
      status: r.status,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });

  } catch (err) {
    console.error('[Ephemeral] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
