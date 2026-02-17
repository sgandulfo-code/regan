
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSemanticSearch = async (description: string) => {
  try {
    // Usamos googleSearch para que el modelo visite la URL y extraiga datos reales
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-precision real estate analyst. 
      TASK: Extract all technical specifications from this property: "${description}".
      
      RULES:
      1. Visit the provided URL if available.
      2. Extract EXACT numbers.
      3. "environments" = Living + Bedrooms.
      4. "rooms" = Bedrooms only.
      5. "fees" = Monthly community costs.
      
      If data is missing, return 0. Use grounding to provide sources.`,
      config: {
        tools: [{ googleSearch: {} }],
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

    const parsed = JSON.parse(response.text || '{}');
    
    // Adjuntamos las fuentes (grounding) para que el usuario pueda validar
    return {
      ...parsed,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    if (error.message?.includes('429')) return { error: 'QUOTA_EXCEEDED' };
    return null;
  }
};

export const suggestRenovationCosts = async (propertyTitle: string, address: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 4 mid-range renovation costs for: "${propertyTitle}" in "${address}". Format: JSON array.`,
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
    return [];
  }
};
