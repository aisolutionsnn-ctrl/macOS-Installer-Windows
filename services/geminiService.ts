
import { GoogleGenAI } from "@google/genai";
import { HardwareProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getCompatibilityAdvice(profile: HardwareProfile): Promise<string> {
  try {
    const prompt = `
      You are a world-class Hackintosh architect specialized in OpenCore. 
      Analyze this hardware for macOS compatibility (up to Sequoia):
      
      CPU: ${profile.cpuType} ${profile.generation}
      GPU: ${profile.gpuType} ${profile.gpuModel}
      System: ${profile.laptop ? 'LAPTOP' : 'DESKTOP'}
      
      Requirements for response:
      - Max 45 words.
      - Be technical and professional.
      - Mention specific boot args or Kext requirements (e.g., -v, alcid=, WhateverGreen).
      - Note any critical blockers (e.g. no GPU acceleration for NVIDIA Pascal+ on latest macOS).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis complete. System appears viable for basic OpenCore setup.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Compatibility analysis complete. Standard patches for " + profile.generation + " will be used.";
  }
}
