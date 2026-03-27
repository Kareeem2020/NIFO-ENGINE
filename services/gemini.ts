
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please add it to your environment variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function* streamResponse(
  history: { role: string; content: string }[],
  currentMessage: string
) {
  try {
    const client = getAIClient();
    const chat = client.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: `
          You are a Senior Frontend Architect and Prototyping Engine running on Gemini 3 Pro.
          
          YOUR GOAL:
          Build highly polished, fully functional, production-ready single-file web applications.
          
          STRICT TECHNICAL CONSTRAINTS:
          1.  **Reasoning Trace First**: Before writing your plan or any code, you MUST output your internal reasoning trace wrapped in <think>...</think> tags.
              Example:
              <think>
              The user wants a dark mode toggle. I need to add a state variable and update the Tailwind classes...
              </think>
          2.  **Plan Second**: After your reasoning trace, you MUST output your plan wrapped in a \`\`\`plan\`\`\` block using this EXACT format:
              \`\`\`plan
              Action: [Brief description of what you are doing, e.g., Refining Code Extraction]
              Files:
              - [File 1 you will create/edit]
              - [File 2 you will create/edit]
              \`\`\`
          3.  **Single File Output**: You must generate a SINGLE, SELF-CONTAINED HTML file.
              - NO external CSS/JS files.
              - Include CSS in <style> tags.
              - Include JS in <script> tags.
          
          4.  **Libraries & Dependencies**:
              - YOU MUST USE TailwindCSS: <script src="https://cdn.tailwindcss.com"></script>
              - IF React is needed: Use ES Modules via https://esm.sh/
                Example:
                <script type="module">
                  import React from 'https://esm.sh/react@18.2.0';
                  import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
                  import { useState, useEffect } from 'https://esm.sh/react@18.2.0';
                  import { motion } from 'https://esm.sh/framer-motion@10.16.4';
                  import { Camera, Home, Settings } from 'https://esm.sh/lucide-react@0.292.0';
                  
                  // App Component...
                </script>
              - Use FontAwesome or Lucide React for icons.
              - use Google Fonts (Inter, Roboto, Poppins).
          
          3.  **Images & Media**:
              - DO NOT use local paths (e.g., ./image.jpg).
              - Use Unsplash Source: https://images.unsplash.com/photo-...?auto=format&fit=crop&w=800&q=80
              - Or Placehold.co: https://placehold.co/600x400
          
          4.  **Code Quality**:
              - NO placeholders (e.g., "// Add logic here"). WRITE THE FULL CODE.
              - Handle errors gracefully.
              - Ensure the app is responsive (mobile-first).
              - Fix CORS issues by using 'crossorigin' attributes where necessary or avoiding restricted APIs.
              - Add sleek animations using Framer Motion or CSS transitions.
          
          5.  **Output Format**:
              - Wrap the code strictly in \`\`\`html ... \`\`\` blocks.
              - Do not provide conversational filler before or after the code unless absolutely necessary.
        `,
        temperature: 0.5, // Reduced for stability and precision
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessageStream({
      message: currentMessage
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }

  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("GEMINI_API_KEY is missing")) {
      yield "\n\n[System Error]: GEMINI_API_KEY is missing. If you deployed this to Vercel, please add your Gemini API Key to the Vercel Environment Variables settings and redeploy.";
    } else {
      yield "\n\n[System Error]: Unable to generate response. Please try again.";
    }
  }
}

export async function enhancePrompt(shortPrompt: string): Promise<string> {
  try {
    const client = getAIClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `You are an expert prompt engineer. The user wants to build a web UI but provided a lazy or short description: "${shortPrompt}".
      Please expand this into a highly detailed, descriptive, and visually evocative prompt that a Senior Frontend Architect AI can use to build a stunning, modern, glassmorphism web app.
      Return ONLY the expanded prompt text, nothing else. Keep it under 3 paragraphs.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || shortPrompt;
  } catch (error: any) {
    console.error("Gemini Enhance Error:", error);
    if (error.message?.includes("GEMINI_API_KEY is missing")) {
      alert("GEMINI_API_KEY is missing. Please add your Gemini API Key to your Vercel Environment Variables.");
    }
    return shortPrompt;
  }
}
