import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize the Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
}

router.post('/', async (req, res) => {
  try {
    const { studentName, date, teacherName, lessonUnit, checkedItems, customNotes } = req.body;

    if (!studentName) {
      return res.status(400).json({ error: 'Student name is required.' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API client is not configured. Please set GEMINI_API_KEY.' });
    }

    // Format checked items for prompt
    let formattedObservations = '';
    if (checkedItems && typeof checkedItems === 'object') {
      formattedObservations = Object.entries(checkedItems)
        .filter(([_, items]) => Array.isArray(items) && items.length > 0)
        .map(([section, items]) => `- ${section}: ${items.join(', ')}`)
        .join('\n');
    }

    if (!formattedObservations) {
      formattedObservations = 'No specific skills or behaviors checked (general class completion).';
    }

    let prompt = `You are an ESL teacher writing a short progress note to a parent about ${studentName}'s class on ${date || 'today'} with teacher ${teacherName || 'the teacher'}. The lesson was on "${lessonUnit || 'General ESL Practice'}".
Based on these observation notes:
${formattedObservations}`;

    if (customNotes && customNotes.trim()) {
      prompt += `\n\nAdditionally, please weave in the following specific class details/events: "${customNotes.trim()}"`;
    }

    prompt += `\n\nWrite a warm, encouraging 3-4 sentence feedback paragraph. Mention student's strengths and what went well first, then gently note 1-2 areas for continued practice or review. Keep the language simple, positive, and parent-friendly. Use a direct, professional, yet caring tone. Refer to the student by name. Do not include placeholders, formatting tags, or preambles. Just return the feedback text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const feedbackText = response.text || '';
    res.json({ feedback: feedbackText.trim() });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback due to internal error.' });
  }
});

export default router;
