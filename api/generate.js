

import { GoogleGenAI, Type } from "@google/genai";

// This is a Vercel Serverless Function that streams responses.
// It runs on the server, not in the browser.
// process.env.API_KEY will be securely read from your Vercel project's environment variables.

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // Set headers for Server-Sent Events (SSE)
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders(); // Flush the headers to establish the connection

    try {
        const { prompt, tool, persona, chatHistory } = request.body;

        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        
        if(!prompt) {
            throw new Error("Prompt is missing.");
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

        const stream = await ai.models.generateContentStream({
            model,
            contents,
            config
        });

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                // Format as a Server-Sent Event
                response.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }
        
        // Signal the end of the stream to the client
        response.write('data: {"event":"done"}\n\n');
        
    } catch (error) {
        console.error("Error in /api/generate stream:", error);
        // Send an error event to the client
        response.write(`data: ${JSON.stringify({ error: error.message || "An internal server error occurred." })}\n\n`);
    } finally {
        // End the response stream
        response.end();
    }
}
