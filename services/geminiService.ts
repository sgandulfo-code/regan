
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSemanticSearch = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-precision real estate analyst. Extract technical data from: "${description}".
      
      CRITICAL DEFINITIONS:
      - "environments" (ambientes): Total number of distinct living areas (Living + Bedrooms).
      - "rooms": Number of actual bedrooms (dormitorios).
      - "fees" (expensas/comunidad): Monthly maintenance cost.
      - "coveredSqft": Indoor area.
      - "uncoveredSqft": Balconies, terraces or gardens.
      
      If any value is missing, return 0 or null. DO NOT HALLUCINATE OR GUESS.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            price: { type: Type.NUMBER },
            fees: { type: Type.NUMBER },
            location: { type: Type.STRING },
            exactAddress: { type: Type.STRING },
            environments: { type: Type.INTEGER },
            rooms: { type: Type.INTEGER },
            bathrooms: { type: Type.INTEGER },
            toilets: { type: Type.INTEGER },
            parking: { type: Type.INTEGER },
            sqft: { type: Type.NUMBER },
            coveredSqft: { type: Type.NUMBER },
            uncoveredSqft: { type: Type.NUMBER },
            age: { type: Type.INTEGER },
            floor: { type: Type.STRING },
            dealScore: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
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
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return { error: 'QUOTA_EXCEEDED' };
    }
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
  } catch (error: any) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
