const OpenAI = require('openai');

let client = null;
const getClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-xxxx')) {
    return null; // no valid key configured
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
};

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const CATEGORIES = [
  'Infrastructure',
  'Hostel',
  'Transport',
  'Wi-Fi/IT',
  'Sanitation',
  'Ragging/Safety',
  'Academic',
  'Canteen',
  'Other',
];

/**
 * Fallback keyword-based logic used if no OpenAI key is configured,
 * or if the API call fails. This keeps the app fully demoable even
 * offline / without billing set up.
 */
function fallbackAnalyze(text) {
  const lower = text.toLowerCase();
  let category = 'Other';
  if (/(wifi|wi-fi|internet|network|router|lan)/.test(lower)) category = 'Wi-Fi/IT';
  else if (/(hostel|room|warden|mess)/.test(lower)) category = 'Hostel';
  else if (/(bus|transport|shuttle|driver)/.test(lower)) category = 'Transport';
  else if (/(garbage|trash|sanitation|toilet|clean|drain|dirty)/.test(lower)) category = 'Sanitation';
  else if (/(ragging|harass|bully|unsafe|safety|threat)/.test(lower)) category = 'Ragging/Safety';
  else if (/(exam|class|professor|lecture|grade|academic)/.test(lower)) category = 'Academic';
  else if (/(canteen|food|mess hall|cafeteria)/.test(lower)) category = 'Canteen';
  else if (/(building|electricity|water|leak|infrastructure|road|light)/.test(lower)) category = 'Infrastructure';

  let priority = 'Medium';
  let sentiment = 'Concerned';
  if (/(urgent|immediately|emergency|danger|fire|assault|threat|unsafe)/.test(lower)) {
    priority = 'Critical';
    sentiment = 'Distressed';
  } else if (/(asap|serious|repeated|again|worsen)/.test(lower)) {
    priority = 'High';
    sentiment = 'Urgent';
  } else if (/(minor|small|whenever|no rush)/.test(lower)) {
    priority = 'Low';
    sentiment = 'Calm';
  }

  return {
    category,
    priority,
    sentiment,
    summary: text.length > 140 ? text.slice(0, 137) + '...' : text,
    usedFallback: true,
  };
}

/**
 * Analyze a complaint's title+description with one AI call to get
 * category, priority, sentiment, and a short admin-facing summary.
 */
async function analyzeComplaint({ title, description }) {
  const text = `${title}. ${description}`;
  const openai = getClient();
  if (!openai) return fallbackAnalyze(text);

  try {
    const prompt = `You are an AI assistant for a campus complaint management system.
Analyze the complaint below and respond ONLY with strict JSON (no markdown, no backticks) in this exact shape:
{"category": "<one of: ${CATEGORIES.join(', ')}>", "priority": "<one of: Low, Medium, High, Critical>", "sentiment": "<one of: Calm, Concerned, Urgent, Distressed>", "summary": "<one sentence admin-facing summary, max 25 words>"}

Complaint title: ${title}
Complaint description: ${description}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);

    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Other',
      priority: ['Low', 'Medium', 'High', 'Critical'].includes(parsed.priority) ? parsed.priority : 'Medium',
      sentiment: ['Calm', 'Concerned', 'Urgent', 'Distressed'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'Concerned',
      summary: parsed.summary || text.slice(0, 140),
      usedFallback: false,
    };
  } catch (err) {
    console.error('AI analyze error, using fallback:', err.message);
    return fallbackAnalyze(text);
  }
}

/**
 * Simple duplicate detection: compares a new complaint's text against
 * recent open complaints in the same category using the AI, falling back
 * to a basic word-overlap similarity score if no API key / on failure.
 */
function wordOverlapScore(a, b) {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  setA.forEach((w) => {
    if (setB.has(w)) overlap++;
  });
  return overlap / Math.min(setA.size, setB.size);
}

async function findDuplicate(newComplaint, candidateComplaints) {
  if (!candidateComplaints.length) return null;

  const openai = getClient();
  if (!openai) {
    // fallback: word overlap threshold
    for (const c of candidateComplaints) {
      const score = wordOverlapScore(
        `${newComplaint.title} ${newComplaint.description}`,
        `${c.title} ${c.description}`
      );
      if (score > 0.5) return { complaintId: c._id, score, usedFallback: true };
    }
    return null;
  }

  try {
    const candidatesText = candidateComplaints
      .map((c, i) => `${i}. "${c.title}" - ${c.description}`)
      .join('\n');
    const prompt = `You are detecting duplicate complaints in a campus system.
New complaint: "${newComplaint.title}" - ${newComplaint.description}

Existing recent complaints in the same category:
${candidatesText}

If the new complaint is clearly describing the SAME underlying issue as one of the existing ones, respond with strict JSON: {"duplicateIndex": <index number>, "confidence": <0-1>}
If it is NOT a duplicate of any of them, respond with: {"duplicateIndex": -1, "confidence": 0}
Respond with ONLY the JSON, no other text.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    if (parsed.duplicateIndex >= 0 && parsed.confidence >= 0.6) {
      return {
        complaintId: candidateComplaints[parsed.duplicateIndex]._id,
        score: parsed.confidence,
        usedFallback: false,
      };
    }
    return null;
  } catch (err) {
    console.error('AI duplicate detection error, using fallback:', err.message);
    for (const c of candidateComplaints) {
      const score = wordOverlapScore(
        `${newComplaint.title} ${newComplaint.description}`,
        `${c.title} ${c.description}`
      );
      if (score > 0.5) return { complaintId: c._id, score, usedFallback: true };
    }
    return null;
  }
}

/**
 * Generates an overview summary across many complaints, for the admin dashboard.
 */
async function summarizeComplaints(complaints) {
  if (!complaints.length) return 'No complaints to summarize yet.';
  const openai = getClient();
  const listText = complaints
    .slice(0, 40)
    .map((c) => `- [${c.category}/${c.priority}] ${c.title}: ${c.description.slice(0, 100)}`)
    .join('\n');

  if (!openai) {
    const categoryCounts = {};
    complaints.forEach((c) => (categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1));
    const top = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    return `${complaints.length} complaints on record. Most common category: ${top ? top[0] : 'N/A'} (${
      top ? top[1] : 0
    } complaints). Configure OPENAI_API_KEY for a richer AI-generated summary.`;
  }

  try {
    const prompt = `Summarize the following list of campus complaints for a college administrator in 3-4 concise sentences. Highlight the most common issues, any urgent/critical items, and one actionable recommendation.\n\n${listText}`;
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI summary error:', err.message);
    return 'Summary temporarily unavailable. Please check the OpenAI API configuration.';
  }
}

module.exports = { analyzeComplaint, findDuplicate, summarizeComplaints, CATEGORIES };
