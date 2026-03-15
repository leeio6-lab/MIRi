// Supabase Edge Function: Face Reading Analysis
// Uses GPT-4o mini Vision for physiognomy analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const FACE_SYSTEM = `You are an expert in physiognomy (face reading).
CRITICAL RULES:
1) Entertainment only.
2) NEVER negative about appearance — all observations must be POSITIVE or NEUTRAL.
3) Valid JSON only.
4) Respond in requested locale.
5) If the image does NOT contain a clearly visible front-facing human face, return ONLY: {"noFace": true, "reason": "<brief reason in requested locale>"}
6) The face must be front-facing or near-front-facing for accurate reading. Side profiles or obscured faces should return noFace.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, locale = 'ko', isPaid = false } = await req.json();

    const userPrompt = isPaid
      ? `Analyze this face comprehensively. If no clear front-facing face is visible, return {"noFace": true, "reason": "..."}. Otherwise include overallScore (60-100), summary, features array (forehead/eyes/nose/mouth/jawline/ears with score and detail), personality, fortune, advice. Locale: ${locale}. JSON format.`
      : `Brief face reading. If no clear front-facing face is visible, return {"noFace": true, "reason": "..."}. Otherwise include overallScore (60-100), summary, features array (forehead/eyes/nose/mouth/jawline/ears with score and description). Locale: ${locale}. JSON format.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: FACE_SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: isPaid ? 2000 : 800,
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Face analysis failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
