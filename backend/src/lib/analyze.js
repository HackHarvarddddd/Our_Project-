import crypto from 'crypto';

// Order matters; keep this stable across users/runs.
const TRAIT_KEYS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

// --- Fallback deterministic profiling (keeps your old behavior) ---
function hashToFloat01(str) {
  const h = crypto.createHash('sha256').update(str).digest();
  const n = h.readUInt32BE(0);
  return (n % 1000) / 999.0;
}

function fallbackProfile(answers) {
  const { interests = [], genres = [], values = [] } = answers || {};
  const base = (interests.concat(genres).concat(values)).join('|') || 'default';
  const traits = {};
  for (const k of TRAIT_KEYS) {
    traits[k] = 0.3 + 0.7 * hashToFloat01(base + ':' + k);
  }
  const vector = [
    traits.openness,
    traits.conscientiousness,
    traits.extraversion,
    traits.agreeableness,
    traits.neuroticism,
  ];
  const summary =
    `You lean ${traits.openness > 0.6 ? 'high' : 'balanced'} in openness, ` +
    `${traits.extraversion > 0.6 ? 'more outgoing' : 'more reflective'}, ` +
    `and show eclectic tastes across interests and genres.`;
  return { traits, vector, summary, source: 'fallback' };
}

// --- OpenAI call for JSON personality profile ---
async function callOpenAIForProfile(answers) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key → deterministic fallback
    return fallbackProfile(answers);
  }

  // Keep the prompt grounded in the actual quiz structure.
  const { interests = [], genres = [], values = [], availability = [], location = '' } = answers || {};
  const userPayload = {
    interests,
    genres,
    values,
    availability,
    location,
  };

  // We request strict JSON with the exact schema we need.
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a concise personality profiler for an arts-matchmaking platform. ' +
          'Given a short quiz (interests, music genres, values, availability, location), ' +
          'return Big Five trait scores in [0,1] and a 1–2 sentence summary. ' +
          'Reply as pure JSON only.',
      },
      {
        role: 'user',
        content:
          'Quiz responses:\n' +
          JSON.stringify(userPayload, null, 2) +
          '\n\nReturn JSON with this shape exactly:\n' +
          JSON.stringify(
            {
              traits: {
                openness: 0.0,
                conscientiousness: 0.0,
                extraversion: 0.0,
                agreeableness: 0.0,
                neuroticism: 0.0,
              },
              summary:
                'Short, friendly, specific summary tying interests/genres/values to collaboration style.',
            },
            null,
            2
          ),
      },
    ],
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    // API error → deterministic fallback (still usable end-to-end)
    const txt = await resp.text().catch(() => '');
    console.error('OpenAI error:', resp.status, txt);
    return fallbackProfile(answers);
  }

  const data = await resp.json();
  const content =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.message?.content?.[0]?.text ||
    '';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Bad/partial JSON → fallback
    console.error('OpenAI JSON parse failed:', e);
    return fallbackProfile(answers);
  }

  // Validate and clamp values, then build a stable vector.
  const traits = {};
  for (const k of TRAIT_KEYS) {
    const v = Number(parsed?.traits?.[k]);
    traits[k] = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;
  }
  const vector = TRAIT_KEYS.map((k) => traits[k]);
  const summary =
    typeof parsed?.summary === 'string' && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : 'Balanced profile with diverse interests.';

  return { traits, vector, summary, source: 'openai' };
}

/**
 * Analyze a user's quiz results into a personality profile.
 * Returns: { traits: Record<string,number>, vector: number[], summary: string, source: 'openai'|'fallback' }
 */
export async function analyzeQuiz(answers) {
  try {
    return await callOpenAIForProfile(answers);
  } catch (e) {
    console.error('analyzeQuiz unexpected error:', e);
    return fallbackProfile(answers);
  }
}
