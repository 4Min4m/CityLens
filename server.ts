import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/recognize", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Extract base64 data
    const base64Data = image.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: "Identify this landmark. Focus on identifying it accurately. If it's a famous landmark, provide its name and a brief 2-sentence summary. If it's not a clear landmark, say so.",
            },
          ],
        },
      ],
    });

    const landmarkInfo = response.text;
    res.json({ result: landmarkInfo });
  } catch (error: any) {
    console.error("Recognition error:", error);
    const status = error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('429') ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

app.post("/api/details", async (req, res) => {
  try {
    const { landmarkName } = req.body;
    if (!landmarkName) {
      return res.status(400).json({ error: "No landmark name provided" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert tour guide. For the landmark "${landmarkName}", please:
1. Provide a detailed historical overview in Markdown format (including Fun Facts).
2. Create an engaging 30-second narration script for a travel guide.

Format your response as a JSON object with:
"history": (markdown string),
"narration": (narration script string)
`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text);
    
    // Extract search grounding sources if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks ? chunks.filter((c: any) => c.web).map((c: any) => ({
      title: c.web.title,
      url: c.web.uri
    })) : [];

    res.json({ ...result, sources });
  } catch (error: any) {
    console.error("Details error:", error);
    const status = error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('429') ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

// Vite middleware for development
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
