export interface ImageAnalysis {
  IMAGE_TYPE: string;
  ARCHITECTURAL_STYLE: string;
  ENVIRONMENT: string;
  MATERIALS: string;
  OBJECTS: string;
  LIGHTING: string;
  COLORS: string;
  TEXTURES: string;
  SPATIAL_COMPOSITION: string;
  ARCHITECTURAL_DETAILS: string;
  ATMOSPHERE: string;
  FULL_DESCRIPTION: string;
}

export interface RenderConfig {
  renderType: string;
  lighting: string;
  environments: string[];
  quality: string;
  camera: string;
}

export interface HumanizationConfig {
  enabled: boolean;
  addPeople: boolean;
  peopleDescription: string;
  addAnimals: boolean;
  animalDescription: string;
}

export interface PromptHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  imagePreview?: string;
}

export interface WizardState {
  currentStep: number;
  imageFile: File | null;
  imagePreview: string | null;
  analysis: ImageAnalysis | null;
  isAnalyzing: boolean;
  renderConfig: RenderConfig;
  humanization: HumanizationConfig;
  finalPrompt: string;
}
