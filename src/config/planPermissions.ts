import { RenderConfig } from "@/types/promptRender";

export type PlanTier = "free" | "starter" | "pro";
export type PermissionCategory = "renderType" | "lighting" | "environments" | "surroundings" | "quality" | "camera";

export const PLAN_PROMPT_LIMITS: Record<PlanTier, number> = {
  free: 5,
  starter: 30,
  pro: 100,
};

export const OPTION_TO_PROMPT_KEY: Record<PermissionCategory, Record<string, string>> = {
  renderType: {
    exterior: "render_externo",
    interior: "render_interno",
    aerial: "render_aereo",
    detail: "render_detalhe",
    section: "render_corte",
    planta_humanizada: "planta_humanizada",
  },
  lighting: {
    daylight: "diurno",
    golden_hour: "entardecer",
    night: "noturno",
    cloudy: "nublado",
    rain: "chuva",
    dawn: "amanhecer",
  },
  environments: {
    pool: "piscina",
    garden: "jardim",
    gourmet: "area_gourmet",
    garage: "garagem",
    deck: "deck",
    scenic_lighting: "iluminacao_cenica",
    fog: "nevoa",
    water_mirror: "espelho_dagua",
  },
  surroundings: {
    residential: "entorno_residencial",
    commercial: "entorno_comercial",
    vegetation: "entorno_vegetacao",
    buildings: "entorno_predios",
    houses: "entorno_casas",
  },
  quality: {
    photorealistic: "fotorrealista",
    classic: "classico",
    atmospheric: "atmosferico",
    minimalist: "minimalista",
  },
  camera: {
    eye_level: "eye_level",
    worm_eye: "worm_eye",
    bird_eye: "bird_eye",
    dutch_angle: "dutch_angle",
    wide_angle: "wide_angle",
  },
};

const STARTER_AND_FREE_PERMISSIONS = {
  renderType: ["exterior", "interior", "aerial", "detail"],
  lighting: ["daylight", "golden_hour", "night", "cloudy"],
  environments: ["pool", "garden", "gourmet", "garage", "deck"],
  surroundings: [],
  quality: ["photorealistic"],
  camera: ["eye_level", "worm_eye"],
} as const;

const PRO_PERMISSIONS = {
  renderType: Object.keys(OPTION_TO_PROMPT_KEY.renderType),
  lighting: Object.keys(OPTION_TO_PROMPT_KEY.lighting),
  environments: Object.keys(OPTION_TO_PROMPT_KEY.environments),
  surroundings: Object.keys(OPTION_TO_PROMPT_KEY.surroundings),
  quality: Object.keys(OPTION_TO_PROMPT_KEY.quality),
  camera: Object.keys(OPTION_TO_PROMPT_KEY.camera),
} as const;

export const PLAN_PERMISSIONS: Record<PlanTier, Record<PermissionCategory, string[]>> = {
  free: {
    renderType: [...STARTER_AND_FREE_PERMISSIONS.renderType],
    lighting: [...STARTER_AND_FREE_PERMISSIONS.lighting],
    environments: [...STARTER_AND_FREE_PERMISSIONS.environments],
    surroundings: [...STARTER_AND_FREE_PERMISSIONS.surroundings],
    quality: [...STARTER_AND_FREE_PERMISSIONS.quality],
    camera: [...STARTER_AND_FREE_PERMISSIONS.camera],
  },
  starter: {
    renderType: [...STARTER_AND_FREE_PERMISSIONS.renderType],
    lighting: [...STARTER_AND_FREE_PERMISSIONS.lighting],
    environments: [...STARTER_AND_FREE_PERMISSIONS.environments],
    surroundings: [...STARTER_AND_FREE_PERMISSIONS.surroundings],
    quality: [...STARTER_AND_FREE_PERMISSIONS.quality],
    camera: [...STARTER_AND_FREE_PERMISSIONS.camera],
  },
  pro: {
    renderType: [...PRO_PERMISSIONS.renderType],
    lighting: [...PRO_PERMISSIONS.lighting],
    environments: [...PRO_PERMISSIONS.environments],
    surroundings: [...PRO_PERMISSIONS.surroundings],
    quality: [...PRO_PERMISSIONS.quality],
    camera: [...PRO_PERMISSIONS.camera],
  },
};

export function getEffectivePlan(basePlan: PlanTier | null, hasOneOffCredits: boolean): PlanTier {
  if (hasOneOffCredits) return "pro";
  return basePlan ?? "free";
}

export function isOptionAllowed(plan: PlanTier, category: PermissionCategory, optionId: string): boolean {
  return PLAN_PERMISSIONS[plan][category].includes(optionId);
}

export function getAllowedPromptKeysForPlan(plan: PlanTier): Set<string> {
  const keys = new Set<string>();

  (Object.keys(PLAN_PERMISSIONS[plan]) as PermissionCategory[]).forEach((category) => {
    PLAN_PERMISSIONS[plan][category].forEach((optionId) => {
      const mappedKey = OPTION_TO_PROMPT_KEY[category][optionId];
      if (mappedKey) keys.add(mappedKey);
    });
  });

  return keys;
}

export function validateSelectedPromptKeysByPlan(selectedKeys: string[], plan: PlanTier): {
  valid: boolean;
  blockedKeys: string[];
} {
  const allowed = getAllowedPromptKeysForPlan(plan);
  const blockedKeys = selectedKeys.filter((key) => !allowed.has(key));
  return {
    valid: blockedKeys.length === 0,
    blockedKeys,
  };
}

export function mapRenderConfigToPromptKeys(renderConfig: RenderConfig): string[] {
  const keys: string[] = [];

  const categoryMap: Array<[PermissionCategory, string | string[]]> = [
    ["renderType", renderConfig.renderType],
    ["lighting", renderConfig.lighting],
    ["environments", renderConfig.environments],
    ["surroundings", renderConfig.surroundings],
    ["quality", renderConfig.quality],
    ["camera", renderConfig.camera],
  ];

  categoryMap.forEach(([category, value]) => {
    if (Array.isArray(value)) {
      value.forEach((id) => {
        const mapped = OPTION_TO_PROMPT_KEY[category][id];
        if (mapped) keys.push(mapped);
      });
      return;
    }

    if (value) {
      const mapped = OPTION_TO_PROMPT_KEY[category][value];
      if (mapped) keys.push(mapped);
    }
  });

  return keys;
}
