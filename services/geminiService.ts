
import { GoogleGenAI, Type } from "@google/genai";
import { toBase64 } from '../utils/fileUtils';

// It is assumed that process.env.API_KEY is configured in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateImageDetails(file: File, wordLimit: number, userKeywords: string): Promise<{ filename: string; keywords: string[] }> {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured. Please set the API_KEY environment variable.");
    }
    
    const base64Data = await toBase64(file);
    if (typeof base64Data !== 'string') {
        throw new Error("Failed to read image data.");
    }

    const base64String = base64Data.split(',')[1];
    if (!base64String) {
        throw new Error("Invalid base64 data from file.");
    }

    const keywordInstruction = userKeywords.trim()
        ? `From the following list of keywords, select the most relevant ones (between 2 and 5) for the image: [${userKeywords.trim()}]. If none from the list are relevant, return an empty array for keywords.`
        : `Generate a list of relevant keywords (between 3 and 7) that describe the main subjects and concepts in the image.`;


    const prompt = `Analyze this image. Based on its content, generate:
1. An evocative and descriptive, SEO-friendly filename. Instead of a literal description (e.g., "man-on-beach"), aim for a more creative title that captures the mood or story (e.g., "serene-moment-by-the-sea"). The filename must be no more than ${wordLimit} words long, in lowercase, use hyphens for spaces, and contain no special characters other than hyphens. Do not include a file extension.
2. ${keywordInstruction}

Return the result in JSON format.`;

    const imagePart = {
        inlineData: {
            mimeType: file.type,
            data: base64String,
        },
    };

    const textPart = {
        text: prompt
    };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        filename: {
                            type: Type.STRING,
                            description: "The generated filename, lowercase with hyphens."
                        },
                        keywords: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            },
                            description: "An array of relevant keywords."
                        }
                    },
                    required: ["filename", "keywords"]
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);

        // Clean up the filename just in case the model doesn't follow instructions perfectly
        const cleanedFilename = (jsonResponse.filename || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-') 
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-') 
            .replace(/^-|-$/g, ''); 

        const keywords = jsonResponse.keywords || [];

        if (!cleanedFilename) {
             return {
                filename: `image-${Date.now()}`,
                keywords: keywords
            };
        }
        
        return {
            filename: cleanedFilename,
            keywords: keywords,
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        
        // The error from the API can have various structures.
        // We will inspect it as a string to find rate limit indicators.
        const errorText = (error instanceof Error ? error.toString() : JSON.stringify(error)).toLowerCase();

        if (errorText.includes('429') || errorText.includes('resource_exhausted') || errorText.includes('rate limit')) {
            throw new Error("Rate limit exceeded. Please wait and retry.");
        }
        
        throw new Error("Failed to generate details from AI service.");
    }
}