import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Clients ---
// We wrap these in a simple check so the server doesn't crash on startup if keys are missing
const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: { maxOutputTokens: 50, temperature: 0.1 }
  });
};

const getMistralClient = () => {
  if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY.includes('your_')) {
    return null;
  }
  return new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
};

const geminiModel = getGeminiModel();
const mistralClient = getMistralClient();

// --- Helpers ---
const createPrompt = (context) => {
  const contextHint = context ? `The user says this is a drawing of a ${context}.` : "";
  return `Identify this drawing. ${contextHint} 
  RULES:
  - If it is a number, provide ONLY the digit (e.g., "5" not "five").
  - If it is a letter, provide ONLY the character (e.g., "A").
  - If it is an object, provide ONLY the name in 1-2 words.
  - No sentences, no punctuation.
  - If it's a non-English character, give its name/meaning. 
  Be decisive, give your best guess.`;
};

app.post('/api/guess', async (req, res) => {
  const { image, context, provider } = req.body;
  console.log(`--- Request: ${provider || 'Gemini'} ---`);
  
  try {
    if (!image) return res.status(400).json({ error: 'No image provided' });
    const prompt = createPrompt(context);

    if (provider === 'Mistral') {
      if (!mistralClient) {
        return res.status(400).json({ error: 'Mistral API key is missing in .env' });
      }

      console.log('Calling Mistral Pixtral Vision API...');
      const chatResponse = await mistralClient.chat.complete({
        model: "pixtral-12b-latest",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", imageUrl: `data:image/png;base64,${image}` }
          ]
        }]
      });

      let text = chatResponse.choices[0].message.content.trim();
      if (text.includes('![img')) text = "Hand-drawn sketch";
      
      console.log('Mistral Guess:', text);
      res.json({ guess: text || "Unclear drawing" });

    } else {
      // Default: Gemini
      if (!geminiModel) {
        return res.status(400).json({ error: 'Gemini API key is missing in .env' });
      }

      const result = await geminiModel.generateContent([
        prompt,
        { inlineData: { data: image, mimeType: "image/png" } }
      ]);
      const response = await result.response;
      const text = response.text().trim();
      console.log('Gemini Guess:', text);
      res.json({ guess: text || "Unclear drawing" });
    }

  } catch (error) {
    console.error('Server Error:', error.message);
    const status = error.message.includes('429') ? 429 : 500;
    const msg = status === 429 ? 'Daily limit reached.' : `AI Error: ${error.message.substring(0, 50)}`;
    res.status(status).json({ error: msg });
  }
});

// Global error handlers
process.on('unhandledRejection', (err) => console.error('Promise Error:', err));
process.on('uncaughtException', (err) => console.error('Crash Error:', err));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
