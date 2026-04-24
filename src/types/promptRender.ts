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
  surroundings: string[];
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
  finalPromptId: string | null;
}

export interface Suggestion {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface Poll {
  id: string;
  created_by: string;
  question: string;
  is_active: boolean;
  created_at: string;
  ends_at: string | null;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  display_order: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface PollResult {
  poll_id: string;
  option_id: string;
  label: string;
  display_order: number;
  vote_count: number;
}
