import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryRequest, StoryBoardResponse } from "../types";

// Define the response schema using the SDK's Type enum
const assetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    type: { type: Type.STRING, description: "Type of asset: Character, Location, Vehicle, or Prop" },
    description: { type: Type.STRING },
    imagePrompt: { type: Type.STRING, description: "A highly detailed Stable Diffusion/Midjourney prompt for this specific asset (character sheet or location design)." }
  },
  required: ["name", "type", "description", "imagePrompt"]
};

const dialogueSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    character: { type: Type.STRING },
    text: { type: Type.STRING }
  },
  required: ["character", "text"]
};

const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sceneNumber: { type: Type.INTEGER },
    location: { type: Type.STRING },
    actionDescription: { type: Type.STRING },
    lighting: { type: Type.STRING },
    cameraAngle: { type: Type.STRING },
    imagePrompt: { type: Type.STRING, description: "Full prompt for image generator. MUST explicitly include the action, time of day, lighting, and camera angle defined in the scene details." },
    animationPrompt: { type: Type.STRING, description: "Detailed prompt for video generators including movement descriptions AND the spoken dialogue with speaker name." },
    dialogue: { 
      type: Type.ARRAY, 
      items: dialogueSchema
    }
  },
  required: ["sceneNumber", "location", "actionDescription", "lighting", "cameraAngle", "imagePrompt", "animationPrompt", "dialogue"]
};

const storyBoardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    assets: { 
      type: Type.ARRAY, 
      items: assetSchema,
      description: "List of ALL important elements in the story: Characters, Main Locations, Important Vehicles, Key Props." 
    },
    scenes: { 
      type: Type.ARRAY, 
      items: sceneSchema 
    }
  },
  required: ["title", "summary", "assets", "scenes"]
};

export const generateStoryBoard = async (request: StoryRequest): Promise<StoryBoardResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const musicInstruction = request.noMusic 
    ? "PREPEND the exact phrase 'No background music. Use strong, clear cinematic sound effects only.' to the very beginning of every animationPrompt." 
    : "";

  const systemPrompt = `
    You are a world-class Prompt Engineer and Story Architect specializing in Animation and Film.
    Your task is to take a short story concept and expand it into a fully engineered production package.
    
    INPUTS:
    - Concept: ${request.concept}
    - Art Style: ${request.style}
    - Number of Scenes: ${request.sceneCount}
    - Story Language: ${request.language}
    - Aspect Ratio: ${request.aspectRatio}

    GUIDELINES:
    1. **Language Output Rules (CRITICAL)**:
       - The *Title*, *Summary*, *Asset Names*, *Asset Descriptions*, *Scene Location*, *Action Description*, *Lighting*, and *Camera Angle* MUST be in **ARABIC**.
       - The *Dialogue* MUST be in "${request.language}" (which is likely Arabic).
       - The *Image Prompts* and *Animation Prompts* MUST be in **ENGLISH** (as generative tools understand English best).

    2. **Asset Prompts**: 
       - Identify ALL key visual elements: Characters, Key Locations, Vehicles, Key Props.
       - Create a consistent, highly detailed visual prompt for EACH of these assets.
       - Assign a 'type' to each (e.g., "Character", "Location", "Vehicle", "Object").

    3. **Scene Details**: First, strictly define the 'actionDescription', 'lighting', and 'cameraAngle' in ARABIC.

    4. **Image Prompts (Scenes) - CRITICAL CONSISTENCY**: 
       - Write professional prompts optimized for Midjourney v6.
       - **TIME CONSISTENCY**: You MUST explicitly mention the time of day (e.g., 'Sunny Morning', 'Dark Night', 'Golden Hour', 'Blue Hour') in every single image prompt. Ensure that sequential scenes occurring at the same moment share the exact same time/lighting description.
       - Format: "[Subject/Action], [Location], [Time of Day], [Art Style Keywords], [Lighting], [Camera] --ar ${request.aspectRatio} --v 6.0"
       - Ensure the Art Style keywords match the English equivalent of: "${request.style}".

    5. **Animation Prompts**: 
       - ${musicInstruction}
       - Format: "[Detailed Movement Description]. [Speaker Name] says: '[Dialogue Text]'"
       - Example: "No background music. Use strong, clear cinematic sound effects only. The robot slowly turns its head. Robot says: 'Hello.'"

    OUTPUT:
    Return strictly valid JSON matching the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: storyBoardSchema,
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as StoryBoardResponse;
    } else {
      throw new Error("لم يتم إنشاء أي محتوى من Gemini.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};