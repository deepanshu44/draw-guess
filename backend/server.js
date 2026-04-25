import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Rate Limiter ---
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
  message: { error: 'Too many guesses! Please wait a minute.' }
});

app.use('/api/guess', limiter);

// --- Clients ---
const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    generationConfig: { maxOutputTokens: 50, temperature: 0.1 }
  });
};

const getMistralClient = () => {
  if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY.includes('your_')) return null;
  return new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
};

const geminiModel = getGeminiModel();
const mistralClient = getMistralClient();

// --- Unified Prompt Helper ---
const createPrompt = (context) => {
  const contextHint = context ? `The user indicated this is a drawing of a ${context}.` : "";
  return `You are a high-precision vision system. Analyze this drawing. ${contextHint}
  
  TASK:
  1. MATH: If it's a math problem (e.g., "5 + 7 + 3"), solve it step-by-step internally and return ONLY the final result.
  2. SYMBOLS: Identify characters/letters from any language. Provide the literal character.
  3. OBJECTS: Identify common items in 1-2 words.
  
  OUTPUT RULE:
  Return ONLY the literal result (the digit, the character, or the object name). 
  No sentences. No explanations. Be extremely concise.`;
};

app.post('/api/guess', async (req, res) => {
  const { image, context, provider } = req.body;
  const activeProvider = provider || 'Gemini';
  console.log(`--- Request: ${activeProvider} ---`);
  
  try {
    if (!image) return res.status(400).json({ error: 'No image provided' });
    const prompt = createPrompt(context);

    if (activeProvider.startsWith('Mistral')) {
      if (!mistralClient) return res.status(400).json({ error: 'Mistral API key missing' });

      console.log(`Calling Mistral (Pixtral 12B)...`);
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
      console.log('Mistral Response:', text);
      res.json({ guess: text || "Unclear" });

    } else {
      // Default: Gemini
      if (!geminiModel) return res.status(400).json({ error: 'Gemini API key missing' });

      const result = await geminiModel.generateContent([
        prompt,
        { inlineData: { data: image, mimeType: "image/png" } }
      ]);
      const response = await result.response;
      const text = response.text().trim();
      console.log('Gemini Guess:', text);
      res.json({ guess: text || "Unclear" });
    }

  } catch (error) {
    console.error('Server Error:', error.message);
    const status = error.message.includes('429') ? 429 : 500;
    res.status(status).json({ error: status === 429 ? 'Limit reached' : 'AI failed' });
  }
});

// Global error handlers
process.on('unhandledRejection', (err) => console.error('Promise Error:', err));
process.on('uncaughtException', (err) => console.error('Crash Error:', err));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
