const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

router.post('/analyze', async (req, res) => {
  const { resume, jobDescription } = req.body;

  if (!resume || !jobDescription) {
    return res.status(400).json({ error: 'Resume and job description are required.' });
  }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an expert career coach and technical recruiter for Bay Area software companies.

Analyze the resume below against the job description and provide:

1. **Match Score** (0-100) with a one-line explanation
2. **Top 3 Strengths** — what aligns well
3. **Top 3 Gaps** — what's missing or weak
4. **Rewrite Suggestions** — 2-3 specific bullet points to improve
5. **Cover Letter Draft** — a concise, compelling 3-paragraph cover letter

---
JOB DESCRIPTION:
${jobDescription}

---
RESUME:
${resume}`
      }]
    });

    // Collect full result while streaming to browser
    let fullResult = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullResult += chunk.delta.text;  // collect it
        res.write(chunk.delta.text);     // send it to browser
      }
    }

    res.end();

    // Save to DB after streaming is done
    try {
      await prisma.analysis.create({
        data: { resume, jobDescription, result: fullResult }
      });
      console.log('✅ Analysis saved to DB');
    } catch (dbErr) {
      console.error('❌ DB save failed:', dbErr.message);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong with the AI call.' });
  }
});

// Get past analyses (most recent 10)
router.get('/analyses', async (req, res) => {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, jobDescription: true, createdAt: true }
    });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch analyses.' });
  }
});

// Get one full analysis by id
router.get('/analyses/:id', async (req, res) => {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!analysis) return res.status(404).json({ error: 'Not found.' });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch analysis.' });
  }
});

module.exports = router;