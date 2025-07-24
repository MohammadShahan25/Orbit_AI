
import { GoogleGenAI, Type } from "@google/genai";

// This is a Vercel Serverless Function.
// It runs on the server, not in the browser.
// process.env.API_KEY will be securely read from your Vercel project's environment variables.

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, tool, persona, chatHistory } = request.body;

        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const model = 'gemini-2.5-flash';
        let systemInstruction = persona?.systemInstruction || "You are a helpful AI assistant.";
        if (tool && tool.systemInstruction) {
            systemInstruction = tool.systemInstruction;
        }

        const config = {
            systemInstruction,
        };
        
        // This is the critical fix: Ensure `contents` is always a structured array.
        let contents;
        if (chatHistory && chatHistory.length > 0) {
            // For chat, build the full history array
            contents = [...chatHistory, { role: 'user', parts: [{ text: prompt }] }];
        } else {
            // For single-turn tool requests, create the basic user prompt structure
            contents = [{ role: 'user', parts: [{ text: prompt }] }];
        }


        // Handle special configurations for specific tools
        if (tool?.id === 'flashcards') {
            config.responseMimeType = "application/json";
            config.responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING }
                    },
                    required: ["term", "definition"]
                }
            };
        }

        const genAIResponse = await ai.models.generateContent({
            model,
            contents,
            config
        });

        const text = genAIResponse.text;
        
        response.status(200).json({ text });

    } catch (error) {
        console.error("Error in /api/generate:", error);
        response.status(500).json({ error: error.message || "An internal server error occurred." });
    }
}
