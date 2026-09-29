
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { AspectRatio, SceneItem } from "../types";

type ReferenceImage = {
  data: string;
  mimeType: string;
};

export const IMAGE_MODELS = [
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4 (Preview)' },
  { id: 'imagen-3.0-generate-001', name: 'Imagen 3 (Stable)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Nano Banana)' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (High Quality)' },
];

export const TTS_MODELS = [
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS (Default)' }
];

export const generateImage = async (
  prompt: string,
  referenceImages: ReferenceImage[],
  animationStyle: string,
  aspectRatio: AspectRatio,
  model: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    if (model.includes('imagen')) {
        const fullPrompt = `${prompt}, in the style of ${animationStyle}`;
        const response = await ai.models.generateImages({
            model: model,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });
        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        throw new Error("No image data returned from Imagen.");
    } else {
        const fullPrompt = `${prompt}, in the style of ${animationStyle}.`;
        const imageParts = referenceImages.map(img => ({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType,
          },
        }));
        const textPart = { text: fullPrompt };
        const parts = [...imageParts, textPart];
        const config: any = {
            imageConfig: {
                aspectRatio: (['1:1', '3:4', '4:3', '9:16', '16:9'] as string[]).includes(aspectRatio) ? (aspectRatio as any) : '1:1',
            }
        };
        if (model === 'gemini-3-pro-image-preview') {
            config.imageConfig.imageSize = '1K';
        }
        const response: GenerateContentResponse = await ai.models.generateContent({
          model: model, 
          contents: { parts: parts },
          config: config,
        });
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
            return part.inlineData.data;
          }
        }
        throw new Error("No image data found in the AI response.");
    }
  } catch (error) {
    console.error("Error in generateImage:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Failed to generate image using ${model}. Reason: ${errorMessage}`);
  }
};

interface ScriptGenerationParams {
  scriptType: 'long' | 'short' | 'both';
  title: string;
  niche: string;
  tone: string;
  audience: string;
  artStyle: string;
  sceneCount: number;
  description?: string;
  duration?: string;
  shortDuration?: string;
  ctaIntro?: string[];
  ctaOutro?: string[];
  ctaShortIntro?: string[];
  ctaShortOutro?: string[];
  highRetention?: boolean;
  excludeIntro?: boolean;
  excludeOutro?: boolean;
}

export const generateScript = async ({
  scriptType,
  title,
  niche,
  tone,
  audience,
  artStyle,
  sceneCount,
  description,
  duration,
  ctaIntro = [],
  ctaOutro = [],
  ctaShortIntro = [],
  ctaShortOutro = [],
  highRetention = false,
  excludeIntro = false,
  excludeOutro = false
}: ScriptGenerationParams): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let scriptTypeInstruction = '';
    let durationInstruction = '';
    let formattingRules = '';
    
    if (duration) {
        durationInstruction = `\n      **Target Duration:** Approx ${duration} minutes.`;
    }
    
    let extraContext = "";
    if (description) {
        extraContext += `\n      **Context:** ${description}`;
    }

    const retentionStrategy = highRetention ? `
    **HIGH RETENTION STRATEGY (CRITICAL):**
    - Use "Open Loops": Pose questions or hint at secrets that are only revealed at the very end.
    - Pattern Interrupts: Change the narrative pace frequently. Use shocking facts or relatable cliffhangers between segments.
    - Visual Dynamism: Ensure [VISUAL] prompts change every 5-8 seconds.
    - Targeting: Speak directly to the interests of the ${audience} audience.
    ` : '';

    const introLogic = excludeIntro ? `
    **SKIP INTRO (STRICT):**
    - DO NOT include greetings, "In this video," or channel names.
    - START IMMEDIATELY with a pattern-interrupting hook.
    ` : '';

    const outroLogic = excludeOutro ? `
    **SKIP OUTRO (STRICT):**
    - DO NOT include summaries or "Thanks for watching."
    - END ABRUPTLY on a high-impact statement.
    ` : '';

    const joinCtas = (list: string[]) => list.length > 0 ? list.join(". ") : "";

    if (scriptType === 'both') {
         scriptTypeInstruction = `a content package containing visuals, a long-form script, and a short-form script.`;
         const lIntro = joinCtas(ctaIntro);
         const lOutro = joinCtas(ctaOutro);
         const sIntro = joinCtas(ctaShortIntro);
         const sOutro = joinCtas(ctaShortOutro);

         const longCtaIntro = (lIntro && !excludeIntro) ? `- Start long-form script with: "${lIntro}"` : '';
         const longCtaOutro = (lOutro && !excludeOutro) ? `- End long-form script with: "${lOutro}"` : '';
         const shortCtaIntro = (sIntro && !excludeIntro) ? `- Start short-form script with: "${sIntro}"` : '';
         const shortCtaOutro = (sOutro && !excludeOutro) ? `- End short-form script with: "${sOutro}"` : '';

         formattingRules = `
         1. **Visuals**: Start each line with "[VISUAL]:".
         2. **Long Form Script**: Start each line with "[VOICEOVER-LONG]:".
            ${longCtaIntro}
            ${longCtaOutro}
         3. **Short Form Script**: Start each line with "[VOICEOVER-SHORT]:".
            ${shortCtaIntro}
            ${shortCtaOutro}
         `;
    } else {
        const typeLabel = scriptType === 'long' ? 'long-form' : 'short-form';
        scriptTypeInstruction = `a ${typeLabel} video script.`;
        const activeIntro = scriptType === 'long' ? joinCtas(ctaIntro) : joinCtas(ctaShortIntro);
        const activeOutro = scriptType === 'long' ? joinCtas(ctaOutro) : joinCtas(ctaShortOutro);
        
        const singleCtaIntro = (activeIntro && !excludeIntro) ? `- Start script with: "${activeIntro}"` : '';
        const singleCtaOutro = (activeOutro && !excludeOutro) ? `- End script with: "${activeOutro}"` : '';
        formattingRules = `
         1. **Visuals**: Start each line with "[VISUAL]:".
         2. **Voiceover**: Start each line with "[VOICEOVER]:".
            ${singleCtaIntro}
            ${singleCtaOutro}
         `;
    }

    const prompt = `
      You are a world-class YouTube Creative Director.
      **Details:**
      - **Idea:** ${title}
      - **Niche:** ${niche}
      - **Tone:** ${tone}
      - **Audience:** ${audience}
      - **Art Style:** ${artStyle}
      - **Output Type:** ${scriptTypeInstruction}${extraContext}${durationInstruction}

      ${retentionStrategy}
      ${introLogic}
      ${outroLogic}

      **Formatting Rules:**
      ${formattingRules}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error in generateScript:", error);
    throw new Error(`Gemini API call failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
};

export const generateThumbnailConcept = async (title: string, script?: string, highCTR: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const ctrLogic = highCTR ? `
    **MAXIMIZE CLICK-THROUGH RATE (CTR) STRATEGY:**
    - Focus on a single, powerful focal point.
    - Create a "Curiosity Gap": Show a result but not the cause.
    - Emotional Trigger: Extreme facial expressions, dramatic lighting, or intense action.
    - High Contrast: Use vibrant, high-contrast imagery.
    ` : '';

    const prompt = `
      You are a Viral Thumbnail Designer. Describe a powerful visual concept (graphic/photorealistic description) for a YouTube thumbnail about: "${title}".
      ${script ? `Context for inspiration: ${script.substring(0, 1000)}...` : ''}
      ${ctrLogic}
      
      STRICT REQUIREMENT - ZERO TOLERANCE: 
      - Return ONLY the visual description of the scene.
      - DO NOT include ANY text, letters, signage, or written words in the visual prompt description. 
      - The image itself must be purely graphical/photorealistic without any AI-generated text baked into the pixels.
      - Limit the description to under 50 words.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) { return ""; }
};

export const generateThumbnailOverlayText = async (title: string, description?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `
      You are a YouTube Growth Strategist specializing in High-CTR Packaging.
      Generate a text overlay hook for a thumbnail based on the topic: "${title}".
      
      STRICT CTR STRATEGY RULES:
      1. Must be under 5 words.
      2. The text MUST either:
         a) CONTRADICT a commonly held belief (e.g., "Success is Luck" or "Eating Healthy is Deadly")
         b) SPARK intense curiosity (e.g., "The Secret Nobody Tells You" or "It Happened So Fast...")
      3. Use emotional, high-energy language.
      4. Return ONLY the final text. No quotes, no explanation.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text.trim().replace(/^"|"$/g, '');
  } catch (error) { return ""; }
};

export const parseScriptForScenes = async (script: string): Promise<SceneItem[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `Extract visual scenes from the text below as JSON Array: [{ "description": "...", "timestamp": "MM:SS" }]. \n\nInput Text:\n${script.substring(0, 10000)}...`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            timestamp: { type: Type.STRING }
                        },
                        required: ['description', 'timestamp']
                    }
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error in parseScriptForScenes:", error);
        return [];
    }
};

export interface VoiceOption { id: string; gender: 'Male' | 'Female'; description: string; }
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'achernar', gender: 'Male', description: 'Steady, calm, informative' },
  { id: 'achird', gender: 'Male', description: 'Bright, clear, energetic' },
  { id: 'algenib', gender: 'Male', description: 'Deep, resonant, authoritative' },
  { id: 'alnilam', gender: 'Male', description: 'Low-pitched, grounded, serious' },
  { id: 'charon', gender: 'Male', description: 'Deep, mysterious, compelling' },
  { id: 'enceladus', gender: 'Male', description: 'Strong, bold, intense' },
  { id: 'fenrir', gender: 'Male', description: 'Rough, gritty, dramatic' },
  { id: 'gacrux', gender: 'Male', description: 'Warm, friendly, conversational' },
  { id: 'iapetus', gender: 'Male', description: 'Rich, commanding, narrator-style' },
  { id: 'orus', gender: 'Male', description: 'Balanced, versatile, natural' },
  { id: 'puck', gender: 'Male', description: 'Playful, mischievous, lively' },
  { id: 'rasalgethi', gender: 'Male', description: 'Mature, smooth, classic' },
  { id: 'schedar', gender: 'Male', description: 'Clear, articulate, professional' },
  { id: 'zubenelgenubi', gender: 'Male', description: 'Distinctive, character-rich' },
  { id: 'algieba', gender: 'Female', description: 'Warm, inviting, friendly' },
  { id: 'aoede', gender: 'Female', description: 'Expressive, confident, storytelling' },
  { id: 'autonoe', gender: 'Female', description: 'Soft, gentle, whispering' },
  { id: 'callirrhoe', gender: 'Female', description: 'Bright, cheerful, young' },
  { id: 'despina', gender: 'Female', description: 'Calm, soothing, relaxed' },
  { id: 'erinome', gender: 'Female', description: 'Deep, textured, mature' },
  { id: 'kore', gender: 'Female', description: 'Clear, crisp, natural' },
  { id: 'laomedeia', gender: 'Female', description: 'Elegant, sophisticated, smooth' },
  { id: 'leda', gender: 'Female', description: 'Mature, warm, reassuring' },
  { id: 'pulcherrima', gender: 'Female', description: 'Bright, distinct, engaging' },
  { id: 'sadachbia', gender: 'Female', description: 'Soft, ambient, ethereal' },
  { id: 'sulafat', gender: 'Female', description: 'Rich, resonant, strong' },
  { id: 'vindemiatrix', gender: 'Female', description: 'Classic, clear, articulate' },
  { id: 'zephyr', gender: 'Female', description: 'Breathy, gentle, airy' },
];

export const prepareScriptForVoiceover = async (script: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional voiceover punctuation assistant. 
      Your ONLY task is to add commas and periods to the input script to improve its audio delivery rhythm and indicate where the speaker should breathe.
      
      STRICT RULES - FAILURE TO FOLLOW THESE WILL RESULT IN SYSTEM ERROR:
      1. Do NOT remove ANY words from the script. Zero words removed.
      2. Do NOT add ANY new words.
      3. Do NOT change the order of any words.
      4. Do NOT replace words with synonyms.
      5. The output MUST contain EVERY SINGLE WORD from the input, in the EXACT same order.
      6. Only add commas (,) for short pauses and periods (.) for full breaths.
      7. Maintain the tone and energy of the original text.
      
      Script to format:
      ${script}`,
    });
    return response.text.trim();
  } catch (error) { return script; }
};

export const generateVoiceover = async (script: string, voice: string, model: string = 'gemini-2.5-flash-preview-tts'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const cleanScript = script
      .replace(/[^\x20-\x7E\s.,!?;:'"()]/g, "") 
      .replace(/\s+/g, " ")                    
      .replace(/([.,!?;:])\1+/g, "$1")         
      .trim();

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: cleanScript }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice.toLowerCase() } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error(`No audio data returned.`);
    return base64Audio;
  } catch (error) { console.error("Error in generateVoiceover:", error); throw error; }
};

export interface VideoIdea { title: string; description: string; }

export const brainstormVideoIdeas = async (
    niche: string, 
    tone: string, 
    targetAudience: string, 
    duration: string, 
    aspectRatio: string, 
    artStyle: string, 
    customDescription: string,
    highRetention: boolean = false,
    excludeIntro: boolean = false,
    excludeOutro: boolean = false
): Promise<VideoIdea[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const strategyText = highRetention ? "Optimize for High-Retention: Focus on curiosity-driven concepts, open loops, and psychological hooks." : "";
        const introText = excludeIntro ? "Focus on 'Pattern Interrupt' starts: Every idea should assume the video starts immediately with the hook." : "";
        const outroText = excludeOutro ? "Focus on 'Cliffhanger' endings: Every idea should assume an abrupt, impactful ending." : "";

        const prompt = `
            Generate 10 viral video ideas. 
            Niche: ${niche}, Tone: ${tone}, Audience: ${targetAudience}, Art Style: ${artStyle}.
            ${strategyText}
            ${introText}
            ${outroText}
            ${customDescription ? `Additional Context: ${customDescription}` : ''}
            
            Return a JSON array: [{ "title": "...", "description": "..." }]
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'description'] }
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) { throw error; }
};

export const generateDigitalProduct = async (title: string, productTypes: string[], audience: string, tone: string, writingStyle: string, description: string, numPages: string, includeInfographics: boolean): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `Create a digital product titled "${title}". Types: ${productTypes.join(', ')}. Audience: ${audience}. Tone: ${tone}. Style: ${writingStyle}. Context: ${description}.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return response.text.trim();
    } catch (error) { throw error; }
};

export const generateSEOProductDescription = async (title: string, contentPreview: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `Write SEO-optimized product description for "${title}". Source: ${contentPreview.substring(0, 2000)}.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return response.text.trim();
    } catch (error) { throw error; }
};

export const analyzeYouTubeChannel = async (url: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `Analyze YouTube channel: ${url}. JSON: name, niche, audience, tone, pillars, visualStyle.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING }, niche: { type: Type.STRING }, audience: { type: Type.STRING }, tone: { type: Type.STRING }, pillars: { type: Type.ARRAY, items: { type: Type.STRING } }, visualStyle: { type: Type.STRING } },
                    required: ['name', 'niche', 'audience', 'tone', 'pillars', 'visualStyle']
                }
            }
        });
        let result = JSON.parse(response.text.trim());
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            result.sources = groundingChunks.filter((chunk: any) => chunk.web).map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));
        }
        return result;
    } catch (error) { throw new Error("Could not analyze channel."); }
};

export const repurposeContent = async (
    source: string, 
    niches: string, 
    tones: string, 
    audiences: string, 
    artStyles: string, 
    scriptType: 'long' | 'short' | 'both', 
    sceneCount: number, 
    duration: string, 
    shortDuration?: string, 
    ctaIntro?: string[], 
    ctaOutro?: string[], 
    ctaShortIntro?: string[], 
    ctaShortOutro?: string[], 
    highRetention?: boolean, 
    excludeIntro?: boolean, 
    excludeOutro?: boolean
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const retentionStr = highRetention ? "Utilize a high-retention strategy with open loops and pattern interrupts." : "";
        const introStr = excludeIntro ? "STRICTLY START with a shocking hook. Exclude all greetings." : "";
        const outroStr = excludeOutro ? "STRICTLY END ABRUPTLY. Exclude all summaries." : "";

        const joinCtas = (list: string[]) => list.length > 0 ? list.join(". ") : "";

        const lIntro = joinCtas(ctaIntro || []);
        const lOutro = joinCtas(ctaOutro || []);
        const sIntro = joinCtas(ctaShortIntro || []);
        const sOutro = joinCtas(ctaShortOutro || []);

        const longCtaIntro = (lIntro && !excludeIntro) ? `- Start long-form script with: "${lIntro}"` : '';
        const longCtaOutro = (lOutro && !excludeOutro) ? `- End long-form script with: "${lOutro}"` : '';
        const shortCtaIntro = (sIntro && !excludeIntro) ? `- Start short-form script with: "${sIntro}"` : '';
        const shortCtaOutro = (sOutro && !excludeOutro) ? `- End short-form script with: "${sOutro}"` : '';

        const prompt = `
            You are a creative mastermind. Repurpose this source material into a viral ${scriptType} video package.
            Source: ${source}
            Niche: ${niches}, Tone: ${tones}, Audience: ${audiences}, Art Style: ${artStyles}.
            Target: ${duration} minutes, with approx ${sceneCount} visual scenes.
            
            ${retentionStr}
            ${introStr}
            ${outroStr}
            ${longCtaIntro}
            ${longCtaOutro}
            ${shortCtaIntro}
            ${shortCtaOutro}

            STRICT OUTPUT FORMAT (MUST USE THESE TAGS):
            [TITLE] Viral Title Here [/TITLE]
            [DESCRIPTION] SEO-optimized description [/DESCRIPTION]
            [VISUALS]
            [VISUAL]: Scene 1 detailed description...
            ... (output approx ${sceneCount} scenes)
            [/VISUALS]
            [SCRIPT]
            [VOICEOVER]: Full narrative text here...
            [/SCRIPT]
        `;
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        });
        return response.text.trim();
    } catch (error) { throw error; }
};
