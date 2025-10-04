import crypto from 'crypto';

const TRAIT_KEYS = ['openness','conscientiousness','extraversion','agreeableness','neuroticism'];

function hashToFloat01(str) {
  const h = crypto.createHash('sha256').update(str).digest();
  const n = h.readUInt32BE(0);
  return (n % 1000) / 999.0;
}

export async function analyzeQuiz(answers) {
  const { interests = [], genres = [], values = [] } = answers || {};
  const base = (interests.concat(genres).concat(values)).join('|') || 'default';
  const traits = {};
  for (const k of TRAIT_KEYS) {
    traits[k] = 0.3 + 0.7 * hashToFloat01(base + ':' + k);
  }
  if (interests.includes('improv') || genres.includes('jazz')) {
    traits.extraversion = Math.min(1, traits.extraversion + 0.15);
    traits.openness = Math.min(1, traits.openness + 0.1);
  }
  if (genres.includes('classical')) {
    traits.conscientiousness = Math.min(1, traits.conscientiousness + 0.12);
  }
  const vector = [
    traits.openness, traits.conscientiousness, traits.extraversion,
    traits.agreeableness, traits.neuroticism,
    (genres.includes('edm') ? 1 : 0.2),
    (genres.includes('jazz') ? 1 : 0.2),
    (genres.includes('classical') ? 1 : 0.2),
    (interests.includes('museum') ? 1 : 0.3),
    (interests.includes('concerts') ? 1 : 0.3)
  ];

  const summary = `You lean ${traits.openness>0.6?'high':'balanced'} in openness, ` +
                  `${traits.extraversion>0.6?'outgoing':'more reflective'}, ` +
                  `and enjoy ${genres.slice(0,2).join(', ') || 'varied genres'}.`;

  return { traits, vector, summary };
}
