import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve index.html on root from frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// factor extraction into a reusable function
async function runExtraction(text) {
  if (!text) throw new Error('No text provided');
  if (!GEMINI_API_KEY) throw new Error('Server missing Gemini API key');

  const prompt11 = `
Extract the following details from this contract description:
- From (the party offering the contract)
- To (the party receiving the contract)
- Deliverables
- Deadline
- Payment terms
- Milestones
- Penalties or refund clauses

Return the result as a JSON object with keys: description, from, to, deliverables, deadline, payment, milestones, penalties.

Description: """${text}"""
`;

  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
    {
      contents: [{ parts: [{ text: prompt11 }] }]
    }
  );
  const aiText = response.data.candidates[0].content.parts[0].text;
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');
  const extracted = JSON.parse(jsonMatch[0]);

  if (extracted.deadline) {
    let date = new Date(extracted.deadline);
    if (isNaN(date.getTime())) {
      const match = extracted.deadline.match(/(\d{1,2})(?:st|nd|rd|th)?(?: of)? ([A-Za-z]+)/);
      if (match) {
        const day = match[1];
        const monthName = match[2];
        const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
        const monthIndex = months.findIndex(m => m.startsWith(monthName.toLowerCase()));
        if (monthIndex !== -1) {
          date = new Date(2025, monthIndex, parseInt(day));
        }
      }
    }
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      extracted.deadline = `${day}-${month}-${year}`;
      extracted.deadline_iso = `${year}-${month}-${day}`;
    }
  }

  return extracted;
}

// existing extract endpoint now uses the function
app.post('/extract', async (req, res) => {
  try {
    const { text } = req.body;
    const extracted = await runExtraction(text);
    res.json(extracted);
  } catch (err) {
    console.error('Extraction error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

// Accept POST to root as well (some frontends post to /); delegate to same handler
app.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    const extracted = await runExtraction(text);
    res.json(extracted);
  } catch (err) {
    console.error('Root POST extraction error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

app.post('/generate-pdf', async (req, res) => {
  const { contractDetails } = req.body;
  if (!contractDetails) return res.status(400).json({ error: 'No contract details provided' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Server missing Gemini API key' });

  // Compose a prompt for Gemini to generate a legal-style contract
  const prompt = `
Write a formal legal-style freelancer contract agreement (MoU) between the client and freelancer using the following details. Include amount, deadlines, deliverables, and penalties clearly. Use a professional legal tone and format for a contract document. Output only the contract text, no explanations.

Details:
${JSON.stringify(contractDetails, null, 2)}
`;

  let contractText = '';
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    contractText = response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Gemini API failed', details: err.response?.data || err.message });
  }

  // Generate PDF using pdfkit
  try {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contract.pdf"');
    doc.pipe(res);
    doc.fontSize(18).text('Freelancer Contract Agreement', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(12).text(contractText, { align: 'left' });
    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed', details: err.message });
  }
});

// use runtime port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AI backend running on http://localhost:${PORT}`));