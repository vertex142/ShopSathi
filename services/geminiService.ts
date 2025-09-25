import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const enhanceDescription = async (description: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return Promise.reject(new Error("API key not configured."));
    }
    try {
        const prompt = `Rewrite the following printing service description to be more professional for an invoice. Keep it concise, under 15 words. Description: "${description}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing description:", error);
        throw new Error("Failed to enhance description with AI.");
    }
};

export const analyzeImageWithPrompt = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return Promise.reject(new Error("API key not configured."));
    }
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image with AI.");
    }
};


export const generateActionableInsight = async (prompt: string, context: object): Promise<string> => {
     if (!process.env.API_KEY) {
        return Promise.reject(new Error("API key not configured."));
    }
    try {
        const fullPrompt = `Based on the following business data, perform the requested action.
        Data: ${JSON.stringify(context)}
        
        Action: "${prompt}"
        
        Provide a direct, ready-to-use response.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating actionable insight:", error);
        throw new Error("Failed to generate insight with AI.");
    }
};

export const suggestChatReply = async (chatHistory: string, companyName: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return Promise.reject(new Error("API key not configured."));
    }
    try {
        const prompt = `You are a helpful customer service assistant for a printing company called "${companyName}". 
        Based on the following recent chat history, suggest a professional, concise, and helpful reply from the staff's perspective.
        Do not add a salutation like "Hi" or a signature like "Thanks". Just provide the message body.

        Chat History:
        ${chatHistory}
        
        Suggested Staff Reply:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 100,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting chat reply:", error);
        throw new Error("Failed to suggest chat reply with AI.");
    }
};
