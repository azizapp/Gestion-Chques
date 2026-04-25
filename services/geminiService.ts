import { GoogleGenAI, Type } from "@google/genai";

// Runtime API key management - supports dynamic key changes from Settings
let currentApiKey = '';
let aiClient: any = null;

/** Update the Gemini API key at runtime (called from App.tsx on settings load/save) */
export const setGeminiApiKey = (key: string) => {
  if (key !== currentApiKey) {
    currentApiKey = key;
    aiClient = null; // invalidate cached client so it's recreated with new key
  }
};

/** Lazily create/return the GoogleGenAI client */
const getAI = (): any => {
  if (aiClient) return aiClient;
  if (!currentApiKey) return null;
  aiClient = new GoogleGenAI({ apiKey: currentApiKey });
  return aiClient;
};

/**
 * OCR extraction for check images using Flash model
 */
export const extractCheckData = async (base64Image: string) => {
  const ai = getAI();
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
 * Deep Portfolio Analysis using Flash model with Thinking capability
 */
export const analyzePortfolioStrategically = async (checks: any[]) => {
  const ai = getAI();
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
      model: 'gemini-2.5-flash',
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
 * Détection de Fraude : Analyse les patterns suspects dans les chèques
 */
export const detectFraud = async (checks: any[]) => {
  const ai = getAI();
  if (!ai) {
    console.warn('Gemini API key not configured. Fraud detection disabled.');
    return "La détection de fraude nécessite une clé API Gemini.";
  }
  try {
    const summary = checks.map(c => ({
      amount: c.amount,
      type: c.type,
      due_date: c.due_date,
      entity: c.entity_name,
      status: c.status,
      bank: c.bank_name,
      check_number: c.check_number
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyse ces transactions pour détecter des fraudes potentielles:
      ${JSON.stringify(summary)}
      Cherche: 1. Montants anormalement élevés ou répétitifs. 2. Chèques multiples d'une même entité à intervalles suspects. 3. Incohérences entre type de chèque et profil entité. 4. Patterns de dates suspects.
      Réponds en français avec un rapport concis et des alertes spécifiques.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Fraud Detection Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return "Quota API dépassé. Veuillez réessayer plus tard.";
    }
    return "Erreur lors de l'analyse de fraude.";
  }
};

/**
 * Prévision du Flux de Trésorerie sur 30 jours
 */
export const predictCashFlow = async (checks: any[], currency: string = 'MAD') => {
  const ai = getAI();
  if (!ai) {
    console.warn('Gemini API key not configured. Cash flow prediction disabled.');
    return "La prévision de trésorerie nécessite une clé API Gemini.";
  }
  try {
    const summary = checks.map(c => ({
      amount: c.amount,
      type: c.type,
      due_date: c.due_date,
      entity: c.entity_name,
      status: c.status
    }));

    const today = new Date().toISOString().split('T')[0];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Prédis le flux de trésorerie pour les 30 prochains jours.
      Date actuelle: ${today}. Devise: ${currency}.
      Transactions: ${JSON.stringify(summary)}.
      Inclus: 1. Entrées/Sorties quotidiennes estimées. 2. Jours à risque de découvert. 3. Solde projeté fin de mois. 4. Recommandations pour éviter les tensions.
      Réponds en français, format concis et chiffré.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Cash Flow Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return "Quota API dépassé. Veuillez réessayer plus tard.";
    }
    return "Erreur lors de la prévision de trésorerie.";
  }
};

/**
 * Classification des Clients par Niveau de Risque
 */
export const classifyClients = async (checks: any[]) => {
  const ai = getAI();
  if (!ai) {
    console.warn('Gemini API key not configured. Client classification disabled.');
    return "La classification des clients nécessite une clé API Gemini.";
  }
  try {
    // Grouper par entité
    const entityMap: Record<string, any> = {};
    checks.forEach(c => {
      if (!entityMap[c.entity_name]) {
        entityMap[c.entity_name] = { entity: c.entity_name, total: 0, count: 0, returned: 0, pending: 0, paid: 0 };
      }
      entityMap[c.entity_name].total += c.amount;
      entityMap[c.entity_name].count++;
      if (c.status === 'returned') entityMap[c.entity_name].returned++;
      if (c.status === 'pending') entityMap[c.entity_name].pending++;
      if (c.status === 'paid') entityMap[c.entity_name].paid++;
    });

    const clients = Object.values(entityMap);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classifie ces clients/entités par niveau de risque (Faible, Moyen, Élevé, Critique):
      ${JSON.stringify(clients)}
      Critères: 1. Ratio chèques retournés. 2. Montants totaux élevés en attente. 3. Historique de paiements. 4. Nombre de transactions.
      Réponds en français avec un tableau clair: Entité | Niveau de Risque | Justification | Recommandation.`,
      config: {
        thinkingConfig: { thinkingBudget: 1500 }
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Client Classification Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return "Quota API dépassé. Veuillez réessayer plus tard.";
    }
    return "Erreur lors de la classification.";
  }
};

/**
 * Génération d'un Rapport Mensuel Financier
 */
export const generateMonthlyReport = async (checks: any[], currency: string = 'MAD') => {
  const ai = getAI();
  if (!ai) {
    console.warn('Gemini API key not configured. Monthly report disabled.');
    return "Le rapport mensuel nécessite une clé API Gemini.";
  }
  try {
    const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const summary = checks.map(c => ({
      amount: c.amount,
      type: c.type,
      due_date: c.due_date,
      entity: c.entity_name,
      status: c.status,
      bank: c.bank_name
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Génère un rapport financier mensuel pour ${month}.
      Devise: ${currency}. Transactions: ${JSON.stringify(summary)}.
      Inclus: 1. Résumé Entrées vs Sorties. 2. Top 5 clients par volume. 3. Taux de recouvrement. 4. Chèques en retard. 5. Recommandations pour le mois suivant.
      Réponds en français avec un rapport professionnel structuré.`,
      config: {
        thinkingConfig: { thinkingBudget: 2500 }
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Monthly Report Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.error?.code === 429) {
      return "Quota API dépassé. Veuillez réessayer plus tard.";
    }
    return "Erreur lors de la génération du rapport.";
  }
};