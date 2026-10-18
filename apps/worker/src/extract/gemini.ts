import { GoogleGenAI } from "@google/genai";
import type { TokenUsage } from "./pricing.js";

export interface PdfJsonRequest {
  model: string;
  pdf: Uint8Array;
  instructions: string;
  prompt: string;
  jsonSchema: Record<string, unknown>;
}

export interface PdfJsonResponse {
  text: string;
  usage: TokenUsage;
}

/** One structured-output call with a PDF attached. Injected so tests can run without the API. */
export type GeneratePdfJson = (request: PdfJsonRequest) => Promise<PdfJsonResponse>;

/** Real implementation backed by the Gemini API (paid tier). */
export function geminiGenerator(apiKey: string): GeneratePdfJson {
  const ai = new GoogleGenAI({ apiKey });
  return async ({ model, pdf, instructions, prompt, jsonSchema }) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: Buffer.from(pdf).toString("base64") } },
            { text: prompt },
          ],
        },
      ],
      config: {
        systemInstruction: instructions,
        temperature: 0,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });

    const meta = response.usageMetadata;
    return {
      text: response.text ?? "",
      usage: {
        inputTokens: meta?.promptTokenCount ?? 0,
        outputTokens: (meta?.candidatesTokenCount ?? 0) + (meta?.thoughtsTokenCount ?? 0),
      },
    };
  };
}
