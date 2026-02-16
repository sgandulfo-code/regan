
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSemanticSearch = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert real estate investment analyst. Analyze this property info and provide a detailed structured report: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short catchy title for the property' },
            price: { type: Type.NUMBER },
            rooms: { type: Type.INTEGER },
            bathrooms: { type: Type.INTEGER },
            location: { type: Type.STRING, description: 'Neighborhood and city' },
            sqft: { type: Type.INTEGER, description: 'Size in square meters' },
            dealScore: { type: Type.NUMBER, description: 'Investment potential score from 0 to 100' },
            analysis: {
              type: Type.OBJECT,
              properties: {
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                strategy: { type: Type.STRING, description: 'One sentence advice for the buyer' }
              }
            }
          },
          required: ["title", "price", "dealScore"]
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
