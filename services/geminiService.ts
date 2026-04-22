import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * OCR extraction for check images using Flash model
 */
export const extractCheckData = async (base64Image: string) => {
  if (!ai) {
    console.warn('Gemini API key not configured. OCR feature disabled.');
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "Analysez cette image de chèque et extrayez les détails au format JSON. IMPORTANT: Pour 'entity_name' et 'fund_name', extrayez UNIQUEMENT des noms ou du texte descriptif (pas de numéros de compte ou d'identifiants numériques). Si le bénéficiaire est un nom propre, mettez-le dans 'entity_name'. Si un compte ou fonds est nommé textuellement, mettez-le dans 'fund_name'. Détails requis: check_number, bank_name, amount (numérique), entity_name (nom de la personne/société), issue_date (AAAA-MM-JJ), due_date (AAAA-MM-JJ), amount_in_words (montant en lettres), fund_name (nom du compte/fonds) et notes.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            check_number: { type: Type.STRING },
            bank_name: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            entity_name: { type: Type.STRING },
            issue_date: { type: Type.STRING },
            due_date: { type: Type.STRING },
            amount_in_words: { type: Type.STRING },
            fund_name: { type: Type.STRING },
            notes: { type: Type.STRING }
          }
        },
      },
    });

    const resultText = response.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error: any) {
    console.error("OCR Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return { error: 'QUOTA_EXCEEDED', message: 'Quota API dépassé. Veuillez réessayer plus tard.' };
    }
    return null;
  }
};

/**
 * Deep Portfolio Analysis using Pro model with Thinking capability
 */
export const analyzePortfolioStrategically = async (checks: any[]) => {
  if (!ai) {
    console.warn('Gemini API key not configured. Portfolio analysis disabled.');
    return "L'analyse IA nécessite une clé API Gemini. Veuillez configurer votre clé API dans les paramètres.";
  }
  try {
    const summary = checks.map(c => ({
      amount: c.amount,
      type: c.type,
      due_date: c.due_date,
      entity: c.entity_name,
      status: c.status
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Analyse cette liste de transactions financières (chèques) et fournis un rapport stratégique profond. 
      Données: ${JSON.stringify(summary)}. 
      Inclus: 1. Risques de liquidité immédiats. 2. Prévisions de trésorerie sur 30 jours. 3. Recommandations de gestion. 
      Réponds en français avec un ton professionnel et expert.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Deep Analysis Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return "Quota API dépassé. L'analyse IA est temporairement indisponible. Veuillez réessayer plus tard.";
    }
    return "Une erreur est survenue lors de l'analyse IA.";
  }
};

/**
 * Get Market Intel using Google Search Grounding
 */
export const getMarketIntel = async (currency: string = 'MAD') => {
  if (!ai) {
    console.warn('Gemini API key not configured. Market intel disabled.');
    return {
      text: "L'intelligence de marché nécessite une clé API Gemini. Veuillez configurer votre clé API dans les paramètres.",
      sources: []
    };
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Quels sont les taux de change actuels pour le ${currency} (MAD) face au USD et EUR ? Inclus également une brève actualité financière pertinente pour les entreprises au Maroc.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri
    })) || [];

    return {
      text: response.text,
      sources
    };
  } catch (error: any) {
    console.error("Market Intel Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return {
        text: "Quota API dépassé. L'intelligence de marché est temporairement indisponible. Veuillez réessayer plus tard.",
        sources: [],
        error: 'QUOTA_EXCEEDED'
      };
    }
    return null;
  }
};