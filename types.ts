
export interface Character {
  id: number;
  name: string;
  description: string;
  image: File | null;
  enabled: boolean;
  imageBase64: string | null;
  mimeType: string | null;
}

export interface SceneItem {
  description: string;
  timestamp: string; // Format: "MM:SS" or "00:00"
}

export interface GeneratedImage {
  src: string;
  prompt: string;
  filename: string;
  sceneIndex: number;
}

// Added '3:4' to supported aspect ratios as per Gemini API guidelines
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export const ANIMATION_STYLES = [
  "Stick Figure Animation",
  "Line Art / Sketch",
  "Cartoon / Comic",
  "Anime / Manga",
  "Digital Painting",
  "Pixel Art",
  "Vector Art",
  "Scribble Art",
  "Photorealistic / Realism",
  "Cinematic",
  "Macro Photography",
  "Black and White / Film Noir",
  "Oil Painting",
  "Watercolor",
  "Pastel / Chalk",
  "Sculpture / Claymation",
  "3D Render / CGI",
  "Low Poly",
  "Diorama",
  "Cyberpunk / Sci-Fi",
  "Impressionism",
  "Cubism",
  "Surrealism",
  "Pop Art",
  "Steampunk",
  "Vaporwave",
  "Gothic",
  "Renaissance",
  "Abstract",
  "Minimalist",
  "Flat Design",
  "Isometric",
  "Paper Cutout",
  "Collage",
  "Vintage 1950s",
  "Psychedelic",
  "Ukiyo-e / Japanese Woodblock",
  "Graffiti / Street Art",
  "Stained Glass",
  "Charcoal Drawing"
];

// New Types for History and Presets
export type GeneratorType = 'script' | 'voiceover' | 'thumbnail' | 'image_batch' | 'product' | 'youtube_analysis' | 'content_repurpose';

export interface HistoryItem {
  id: string;
  type: GeneratorType;
  timestamp: number;
  summary: string; // e.g., Title, Prompt snippet
  config: any; // Flexible object to store the parameters used
}

export interface Preset {
  id: string;
  name: string;
  type: GeneratorType;
  config: any;
}
