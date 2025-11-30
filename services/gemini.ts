
import { GoogleGenAI } from "@google/genai";
import { FinancialInputs, CalculationResult, NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  inputs: FinancialInputs,
  results: CalculationResult
): Promise<string> => {
  try {
    const prompt = `
      You are an expert financial retirement planner. A user has provided the following details:
      
      - Current Age: ${inputs.currentAge}
      - Target Retirement Age: ${inputs.targetRetirementAge}
      - Current Savings: HKD ${inputs.currentSavings}
      - Desired Monthly Retirement Spending (Today's Value): HKD ${inputs.monthlySpending}
      - Expected Annual Return: ${inputs.expectedAnnualReturn}%
      
      Based on the calculation, here are the results:
      - Years until retirement: ${results.yearsToRetire}
      - Required Nest Egg: HKD ${Math.round(results.nestEggTarget).toLocaleString()}
      - Required Monthly Savings: HKD ${Math.round(results.monthlyContributionRequired).toLocaleString()}
      
      Please provide a concise, actionable, and encouraging strategic plan (approx 150 words). 
      Format the response in Markdown.
      Focus on 3 key areas:
      1. Feasibility analysis (is this realistic?).
      2. Specific investment strategy suggestions (broad asset allocation ideas, not specific stocks).
      3. Lifestyle or savings adjustments if the number is high.
      
      Do not be alarmist, be constructive.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Unable to generate advice at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to fetch financial advice.");
  }
};

// Replaces simple getStockQuote with a search-capable version
export const findStockDetails = async (query: string): Promise<{ symbol: string; name: string; price: number; currency: string; exchangeRateToHKD: number } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for the stock ticker and company name for the query: "${query}".
                 Also find the current real-time stock price in its ORIGINAL trading currency.
                 Also provide the currency code (e.g. USD, HKD, JPY) and the approximate exchange rate to HKD.
                 
                 Return ONLY a raw JSON object with the following structure. Do not include markdown formatting or explanations.
                 {
                    "symbol": "TICKER",
                    "name": "Full Company Name",
                    "price": 123.45,
                    "currency": "USD",
                    "exchangeRateToHKD": 7.8
                 }
                 Example: {"symbol": "0700.HK", "name": "Tencent Holdings", "price": 405.20, "currency": "HKD", "exchangeRateToHKD": 1.0}
                 `,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT supported with googleSearch tool
      },
    });

    let jsonText = response.text || "{}";
    
    // Clean up markdown code blocks if present (e.g. ```json ... ```)
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(jsonText);
    
    if (data && data.symbol && data.price !== undefined) {
      return {
        symbol: data.symbol,
        name: data.name || data.symbol,
        price: data.price,
        currency: data.currency || 'HKD',
        exchangeRateToHKD: data.exchangeRateToHKD || 1.0
      };
    }
    return null;
  } catch (error) {
    console.error("Stock Search Error:", error);
    return null;
  }
};

export const getFinancialNews = async (): Promise<NewsItem> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 5 trending financial news stories from this week that are relevant to Hong Kong and Global markets.
                 Format the output as a Markdown list. 
                 For each item, provide a bold headline and a 1-sentence summary.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract grounding chunks for sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web)
      .filter((w: any) => w && w.uri && w.title);

    return {
      content: response.text || "No news available.",
      sources: sources,
    };
  } catch (error) {
    console.error("News Error:", error);
    throw new Error("Failed to fetch news.");
  }
};
