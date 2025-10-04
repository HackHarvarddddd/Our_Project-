import crypto from 'crypto';

// ===== Personality & Feature Vectorization =====

// Fixed order for trait keys to produce stable vectors
const TRAIT_KEYS = ['openness','conscientiousness','extraversion','agreeableness','neuroticism'];

// Hash helpers
function sha256Hex(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}
function hashToFloat01(str) {
  // Convert the first 8 bytes of SHA256 to a number in [0,1)
  const h = crypto.createHash('sha256').update(String(str)).digest();
  const n = h.readUInt32BE(0) ^ h.readUInt32BE(4);
  return (n >>> 0) / 0xffffffff;
}
function hashToIndex(str, dim) {
  const h = crypto.createHash('sha256').update(String(str)).digest();
  // xor a few bytes to spread entropy
  const idx = (h[0] ^ h[5] ^ h[10] ^ h[15] ^ h[20] ^ h[25] ^ h[31]) % dim;
  return idx < 0 ? (idx + dim) : idx;
}

// Build a fixed-size hashed feature vector from quiz answers
function buildHashedFeatureVector(answers = {}, DIM = 64) {
  const v = new Array(DIM).fill(0);

  const push = (prefix, value) => {
    if (value == null) return;
    const token = `${prefix}:${String(value).toLowerCase().trim()}`;
    const j = hashToIndex(token, DIM);
    v[j] += 1;
  };

  // Categorical arrays
  for (const s of (answers.interests || [])) push('interest', s);
  for (const s of (answers.genres || [])) push('genre', s);
  for (const s of (answers.values || [])) push('value', s);
  for (const s of (answers.availability || [])) push('slot', s);

  // Location (tokenize simple words)
  if (answers.location) {
    String(answers.location).split(/\W+/).filter(Boolean).forEach(w => push('loc', w));
  }

  // Free-form Q/A responses — include both the answer and a coarse question id so
  // two users selecting the same answer for different questions do not collide as much.
  if (Array.isArray(answers.responses)) {
    answers.responses.forEach((r, i) => {
      if (r && r.answer) push(`resp${i}`, r.answer);
      if (r && r.question) push(`q${i}`, String(r.question).slice(0,32)); // coarse question id
    });
  }

  // L2 normalize the hashed part so its scale is invariant to the number of checked boxes
  const norm = Math.sqrt(v.reduce((s,x)=>s + x*x, 0)) || 1;
  for (let i=0;i<v.length;i++) v[i] = v[i] / norm;

  return v;
}

// Combine Big Five traits with hashed features into one vector
function combineVector(traits, answers) {
  const traitVec = TRAIT_KEYS.map(k => {
    const x = Number(traits?.[k]);
    return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0.5;
  });
  const hashed = buildHashedFeatureVector(answers, 64);
  return traitVec.concat(hashed); // length = 5 + 64 = 69
}

// ===== Fallback deterministic profiling (no API required) =====
function fallbackProfile(answers = {}) {
  const seed = JSON.stringify(answers);
  const traits = {};
  for (const k of TRAIT_KEYS) {
    traits[k] = hashToFloat01(seed + '|' + k); // stable in [0,1)
  }

  // Lightly stretch away from 0.5 to avoid everyone clustering
  for (const k of TRAIT_KEYS) {
    const x = traits[k];
    traits[k] = 0.5 + (x - 0.5) * 1.35; // expand around the center
    traits[k] = Math.max(0, Math.min(1, traits[k]));
  }

  // Distinctive, deterministic summary style (avoid generic phrases)
  const styles = [
    'painterly', 'minimalist', 'surreal', 'documentary', 'lyrical',
    'geometric', 'nocturne', 'collage', 'kinetic', 'monochrome'
  ];
  const styleId = Math.floor(hashToFloat01(seed + '|style') * styles.length);
  const style = styles[styleId];
  const pick = (arr) => arr[Math.floor(hashToFloat01(seed + '|' + arr.join(',')) * arr.length)];

  const interest = (answers.interests && answers.interests[0]) || pick(['photography','installation','poetry','ceramics']);
  const genre = (answers.genres && answers.genres[0]) || pick(['indie','classical','EDM','jazz']);

  const summary = `A ${style} lean: drawn to ${interest} with ${genre} undertones; prefers ${traits.extraversion>0.6?'collaborations':'quiet studios'}, balances craft and play.`;

  return {
    traits,
    vector: combineVector(traits, answers),
    summary,
    source: 'fallback'
  };
}

// ===== OpenAI-backed profiling =====
async function callOpenAIForProfile(answers = {}) {
  const userPayload = {
    interests: answers.interests || [],
    genres: answers.genres || [],
    values: answers.values || [],
    availability: answers.availability || [],
    location: answers.location || '',
    responses: answers.responses || [],
  };

  // Deterministic micro-style to keep summaries varied without randomness
  const styleSeed = sha256Hex(JSON.stringify(userPayload)).slice(0, 8);
  const microStyles = [
    'painterly', 'brutalist', 'documentary', 'lyrical', 'kinetic',
    'nocturne', 'collage', 'geometric', 'organic', 'neon'
  ];
  const styleIdx = parseInt(styleSeed, 16) % microStyles.length;
  const microStyle = microStyles[styleIdx];

  // Ask for JSON only and explicitly forbid cliché phrasing
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.4, // still grounded but less templated
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a precise personality profiler for an arts-matchmaking app.\n' +
          'Given a short quiz (interests, music genres, values, availability, location, and specific Q/A responses),\n' +
          'return 5 Big Five trait scores in [0,1] and a 1–2 sentence artistic description.\n' +
          `Write the description in a "${microStyle}" micro-style.\n` +
          'Requirements:\n' +
          '- Use at least 3 concrete details pulled from the user data (quote one literal choice).\n' +
          '- Avoid generic phrases like "blend of creativity and curiosity", "passionate about", "loves exploring", "seeks to", "driven by".\n' +
          '- Keep to 35–55 words, no bullet points.\n' +
          'Return JSON ONLY.'
      },
      {
        role: 'user',
        content:
          'Quiz responses:\n' +
          JSON.stringify(userPayload, null, 2) +
          '\n\nReturn JSON with this exact shape:\n' +
          JSON.stringify(
            {
              traits: Object.fromEntries(TRAIT_KEYS.map(k => [k, 0.5])),
              summary: 'string'
            },
            null,
            2
          )
      }
    ]
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set; using fallback profile.');
    return fallbackProfile(answers);
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errTxt = await resp.text().catch(()=>String(resp.status));
    console.error('OpenAI error:', resp.status, errTxt);
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
    console.error('OpenAI JSON parse failed:', e, 'content:', content?.slice?.(0,200));
    return fallbackProfile(answers);
  }

  // Validate and clamp trait values
  const traits = {};
  for (const k of TRAIT_KEYS) {
    const v = Number(parsed?.traits?.[k]);
    traits[k] = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;
  }

  // Build combined vector with hashed features to increase dispersion
  const vector = combineVector(traits, answers);

  // Description: trim, enforce one-line, and fall back if empty
  let summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';
  summary = summary.replace(/\s+/g, ' ').slice(0, 320);
  if (!summary) summary = 'Distinct profile across interests and process; see traits.';

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
