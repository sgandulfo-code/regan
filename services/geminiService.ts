
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSemanticSearch = async (description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-precision real estate technical analyst. 
      TASK: Analyze this description or URL: "${description}" and extract ALL possible technical specifications.
      
      CRITICAL RULES:
      1. Use Google Search to find the EXACT listing if a URL is provided.
      2. Extract EXACT numbers for price, sqft, rooms, and fees.
      3. Prices and fees are usually in USD or local currency ($). Do not use Euros.
      4. "environments" = Total number of main spaces (Living + Bedrooms).
      5. "rooms" = Total number of Bedrooms only.
      6. "fees" = Monthly community costs/expensas (approximate if not exact).
      7. "confidence" = Score from 0.0 to 1.0 based on how sure you are of the data.
      
      If any data point is absolutely not found, return 0 or empty string. Do not invent data.`,
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

    const text = response.text || '{}';
    try {
      const parsed = JSON.parse(text);
      return {
        ...parsed,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (e) {
      console.warn("Gemini response was not valid JSON, but received text:", text);
      return { error: 'PARSE_ERROR' };
    }
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    const errorString = JSON.stringify(error).toLowerCase();
    if (errorString.includes('429') || errorString.includes('quota') || errorString.includes('exhausted')) {
      return { error: 'QUOTA_EXCEEDED' };
    }
    return { error: 'GENERIC_ERROR' };
  }
};

export const suggestRenovationCosts = async (propertyTitle: string, address: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 4 mid-range renovation costs for: "${propertyTitle}" in "${address}". Format: JSON array. Use $ as currency symbol.`,
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
