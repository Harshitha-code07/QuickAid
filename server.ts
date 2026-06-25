import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required. Please set it in AI Studio Secrets.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  
  // Parse JSON and form-urlencoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API endpoint for First Aid Instructions using Gemini
  app.post("/api/first-aid", async (req, res) => {
    try {
      const { symptom } = req.body;
      if (!symptom || typeof symptom !== "string" || symptom.trim() === "") {
        return res.status(400).json({ error: "Symptom or emergency query is required." });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        console.error("Gemini initialization error:", err.message);
        return res.status(503).json({
          error: "First-aid AI service is currently unconfigured. Make sure GEMINI_API_KEY is supplied in the Settings > Secrets configuration.",
          recoverySteps: [
            "Open Settings (⚙️ gear icon in the top-right corner).",
            "Go to Secrets.",
            "Add a secret named GEMINI_API_KEY with your Google Gemini API key."
          ]
        });
      }

      const prompt = `Assess the emergency query from the user: "${symptom}".
Based STRICTLY on World Health Organization (WHO) and international first aid standards (like IFRC/Red Cross), generate immediate first aid steps.
For context: do not recommend unverified kitchen or home remedies. Focus entirely on direct, scientifically backed WHO life-saving interventions.

You must reply with a structured JSON object containing:
1. title: The brief title of the standard WHO first-aid guide for this concern (e.g., "First Aid for Dog Bites").
2. severity: The immediate assessment tier level ("Critical", "Moderate", "Mild").
3. whoRef: Citation of standard source e.g. "WHO Guidelines & International First Aid Standard Practices".
4. steps: Sequential array of direct, easy-to-read, actionable instruction steps (max 8 steps, each step under 20 words for quick reading).
5. dos: List of 3-4 absolute critical recommendations.
6. donts: List of 3-4 critical actions to strictly avoid (e.g., no butter on burns, no tourniquet unless trained).
7. emergencyContactRequired: Boolean indicating if this is an immediate call-911/emergency case.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional first-aid assistant certified to provide World Health Organization (WHO) aligned guidance. Format all responses strictly according to the specified JSON schema. Keep language simple, calm, direct, and actionable for someone dealing with an active emergency.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Descriptive name of the first aid guidance" },
              severity: { type: Type.STRING, description: "Crisis intensity assessment: Critical, Moderate, or Mild" },
              whoRef: { type: Type.STRING, description: "WHO guidelines reference notice" },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Sequential list of actionable first aid procedures"
              },
              dos: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Do's list for this condition"
              },
              donts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Don'ts list for this condition"
              },
              emergencyContactRequired: {
                type: Type.BOOLEAN,
                description: "Is calling professional medical emergency services highly recommended immediately?"
              }
            },
            required: ["title", "severity", "whoRef", "steps", "dos", "donts", "emergencyContactRequired"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from Gemini.");
      }

      const firstAidData = JSON.parse(responseText);
      return res.json(firstAidData);

    } catch (error: any) {
      console.error("Error processing first-aid request:", error);
      return res.status(500).json({
        error: "Failed to generate WHO first aid instructions.",
        details: error.message || "Unknown error occurred."
      });
    }
  });

  // Serve static assets or use Vite dev server
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Quick Aid Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
