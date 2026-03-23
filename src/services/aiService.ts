/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Wall } from "../types";
import { nanoid } from "nanoid";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateFloorPlan = async (prompt: string, currentWalls: Wall[]): Promise<Wall[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        text: `You are an expert architect. Based on the following prompt, generate or modify a floor plan. 
        The floor plan is represented as a list of walls. Each wall has a start point (x, y), an end point (x, y), a thickness, and a height.
        Walls can also have openings (windows or doors). Each opening has a type ('window' or 'door'), a position (0 to 1 along the wall), a width, a height, and a bottomHeight (height from the floor).
        
        The current floor plan has these walls: ${JSON.stringify(currentWalls)}.
        
        Prompt: ${prompt}
        
        Return the new list of walls in JSON format. Ensure the coordinates are within a reasonable range (e.g., 0 to 1000). 
        The default thickness is 10 and default height is 100.
        For doors, set bottomHeight to 0. For windows, set bottomHeight to a reasonable value (e.g., 30).
        `
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            start: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              },
              required: ["x", "y"]
            },
            end: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER }
              },
              required: ["x", "y"]
            },
            thickness: { type: Type.NUMBER },
            height: { type: Type.NUMBER },
            openings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["window", "door"] },
                  position: { type: Type.NUMBER, description: "0 to 1 along the wall" },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  bottomHeight: { type: Type.NUMBER }
                },
                required: ["type", "position", "width", "height", "bottomHeight"]
              }
            }
          },
          required: ["start", "end", "thickness", "height"]
        }
      }
    }
  });

  const wallsData = JSON.parse(response.text);
  return wallsData.map((w: any) => ({
    ...w,
    id: nanoid(),
    openings: w.openings?.map((o: any) => ({
      ...o,
      id: nanoid()
    }))
  }));
};

export const generateFloorPlanPreview = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A professional 3D architectural rendering of a floor plan based on this description: ${prompt}. 
          The style should be modern, clean, and high-end, showing a top-down or isometric view with realistic lighting and materials.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};

export interface MarketingCopy {
  title: string;
  description: string;
  callToAction: string;
}

export const generateMarketingCopy = async (walls: Wall[]): Promise<MarketingCopy> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        text: `You are a real estate marketing expert. Based on the following floor plan data, generate compelling marketing copy.
        The floor plan has ${walls.length} walls and ${walls.reduce((acc, w) => acc + (w.openings?.length || 0), 0)} openings (windows/doors).
        
        Floor Plan Details: ${JSON.stringify(walls)}
        
        Generate a catchy title, a persuasive description highlighting the layout's strengths, and a strong call to action.
        `
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          callToAction: { type: Type.STRING }
        },
        required: ["title", "description", "callToAction"]
      }
    }
  });

  return JSON.parse(response.text);
};
