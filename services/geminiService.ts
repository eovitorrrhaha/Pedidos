
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedOrderData {
  customerName?: string;
  contact?: string;
  instrumentType?: string;
  brand?: string;
  model?: string;
  services?: { description: string; price: number }[];
  totalPrice?: number;
  notes?: string;
}

export const extractOrderFromImage = async (base64Image: string): Promise<ExtractedOrderData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image,
              },
            },
            {
              text: "Extraia informações desta nota de serviço de luthieria escrita à mão. Retorne os dados como JSON estruturado incluindo nome do cliente, contato, tipo de instrumento, marca, modelo, lista de serviços com preços e quaisquer observações adicionais. Se um campo não for encontrado, deixe-o nulo ou vazio. Responda em Português do Brasil."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            contact: { type: Type.STRING },
            instrumentType: { type: Type.STRING },
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            services: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                }
              }
            },
            totalPrice: { type: Type.NUMBER },
            notes: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (jsonText) {
      return JSON.parse(jsonText) as ExtractedOrderData;
    }
    return null;
  } catch (error) {
    console.error("Erro OCR:", error);
    return null;
  }
};
