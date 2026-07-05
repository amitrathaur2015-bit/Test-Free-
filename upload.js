// pages/api/pdf/upload.js
// Handles PDF upload, text extraction, and AI processing coordination

export const config = { api: { bodyParser: { sizeLimit: '400mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileName, fileSize, base64Data, topicHint, uploadId } = req.body;

  if (!base64Data) return res.status(400).json({ error: 'No file data provided' });
  if (fileSize > 400 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 400MB)' });

  try {
    // Extract text from base64 PDF using pdf-parse
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(base64Data.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    
    let pdfText = '';
    let pageCount = 0;
    
    try {
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text || '';
      pageCount = pdfData.numpages || 0;
    } catch (parseErr) {
      // If pdf-parse fails, return the error
      return res.status(422).json({ 
        error: 'Could not extract text from PDF. Make sure it is a text-based PDF (not scanned image).',
        details: parseErr.message 
      });
    }

    if (!pdfText.trim()) {
      return res.status(422).json({ 
        error: 'PDF appears to be empty or contains only images. Please use a text-based PDF.' 
      });
    }

    return res.json({ 
      text: pdfText,
      pageCount,
      charCount: pdfText.length,
      wordCount: pdfText.split(/\s+/).length,
      uploadId
    });

  } catch (err) {
    console.error('PDF upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
