import { Router } from 'express';
// ...existing imports...

const router = Router();
const startedAt = new Date().toISOString();

// ...existing code...

router.get('/status', (req, res) => {
  const envModel = process.env.GEMINI_MODEL;
  const resolvedModel = envModel || 'gemini-1.5-pro';
  const configured = !!process.env.GEMINI_API_KEY;
  res.json({
    configured,
    model: resolvedModel,
    envModel: envModel ?? null,
    defaultUsed: !envModel,
    startedAt,
  });
});

// ...existing code...

router.post('/analyze', async (req, res) => {
  try {
    const { user, modelHint } = req.body || {};
    // Choose model: client hint → env → default
    const envModel = process.env.GEMINI_MODEL;
    const model = (typeof modelHint === 'string' && modelHint) || envModel || 'gemini-1.5-pro';

    // Optional: log once per request to verify what’s used
    if (process.env.NODE_ENV !== 'test') {
      console.debug(`[AI] analyze using model=${model} (hint=${modelHint || '—'}, env=${envModel || '—'})`);
    }

    // ...existing code that builds the Gemini client using process.env.GEMINI_API_KEY...
    // ...and generates the paragraph summary, now using `model`...
    // e.g. client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model })
    // const summary = await client.generateContent({ /* prompt */ });

    // ...existing code that forms the response...
    // res.json({ summary, strengths, interests, suggestedRoles, matchCriteria });

  } catch (err: any) {
    // ...existing error handling...
  }
});

// ...existing code...

export default router;
