// AI-powered PDF processor
// Uses Anthropic API to extract MCQ questions from PDF text

export async function extractQuestionsWithAI(pdfText, topicHint, onProgress) {
  const chunks = chunkText(pdfText, 3000);
  const allQuestions = [];
  
  onProgress?.({ step: 'chunking', progress: 5, log: `Split PDF into ${chunks.length} chunks for processing` });

  for (let i = 0; i < chunks.length; i++) {
    const pct = Math.round(10 + (i / chunks.length) * 70);
    onProgress?.({ step: 'extracting', progress: pct, log: `Processing chunk ${i + 1}/${chunks.length}...` });
    
    try {
      const questions = await extractChunk(chunks[i], topicHint);
      allQuestions.push(...questions);
      onProgress?.({ step: 'extracting', progress: pct, log: `Found ${questions.length} questions in chunk ${i + 1}` });
    } catch (err) {
      onProgress?.({ step: 'extracting', progress: pct, log: `Chunk ${i + 1}: ${err.message}` });
    }

    // Throttle to avoid rate limits
    if (i < chunks.length - 1) await sleep(500);
  }

  onProgress?.({ step: 'classifying', progress: 85, log: `Classifying ${allQuestions.length} questions by topic...` });
  
  // Deduplicate
  const unique = deduplicateQuestions(allQuestions);
  
  onProgress?.({ step: 'done', progress: 100, log: `Extraction complete. ${unique.length} unique questions found.` });
  
  return unique;
}

async function extractChunk(text, topicHint) {
  const response = await fetch('/api/pdf/ai-extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, topicHint }),
  });
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.questions || [];
}

function chunkText(text, maxChars) {
  if (!text || text.length === 0) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + maxChars, text.length);
    // Try to break at a paragraph/sentence boundary
    if (end < text.length) {
      const breakAt = text.lastIndexOf('\n\n', end);
      if (breakAt > i + maxChars / 2) end = breakAt;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

function deduplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter(q => {
    const key = q.question?.toLowerCase().slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function detectTopicFromText(text) {
  const lower = text.toLowerCase();
  const scores = {
    'Mathematics': ['equation', 'algebra', 'geometry', 'calculus', 'trigonometry', 'arithmetic', 'fraction', 'decimal', 'percentage', 'prime number', 'integral', 'derivative'],
    'Science': ['physics', 'chemistry', 'biology', 'atom', 'molecule', 'cell', 'photosynthesis', 'newton', 'velocity', 'force', 'energy', 'element'],
    'History': ['war', 'civilization', 'empire', 'revolution', 'century', 'ancient', 'medieval', 'colonial', 'independence', 'treaty', 'battle'],
    'Geography': ['country', 'capital', 'continent', 'ocean', 'mountain', 'river', 'latitude', 'longitude', 'climate', 'population', 'border'],
    'Technology': ['computer', 'software', 'hardware', 'internet', 'programming', 'algorithm', 'database', 'network', 'artificial intelligence', 'machine learning'],
    'English': ['grammar', 'synonym', 'antonym', 'vocabulary', 'sentence', 'paragraph', 'noun', 'verb', 'adjective', 'tense', 'clause'],
    'General Knowledge': ['who invented', 'what is the', 'capital of', 'founder', 'largest', 'smallest', 'first', 'national'],
  };

  let best = { topic: 'General Knowledge', score: 0 };
  for (const [topic, keywords] of Object.entries(scores)) {
    const score = keywords.reduce((s, kw) => {
      const matches = (lower.match(new RegExp(kw, 'g')) || []).length;
      return s + matches;
    }, 0);
    if (score > best.score) best = { topic, score };
  }
  return best.topic;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse PDF text from ArrayBuffer (browser-side)
export async function readPdfText(file, onProgress) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // We'll send the raw file to the API for processing
      resolve(e.target.result);
    };
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 30));
      }
    };
    reader.readAsDataURL(file);
  });
}
