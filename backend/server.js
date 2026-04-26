import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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
	limit: 15,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
  message: { error: 'Too many guesses!' }
});

app.use('/api/guess', limiter);

// --- Clients ---
const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      result: { type: SchemaType.STRING },
      location: {
        type: SchemaType.OBJECT,
        properties: {
          x_percent: { type: SchemaType.NUMBER },
          y_percent: { type: SchemaType.NUMBER }
        },
        required: ["x_percent", "y_percent"]
      }
    },
    required: ["result", "location"]
  };

  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-lite',
    generationConfig: { 
      maxOutputTokens: 500, 
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
};

const getMistralClient = () => {
  if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY.includes('your_')) return null;
  return new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
};

const geminiModel = getGeminiModel();
const mistralClient = getMistralClient();

// --- SPATIAL PROMPT ---
const createSpatialPrompt = () => {
  return `You are a high-precision spatial grounding system. 
  1. Identify the drawing (e.g. "5+7="). If math, solve it.
  2. Imagine a grid over the image. 
  3. Find the exact [y, x] coordinate of the EQUALS SIGN (=) or the END of the drawing.
  4. Provide the location as PERCENTAGES (0 to 100).
  
  JSON FORMAT:
  {
    "result": "the answer",
    "location": {
      "x_percent": number (where answer should start),
      "y_percent": number (vertical center of the drawing)
    }
  }
  
  Example: If the "=" is in the middle right, return {"x_percent": 65, "y_percent": 50}.`;
};

app.post('/api/guess', async (req, res) => {
  const { image, provider } = req.body;
  const activeProvider = provider || 'Gemini';
  console.log(`--- Spatial Request: ${activeProvider} ---`);
  
  try {
    if (!image) return res.status(400).json({ error: 'No image provided' });

    if (activeProvider.startsWith('Mistral')) {
      if (!mistralClient) return res.status(400).json({ error: 'Mistral key missing' });

      const chatResponse = await mistralClient.chat.complete({
        model: "pixtral-12b-latest",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: createSpatialPrompt() + " Respond with JSON only." },
            { type: "image_url", imageUrl: `data:image/png;base64,${image}` }
          ]
        }]
      });

      const responseText = chatResponse.choices[0].message.content.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const spatialData = JSON.parse(jsonMatch[0]);
      res.json({ guess: spatialData.result, location: spatialData.location, isSpatial: true });

    } else {
      if (!geminiModel) return res.status(400).json({ error: 'Gemini key missing' });

      const result = await geminiModel.generateContent([
        createSpatialPrompt(),
        { inlineData: { data: image, mimeType: "image/png" } }
      ]);
      
      const spatialData = JSON.parse(result.response.text());
      res.json({ guess: spatialData.result, location: spatialData.location, isSpatial: true });
    }

  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: "AI failed to process spatial data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
