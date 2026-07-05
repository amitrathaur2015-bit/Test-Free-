// pages/api/pdf/ai-extract.js
// Calls Anthropic API to extract MCQ questions from PDF text chunk

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, topicHint } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const prompt = `You are an expert educational content extractor. Extract ALL multiple-choice questions (MCQs) from the following text.

Topic hint: ${topicHint || 'General Knowledge'}

Text to analyze:
"""
${text}
"""

Rules:
- Extract ONLY questions that have exactly 4 options (A, B, C, D)
- Identify the correct answer if indicated (by asterisk, bold, circled, key, etc.)
- If correct answer cannot be determined, guess based on educational knowledge
- Clean up formatting, remove numbering artifacts
- Write a brief explanation for why the answer is correct
- Classify each question into: Mathematics, Science, History, Geography, Technology, English, General Knowledge, or Sports

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct",
      "topic": "Science"
    }
  ]
}

If no MCQ questions are found, return: {"questions": []}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(500).json({ error: 'AI service error', questions: [] });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '{"questions":[]}';
    
    // Safe parse
    let parsed;
    try {
      const clean = content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return res.json({ questions: [] });
    }

    // Validate each question
    const valid = (parsed.questions || []).filter(q =>
      q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
    );

    return res.json({ questions: valid });
  } catch (err) {
    console.error('Extract error:', err);
    return res.status(500).json({ error: err.message, questions: [] });
  }
}
