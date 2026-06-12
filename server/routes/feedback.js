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
    const { studentName, date, teacherName, lessonUnit, checkedItems, customNotes, gender } = req.body;

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

    // Determine pronoun instruction based on gender
    const genderLabel = gender || 'unknown gender';
    const pronounInstruction = gender === 'Male' 
      ? 'Use the pronouns "he", "his", and "him" consistently to refer to the student.' 
      : gender === 'Female' 
        ? 'Use the pronouns "she" and "her" consistently to refer to the student.' 
        : 'Use appropriate pronouns consistently to refer to the student.';

    let prompt = `You are an ESL teacher writing a short progress note to a parent about ${studentName} (${genderLabel}) from ${date || 'today'}'s class on "${lessonUnit || 'General ESL Practice'}" with teacher ${teacherName || 'the teacher'}.
    
Based on these observations:
${formattedObservations}`;

    if (customNotes && customNotes.trim()) {
      prompt += `\n\nAdditional notes from the teacher: "${customNotes.trim()}"`;
    }

    prompt += `\n\nWrite a warm, encouraging 3-4 sentence paragraph. ${pronounInstruction} Mention strengths first, then gently note areas for continued practice. Keep it simple, positive, and parent-friendly. Refer to the student by name. Do not include placeholders, formatting tags, or preambles. Just return the feedback text.`;

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
