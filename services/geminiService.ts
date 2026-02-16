
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSemanticSearch = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a meticulous real estate data extractor. Extract info from: "${description}". 
      If a value is missing or unclear, set it to 0 or null. Do not guess.
      Explain your reasoning for the investment score.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            price: { type: Type.NUMBER },
            rooms: { type: Type.INTEGER },
            bathrooms: { type: Type.INTEGER },
            location: { type: Type.STRING },
            sqft: { type: Type.INTEGER },
            dealScore: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER, description: 'Percentage of certainty on data extraction (0-100)' },
            analysis: {
              type: Type.OBJECT,
              properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                strategy: { type: Type.STRING }
              }
            }
          },
          required: ["title", "price", "dealScore", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
};

export const suggestRenovationCosts = async (propertyTitle: string, address: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the property "${propertyTitle}" in "${address}", suggest 4 typical renovation categories and their estimated costs in EUR for a standard mid-range renovation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedCost: { type: Type.NUMBER }
            },
            required: ["category", "estimatedCost"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
