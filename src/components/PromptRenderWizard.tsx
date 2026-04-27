import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Upload, X, Image as ImageIcon, Home, LampDesk, Plane, ZoomIn, Scissors, LayoutGrid, Sun, Sunset, Moon, Cloud, CloudRain, Sunrise, Sparkles, Columns3, Camera, Users, PawPrint, Plus, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { analyzeImage } from "@/services/aiService";
import { ImageAnalysis } from "@/types/promptRender";
import { supabase } from "@/integrations/supabase/client";

type RenderTypeId =
  | "render_externo"
  | "render_interno"
  | "render_aereo"
  | "render_detalhe"
  | "render_corte"
  | "planta_humanizada";

type LightingId = "diurno" | "entardecer" | "noturno" | "nublado" | "chuva" | "amanhecer";

type QualityId = "fotorrealista" | "classico" | "atmosferico" | "minimalista";

type EnvironmentElementId =
  | "piscina"
  | "jardim"
  | "area_gourmet"
  | "garagem"
  | "deck"
  | "iluminacao_cenica"
  | "nevoa"
  | "espelho_dagua";

type SurroundingId = "residencial" | "comercial" | "vegetacao" | "predios" | "casas";

type CameraId = "nivel_olho" | "olho_verme" | "olho_passaro" | "angulo_holandes" | "angulo_largo";

type InternalRoomId =
  | "quarto_principal"
  | "quarto_hospedes"
  | "banheiro"
  | "lavabo"
  | "sala_estar"
  | "sala_jantar"
  | "cozinha"
  | "copa"
  | "home_theater"
  | "escritorio"
  | "biblioteca"
  | "area_jogos"
  | "varanda"
  | "terraco"
  | "area_servico";

type HumanizationItem = {
  type: "Pessoa" | "Animal";
  physicalDescription: string;
  actionPosition: string;
};

type PromptRenderState = {
  stepIndex: number;
  imageFile: File | null;
  imagePreview: string | null;
  analysis: ImageAnalysis | null;
  sceneDescription: string;
  renderType: RenderTypeId | "";
  lighting: LightingId | "";
  quality: QualityId | "";
  environmentElements: EnvironmentElementId[];
  surroundings: SurroundingId[];
  camera: CameraId | "";
  internalRooms: InternalRoomId[];
  humanizationEnabled: boolean;
  humanizationItems: HumanizationItem[];
  finalPrompt: string;
};

function normalizeText(v: unknown): string {
  return typeof v === "string" ? v.toLowerCase() : "";
}

function getDetectedImageType(analysis: ImageAnalysis | null): string {
  const anyAnalysis = analysis as unknown as Record<string, unknown> | null;
  return normalizeText(anyAnalysis?._detected_image_type || anyAnalysis?.IMAGE_TYPE);
}

function guessSceneKind(analysis: ImageAnalysis | null): "interior" | "exterior" | "unknown" {
  const anyAnalysis = analysis as unknown as Record<string, unknown> | null;
  const imageType = normalizeText(anyAnalysis?.IMAGE_TYPE);
  const full = normalizeText(anyAnalysis?.FULL_DESCRIPTION);

  if (imageType.includes("floor plan") || imageType.includes("section") || imageType.includes("elevation")) return "unknown";

  if (full.includes("interior") || full.includes("inside") || imageType.includes("interior")) return "interior";
  if (full.includes("exterior") || full.includes("facade") || full.includes("outdoor") || imageType.includes("exterior")) return "exterior";

  return "unknown";
}

function guessHasExteriorView(analysis: ImageAnalysis | null): boolean {
  const anyAnalysis = analysis as unknown as Record<string, unknown> | null;
  const full = normalizeText(anyAnalysis?.FULL_DESCRIPTION);
  return (
    full.includes("window") ||
    full.includes("glazing") ||
    full.includes("external view") ||
    full.includes("vista")
  );
}

function mapSurroundingToKey(id: SurroundingId): string {
  if (id === "residencial") return "entorno_residencial";
  if (id === "comercial") return "entorno_comercial";
  if (id === "vegetacao") return "entorno_vegetacao";
  if (id === "predios") return "entorno_predios";
  return "entorno_casas";
}

function mapCameraToKey(id: CameraId): string {
  if (id === "nivel_olho") return "eye_level";
  if (id === "olho_verme") return "worm_eye";
  if (id === "olho_passaro") return "bird_eye";
  if (id === "angulo_holandes") return "dutch_angle";
  return "wide_angle";
}

function mapInternalRoomToKey(id: InternalRoomId): string {
  // Estrutura preparada para você inserir os prompts no promptsConfig.ts futuramente.
  // As chaves abaixo ainda podem não existir no backend — a Edge Function ignora chaves desconhecidas.
  return `ambiente_${id}`;
}

function buildSelectedKeys(state: PromptRenderState): string[] {
  const keys: string[] = [];

  if (state.renderType) keys.push(state.renderType);
  if (state.lighting) keys.push(state.lighting);
  if (state.quality) keys.push(state.quality);

  for (const env of state.environmentElements) keys.push(env);
  for (const s of state.surroundings) keys.push(mapSurroundingToKey(s));
  if (state.camera) keys.push(mapCameraToKey(state.camera));

  if (state.renderType === "render_interno") {
    for (const r of state.internalRooms) keys.push(mapInternalRoomToKey(r));
  }

  return keys;
}

function buildHumanizationText(state: PromptRenderState): string {
  if (!state.humanizationEnabled) return "";
  if (state.humanizationItems.length === 0) return "";

  return state.humanizationItems
    .map((item) => {
      const p1 = `${item.type}: ${item.physicalDescription}`.trim();
      const p2 = item.actionPosition ? `Ação / Posição: ${item.actionPosition}` : "";
      return [p1, p2].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

type Option<T extends string> = {
  id: T;
  label: string;
  desc: string;
  icon: ReactNode;
};

const RENDER_TYPE_OPTIONS: Option<RenderTypeId>[] = [
  {
    id: "render_externo",
    label: "Render Externo",
    desc: "Visualização da fachada e volume externo do edifício. Ideal para apresentar a arquitetura no contexto do entorno.",
    icon: <Home className="w-4 h-4" />,
  },
  {
    id: "render_interno",
    label: "Render Interno",
    desc: "Visualização dos ambientes internos. Captura atmosfera, mobiliário e acabamentos.",
    icon: <LampDesk className="w-4 h-4" />,
  },
  {
    id: "render_aereo",
    label: "Render Aéreo",
    desc: "Vista aérea ou de drone. Excelente para mostrar implantação, cobertura e relação com o terreno.",
    icon: <Plane className="w-4 h-4" />,
  },
  {
    id: "render_detalhe",
    label: "Render de Detalhe",
    desc: "Foco em elemento específico da edificação: esquadria, revestimento, estrutura, etc.",
    icon: <ZoomIn className="w-4 h-4" />,
  },
  {
    id: "render_corte",
    label: "Render de Corte",
    desc: "Seção transversal ou longitudinal expondo a organização interna dos espaços.",
    icon: <Scissors className="w-4 h-4" />,
  },
  {
    id: "planta_humanizada",
    label: "Planta Humanizada",
    desc: "Vista superior (planta baixa) com mobiliário, pessoas e vegetação inseridos para humanizar a leitura.",
    icon: <LayoutGrid className="w-4 h-4" />,
  },
];

const LIGHTING_OPTIONS: Option<LightingId>[] = [
  { id: "diurno", label: "Diurno", desc: "Luz solar plena, céu claro. Máxima nitidez e contraste.", icon: <Sun className="w-4 h-4" /> },
  { id: "entardecer", label: "Entardecer", desc: "Luz dourada e sombras longas. Atmosfera quente e dramática.", icon: <Sunset className="w-4 h-4" /> },
  { id: "noturno", label: "Noturno", desc: "Cena iluminada artificialmente. Valoriza iluminação cenográfica e reflexos.", icon: <Moon className="w-4 h-4" /> },
  { id: "nublado", label: "Nublado", desc: "Luz difusa e homogênea. Ideal para destacar texturas e cores.", icon: <Cloud className="w-4 h-4" /> },
  { id: "chuva", label: "Chuva", desc: "Superfícies molhadas, reflexos e névoa leve. Atmosfera cinematográfica.", icon: <CloudRain className="w-4 h-4" /> },
  { id: "amanhecer", label: "Amanhecer", desc: "Tons lilás e azulados com luz incipiente. Tranquilidade e frescor.", icon: <Sunrise className="w-4 h-4" /> },
];

const QUALITY_OPTIONS: Option<QualityId>[] = [
  {
    id: "fotorrealista",
    label: "Fotorrealista",
    desc: "Máxima fidelidade à realidade. Texturas, iluminação e reflexos com altíssimo nível de detalhe.",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: "classico",
    label: "Clássico",
    desc: "Estilo refinado e equilibrado, próximo à renderização tradicional arquitetônica.",
    icon: <Columns3 className="w-4 h-4" />,
  },
  {
    id: "atmosferico",
    label: "Atmosférico",
    desc: "Ênfase na ambiência e emoção. Uso de névoa e luz difusa para criar clima poético.",
    icon: <Cloud className="w-4 h-4" />,
  },
  {
    id: "minimalista",
    label: "Minimalista",
    desc: "Composição limpa, paleta neutra e ausência de elementos supérfluos.",
    icon: <LayoutGrid className="w-4 h-4" />,
  },
];

const ENVIRONMENT_ELEMENTS: { id: EnvironmentElementId; label: string; desc: string; icon: ReactNode }[] = [
  { id: "piscina", label: "Piscina", desc: "Adiciona espelho d'água com reflexos e área molhada.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "jardim", label: "Jardim / Paisagismo", desc: "Vegetação planejada, canteiros e arbustos.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "area_gourmet", label: "Área Gourmet", desc: "Espaço coberto com churrasqueira e mobiliário externo.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "garagem", label: "Garagem", desc: "Área de estacionamento coberta ou descoberta.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "deck", label: "Deck de madeira", desc: "Piso elevado em madeira ou composite em áreas externas.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "iluminacao_cenica", label: "Iluminação Cênica", desc: "Spots, balizadores e iluminação artificial de destaque.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "nevoa", label: "Névoa / Neblina", desc: "Efeito atmosférico de névoa leve sobre a cena.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "espelho_dagua", label: "Espelho d’água", desc: "Lâmina de água plana com reflexo especular.", icon: <Sparkles className="w-4 h-4" /> },
];

const SURROUNDING_OPTIONS: { id: SurroundingId; label: string; desc: string; icon: ReactNode }[] = [
  { id: "residencial", label: "Residencial", desc: "Casas e edificações de baixo gabarito ao fundo.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "comercial", label: "Comercial", desc: "Fachadas comerciais, lojas e movimento urbano.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "vegetacao", label: "Vegetação", desc: "Árvores, parques e maciços vegetais dominantes.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "predios", label: "Prédios", desc: "Skyline com edifícios de médio e alto padrão.", icon: <Sparkles className="w-4 h-4" /> },
  { id: "casas", label: "Casas", desc: "Conjunto de residências unifamiliares.", icon: <Sparkles className="w-4 h-4" /> },
];

const CAMERA_OPTIONS: { id: CameraId; label: string; desc: string; icon: ReactNode }[] = [
  { id: "nivel_olho", label: "Nível do olho", desc: "Altura de 1,5 m a 1,7 m. Perspectiva humana natural e imersiva.", icon: <Camera className="w-4 h-4" /> },
  { id: "olho_verme", label: "Olho de verme", desc: "Câmera rente ao solo. Monumentaliza e cria grandiosidade.", icon: <Camera className="w-4 h-4" /> },
  { id: "olho_passaro", label: "Olho de pássaro", desc: "Vista elevada com inclinação suave. Mostra volumetria e entorno.", icon: <Camera className="w-4 h-4" /> },
  { id: "angulo_holandes", label: "Ângulo holandês", desc: "Câmera levemente inclinada. Cria dinamismo e tensão visual.", icon: <Camera className="w-4 h-4" /> },
  { id: "angulo_largo", label: "Ângulo largo", desc: "Lente grande-angular. Amplia o campo de visão e inclui mais contexto.", icon: <Camera className="w-4 h-4" /> },
];

const INTERNAL_ROOMS: { id: InternalRoomId; label: string; promptTexto: string }[] = [
  { id: "quarto_principal", label: "Quarto Principal", promptTexto: "" },
  { id: "quarto_hospedes", label: "Quarto de hóspedes", promptTexto: "" },
  { id: "banheiro", label: "Banheiro", promptTexto: "" },
  { id: "lavabo", label: "Lavabo", promptTexto: "" },
  { id: "sala_estar", label: "Sala de estar", promptTexto: "" },
  { id: "sala_jantar", label: "Sala de jantar", promptTexto: "" },
  { id: "cozinha", label: "Cozinha", promptTexto: "" },
  { id: "copa", label: "Copa / Área de café", promptTexto: "" },
  { id: "home_theater", label: "Home theater", promptTexto: "" },
  { id: "escritorio", label: "Escritório", promptTexto: "" },
  { id: "biblioteca", label: "Biblioteca", promptTexto: "" },
  { id: "area_jogos", label: "Área de jogos", promptTexto: "" },
  { id: "varanda", label: "Varanda", promptTexto: "" },
  { id: "terraco", label: "Terraço", promptTexto: "" },
  { id: "area_servico", label: "Área de serviço", promptTexto: "" },
];

function StepTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center mb-10">
      <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 mb-2" style={{ lineHeight: 1.1 }}>
        {title}
      </h2>
      {description && <p className="text-muted-foreground font-mono text-sm">{description}</p>}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Avançar",
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex justify-center gap-3 mt-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg font-mono text-sm font-medium border transition-transform duration-200 active:scale-[0.97]"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          Voltar
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={Boolean(nextDisabled)}
        className="gold-gradient px-6 py-2.5 rounded-lg font-mono text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97] disabled:opacity-60"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  label,
  desc,
  icon,
  disabled,
  tooltip,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
  icon: ReactNode;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? tooltip : undefined}
      className={`render-option text-left ${selected ? "selected" : ""} ${disabled ? "render-option-disabled" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div className="min-w-0">
          <div className="font-mono text-xs font-medium text-foreground">{label}</div>
          <div className="font-mono text-[10px] text-muted-foreground leading-tight">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function MultiOptionCard({
  selected,
  onClick,
  label,
  icon,
  disabled,
  tooltip,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? tooltip : undefined}
      className={`render-option flex-row gap-2 p-3 ${selected ? "selected" : ""} ${disabled ? "render-option-disabled" : ""}`}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-mono text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}

export default function PromptRenderWizard() {
  const [state, setState] = useState<PromptRenderState>({
    stepIndex: 0,
    imageFile: null,
    imagePreview: null,
    analysis: null,
    sceneDescription: "",
    renderType: "",
    lighting: "",
    quality: "",
    environmentElements: [],
    surroundings: [],
    camera: "",
    internalRooms: [],
    humanizationEnabled: false,
    humanizationItems: [],
    finalPrompt: "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const sceneDescriptionTouchedRef = useRef(false);

  const update = useCallback((partial: Partial<PromptRenderState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const hasExteriorView = useMemo(() => guessHasExteriorView(state.analysis), [state.analysis]);
  const sceneKind = useMemo(() => guessSceneKind(state.analysis), [state.analysis]);
  const detectedImageType = useMemo(() => getDetectedImageType(state.analysis), [state.analysis]);

  const totalPages = useMemo(() => {
    // Total de páginas do configurador (sem contar a página final do prompt gerado).
    // Página 9 é condicional (ambientes internos).
    return state.renderType === "render_interno" ? 10 : 9;
  }, [state.renderType]);

  const stepLabel = useMemo(() => {
    // Labels são só para o resumo/progresso, sem alterar layout global.
    const base = [
      "Upload da imagem",
      "Detalhes da imagem",
      "Tipo de render",
      "Período do dia / Iluminação",
      "Qualidade / Estilo de render",
      "Elementos do ambiente",
      "Entorno",
      "Câmera / Perspectiva",
      ...(state.renderType === "render_interno" ? ["Ambientes internos"] : []),
      "Humanização",
      "Prompt gerado",
    ];
    return base[state.stepIndex] || "";
  }, [state.renderType, state.stepIndex]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      update({ stepIndex: nextIndex });
    },
    [update]
  );

  const processFile = useCallback(
    (file: File) => {
      const accepted = ["image/jpeg", "image/png", "image/webp"];
      if (!accepted.includes(file.type)) {
        toast.error("Formato não suportado. Use JPG, PNG ou WEBP.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        update({ imageFile: file, imagePreview: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    },
    [update]
  );

  const maybeAnalyzeForDescription = useCallback(async () => {
    if (!state.imagePreview) return;
    if (state.analysis) return;

    try {
      setIsAnalyzing(true);
      const analysis = await analyzeImage(state.imagePreview);
      update({ analysis });

      if (!sceneDescriptionTouchedRef.current) {
        const auto = (analysis as unknown as Record<string, unknown>)?.FULL_DESCRIPTION;
        if (typeof auto === "string") {
          update({ sceneDescription: auto });
        }
      }

      // Sugestões / pré-seleções (mantém usuário livre para alterar)
      const full = normalizeText((analysis as unknown as Record<string, unknown>)?.FULL_DESCRIPTION);
      const detected = getDetectedImageType(analysis);

      if (!state.renderType) {
        if (detected.includes("floor_plan")) update({ renderType: "planta_humanizada" });
        else if (detected.includes("section")) update({ renderType: "render_corte" });
        else if (full.includes("interior") || full.includes("inside")) update({ renderType: "render_interno" });
        else if (full.includes("aerial") || full.includes("drone")) update({ renderType: "render_aereo" });
        else if (full.includes("exterior") || full.includes("facade") || full.includes("outdoor")) update({ renderType: "render_externo" });
      }

      if (!state.lighting) {
        if (full.includes("golden hour") || full.includes("sunset") || full.includes("entardecer")) update({ lighting: "entardecer" });
        else if (full.includes("night") || full.includes("noturno")) update({ lighting: "noturno" });
        else if (full.includes("overcast") || full.includes("cloud") || full.includes("nublado")) update({ lighting: "nublado" });
        else if (full.includes("rain") || full.includes("chuva")) update({ lighting: "chuva" });
        else if (full.includes("dawn") || full.includes("sunrise") || full.includes("amanhecer")) update({ lighting: "amanhecer" });
        else if (full.includes("day") || full.includes("diurno")) update({ lighting: "diurno" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao analisar imagem";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [state.imagePreview, state.analysis, state.renderType, state.lighting, update]);

  // Ao entrar na Página 2, dispara análise (se disponível) para pré-preencher a descrição.
  useEffect(() => {
    if (state.stepIndex !== 1) return;
    void maybeAnalyzeForDescription();
  }, [maybeAnalyzeForDescription, state.stepIndex]);

  const canGoNext = useMemo(() => {
    // 0: upload obrigatório
    if (state.stepIndex === 0) return Boolean(state.imagePreview);

    // 1: descrição obrigatória
    if (state.stepIndex === 1) return state.sceneDescription.trim().length > 0;

    // 2: tipo render obrigatório
    if (state.stepIndex === 2) return Boolean(state.renderType);

    // 3: iluminação obrigatória
    if (state.stepIndex === 3) return Boolean(state.lighting);

    // 4: qualidade obrigatória
    if (state.stepIndex === 4) return Boolean(state.quality);

    // 5: elementos (opcional)
    if (state.stepIndex === 5) return true;

    // 6: entorno (obrigatório se página estiver ativa)
    if (state.stepIndex === 6) {
      const pageDisabled = state.renderType === "render_interno" && !hasExteriorView;
      if (pageDisabled) return true;
      return state.surroundings.length > 0;
    }

    // 7: câmera obrigatório
    if (state.stepIndex === 7) return Boolean(state.camera);

    // 8: ambientes internos (se existir)
    if (state.stepIndex === 8 && state.renderType === "render_interno") {
      return state.internalRooms.length > 0;
    }

    // humanização
    const humanizationStepIndex = state.renderType === "render_interno" ? 9 : 8;
    if (state.stepIndex === humanizationStepIndex) {
      // sempre pode avançar (se não, vai direto; se sim, formulário é opcional)
      return true;
    }

    return true;
  }, [hasExteriorView, state]);

  const nextStepIndex = useMemo(() => {
    // step order:
    // 0 upload
    // 1 details
    // 2 type
    // 3 lighting
    // 4 quality
    // 5 env elements
    // 6 surroundings
    // 7 camera
    // 8 internal rooms (conditional)
    // 9 humanization (if internal) or 8 humanization (if not)
    // final
    if (state.renderType === "render_interno") {
      // If we are at camera step (7), next is internal rooms (8)
      return state.stepIndex + 1;
    }

    // If not internal, and we are at camera step (7), skip internal rooms
    if (state.stepIndex === 7) return 8;
    return state.stepIndex + 1;
  }, [state.renderType, state.stepIndex]);

  const handleNext = useCallback(() => {
    // Skip internal rooms page silently when not internal
    if (state.stepIndex === 7 && state.renderType !== "render_interno") {
      goToStep(8);
      return;
    }

    // Humanization: if disabled, advance directly to final
    const humanizationStepIndex = state.renderType === "render_interno" ? 9 : 8;
    const finalStepIndex = state.renderType === "render_interno" ? 10 : 9;

    if (state.stepIndex === humanizationStepIndex) {
      void (async () => {
        try {
          setIsGeneratingPrompt(true);
          const selectedKeys = buildSelectedKeys(state);
          const humanizationText = buildHumanizationText(state);

          const { data, error } = await supabase.functions.invoke("generate-prompt", {
            body: {
              imageDescription: state.sceneDescription,
              selectedKeys,
              humanizationText,
            },
          });

          if (error) {
            throw error;
          }

          if (data?.error) {
            throw new Error(data.error);
          }

          const prompt = data?.prompt;
          if (!prompt || typeof prompt !== "string") {
            throw new Error("Erro ao gerar prompt final. Tente novamente.");
          }

          update({ finalPrompt: prompt });
          goToStep(finalStepIndex);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erro ao gerar prompt final.";
          toast.error(msg);
        } finally {
          setIsGeneratingPrompt(false);
        }
      })();
      return;
    }

    // Internal rooms step
    if (state.stepIndex === 8 && state.renderType === "render_interno") {
      goToStep(9);
      return;
    }

    goToStep(nextStepIndex);
  }, [goToStep, nextStepIndex, state, update]);

  const handleBack = useCallback(() => {
    // Handle back with conditional step
    if (state.renderType !== "render_interno" && state.stepIndex === 8) {
      // Came from camera step
      goToStep(7);
      return;
    }

    goToStep(Math.max(0, state.stepIndex - 1));
  }, [goToStep, state.renderType, state.stepIndex]);

  const reset = useCallback(() => {
    sceneDescriptionTouchedRef.current = false;
    setState({
      stepIndex: 0,
      imageFile: null,
      imagePreview: null,
      analysis: null,
      sceneDescription: "",
      renderType: "",
      lighting: "",
      quality: "",
      environmentElements: [],
      surroundings: [],
      camera: "",
      internalRooms: [],
      humanizationEnabled: false,
      humanizationItems: [],
      finalPrompt: "",
    });
  }, []);

  const progressText = useMemo(() => {
    const finalStepIndex = state.renderType === "render_interno" ? 10 : 9;
    const onFinal = state.stepIndex === finalStepIndex;
    const currentPage = onFinal ? totalPages : Math.min(state.stepIndex + 1, totalPages);
    return `Etapa ${currentPage} de ${totalPages} — ${stepLabel}`;
  }, [state.renderType, state.stepIndex, stepLabel, totalPages]);

  // Compatibility / disabled rules
  const renderTypeDisabledMap = useMemo(() => {
    const disabled: Partial<Record<RenderTypeId, string>> = {};
    const type = detectedImageType;
    const kind = sceneKind;

    if (type.includes("floor_plan")) {
      disabled.render_externo = "Esta opção não é compatível com a cena detectada.";
      disabled.render_interno = "Esta opção não é compatível com a cena detectada.";
      disabled.render_aereo = "Esta opção não é compatível com a cena detectada.";
      disabled.render_detalhe = "Esta opção não é compatível com a cena detectada.";
      disabled.render_corte = "Esta opção não é compatível com a cena detectada.";
      // planta_humanizada stays enabled
    } else if (type.includes("section")) {
      disabled.render_externo = "Esta opção não é compatível com a cena detectada.";
      disabled.render_interno = "Esta opção não é compatível com a cena detectada.";
      disabled.render_aereo = "Esta opção não é compatível com a cena detectada.";
      disabled.render_detalhe = "Esta opção não é compatível com a cena detectada.";
      disabled.planta_humanizada = "Esta opção não é compatível com a cena detectada.";
      // render_corte enabled
    } else if (kind === "interior") {
      disabled.render_aereo = "Esta opção não é compatível com a cena detectada.";
    }

    return disabled;
  }, [detectedImageType, sceneKind]);

  const lightingDisabledMap = useMemo(() => {
    const disabled: Partial<Record<LightingId, string>> = {};
    if (state.renderType === "planta_humanizada") {
      disabled.noturno = "Planta humanizada é tipicamente apresentada sem simulação de período do dia.";
    }
    return disabled;
  }, [state.renderType]);

  const environmentDisabledMap = useMemo(() => {
    const disabled: Partial<Record<EnvironmentElementId, string>> = {};
    if (state.renderType === "render_interno" && !hasExteriorView) {
      disabled.piscina = "Esta opção não é compatível com o tipo de render selecionado.";
      disabled.jardim = "Esta opção não é compatível com o tipo de render selecionado.";
      disabled.area_gourmet = "Esta opção não é compatível com o tipo de render selecionado.";
      disabled.garagem = "Esta opção não é compatível com o tipo de render selecionado.";
      disabled.deck = "Esta opção não é compatível com o tipo de render selecionado.";
      disabled.espelho_dagua = "Esta opção não é compatível com o tipo de render selecionado.";
    }
    return disabled;
  }, [hasExteriorView, state.renderType]);

  const cameraDisabledMap = useMemo(() => {
    const disabled: Partial<Record<CameraId, string>> = {};
    const anyAnalysis = state.analysis as unknown as Record<string, unknown> | null;
    const full = normalizeText(anyAnalysis?.FULL_DESCRIPTION);
    const looksEyeLevel = full.includes("eye level") || full.includes("human eye") || full.includes("standing") || full.includes("nível do olho");

    if (looksEyeLevel) {
      disabled.olho_verme = "A cena enviada não aparenta suportar este ângulo de câmera.";
      disabled.olho_passaro = "A cena enviada não aparenta suportar este ângulo de câmera.";
    }

    return disabled;
  }, [state.analysis]);

  // Step views
  const renderStep = () => {
    // Page 1 — Upload
    if (state.stepIndex === 0) {
      return (
        <div className="animate-fade-up max-w-2xl mx-auto">
          <StepTitle title="Upload da Imagem" description="Envie o print ou render da sua cena 3D. A imagem será analisada para auxiliar nas configurações seguintes." />

          {!state.imagePreview ? (
            <UploadZone onFile={processFile} />
          ) : (
            <ImagePreviewCard
              file={state.imageFile}
              preview={state.imagePreview}
              onClear={() => update({ imageFile: null, imagePreview: null, analysis: null })}
            />
          )}

          <NavButtons onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 2 — Details
    if (state.stepIndex === 1) {
      return (
        <div className="animate-fade-up max-w-3xl mx-auto">
          <StepTitle title="Detalhes da imagem" description="Confira ou edite a descrição automática da sua cena. Esse texto enriquecerá o prompt final." />

          {state.imagePreview && (
            <div className="surface-card p-4 mb-6">
              <div className="rounded-lg overflow-hidden" style={{ maxHeight: 320 }}>
                <img src={state.imagePreview} alt="Preview" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          <div className="surface-card p-6">
            <div className="font-mono text-xs font-medium text-foreground mb-2">Descrição da cena</div>
            <textarea
              value={state.sceneDescription}
              onChange={(e) => {
                sceneDescriptionTouchedRef.current = true;
                update({ sceneDescription: e.target.value });
              }}
              className="w-full p-4 rounded-lg font-mono text-sm resize-none focus:outline-none transition-colors duration-200"
              style={{
                background: "hsl(var(--surface-2))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
                minHeight: 140,
              }}
              placeholder={isAnalyzing ? "Gerando descrição automática..." : ""}
            />
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 3 — Render type
    if (state.stepIndex === 2) {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Tipo de render"
            description="Define o ponto de vista e a natureza da visualização. Escolha o tipo que melhor representa a intenção da cena."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RENDER_TYPE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={state.renderType === opt.id}
                onClick={() => {
                  if (renderTypeDisabledMap[opt.id]) return;
                  update({ renderType: opt.id });
                }}
                label={opt.label}
                desc={opt.desc}
                icon={opt.icon}
                disabled={Boolean(renderTypeDisabledMap[opt.id])}
                tooltip={renderTypeDisabledMap[opt.id]}
              />
            ))}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 4 — Lighting
    if (state.stepIndex === 3) {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Período do dia / Iluminação"
            description="Define a condição de luz que envolve a cena. A escolha impacta diretamente a atmosfera, sombras e temperatura de cor do render."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LIGHTING_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={state.lighting === opt.id}
                onClick={() => {
                  if (lightingDisabledMap[opt.id]) return;
                  update({ lighting: opt.id });
                }}
                label={opt.label}
                desc={opt.desc}
                icon={opt.icon}
                disabled={Boolean(lightingDisabledMap[opt.id])}
                tooltip={lightingDisabledMap[opt.id]}
              />
            ))}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 5 — Quality
    if (state.stepIndex === 4) {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Qualidade / Estilo de render"
            description="Define a linguagem visual e o tratamento estético final da imagem. Cada estilo comunica uma intenção diferente ao observador."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ quality: opt.id })}
                className={`render-option text-left ${state.quality === opt.id ? "selected" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-muted-foreground">{opt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-medium text-foreground">{opt.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground leading-tight">{opt.desc}</div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg shrink-0"
                    style={{
                      background:
                        opt.id === "fotorrealista"
                          ? "linear-gradient(135deg, hsl(var(--gold) / 0.35), hsl(var(--surface-3)))"
                          : opt.id === "classico"
                            ? "linear-gradient(135deg, hsl(var(--surface-2)), hsl(var(--surface-3)))"
                            : opt.id === "atmosferico"
                              ? "linear-gradient(135deg, hsl(200 40% 40% / 0.35), hsl(var(--surface-3)))"
                              : "linear-gradient(135deg, hsl(var(--surface-2)), hsl(var(--background)))",
                    }}
                  />
                </div>
              </button>
            ))}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 6 — Env elements (multi optional)
    if (state.stepIndex === 5) {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Elementos do ambiente"
            description="Adicione elementos que compõem o ambiente da cena. Você pode selecionar quantos desejar. Apenas opções compatíveis com o tipo de render escolhido estarão disponíveis."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENVIRONMENT_ELEMENTS.map((opt) => {
              const disabledReason = environmentDisabledMap[opt.id];
              const selected = state.environmentElements.includes(opt.id);

              return (
                <MultiOptionCard
                  key={opt.id}
                  selected={selected}
                  onClick={() => {
                    if (disabledReason) return;
                    const next = selected
                      ? state.environmentElements.filter((id) => id !== opt.id)
                      : [...state.environmentElements, opt.id];
                    update({ environmentElements: next });
                  }}
                  label={opt.label}
                  icon={opt.icon}
                  disabled={Boolean(disabledReason)}
                  tooltip={disabledReason}
                />
              );
            })}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 7 — Surroundings (multi; required if active)
    if (state.stepIndex === 6) {
      const pageDisabled = state.renderType === "render_interno" && !hasExteriorView;

      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Entorno"
            description="Define o contexto urbano ou natural ao redor da edificação. Afeta a composição de fundo e a narrativa espacial do render."
          />

          {pageDisabled && (
            <div
              className="surface-card p-4 mb-6 font-mono text-xs"
              style={{ background: "hsl(var(--gold) / 0.05)", border: "1px solid hsl(var(--gold) / 0.15)" }}
            >
              Esta configuração não se aplica a renders internos sem visão para o exterior.
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${pageDisabled ? "opacity-60" : ""}`}>
            {SURROUNDING_OPTIONS.map((opt) => {
              const selected = state.surroundings.includes(opt.id);

              return (
                <OptionCard
                  key={opt.id}
                  selected={selected}
                  onClick={() => {
                    if (pageDisabled) return;
                    const next = selected
                      ? state.surroundings.filter((id) => id !== opt.id)
                      : [...state.surroundings, opt.id];
                    update({ surroundings: next });
                  }}
                  label={opt.label}
                  desc={opt.desc}
                  icon={opt.icon}
                  disabled={pageDisabled}
                  tooltip={pageDisabled ? "Esta configuração não se aplica a renders internos sem visão para o exterior." : undefined}
                />
              );
            })}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 8 — Camera
    if (state.stepIndex === 7) {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Câmera / Perspectiva"
            description="Define a posição e o ângulo da câmera virtual. Deve ser compatível com a cena enviada para garantir coerência geométrica no prompt."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CAMERA_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                selected={state.camera === opt.id}
                onClick={() => {
                  if (cameraDisabledMap[opt.id]) return;
                  update({ camera: opt.id });
                }}
                label={opt.label}
                desc={opt.desc}
                icon={opt.icon}
                disabled={Boolean(cameraDisabledMap[opt.id])}
                tooltip={cameraDisabledMap[opt.id]}
              />
            ))}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 9 — Internal rooms (conditional)
    if (state.stepIndex === 8 && state.renderType === "render_interno") {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle
            title="Ambientes internos"
            description="Selecione os ambientes que aparecem na cena interna. Cada ambiente contribuirá com detalhes específicos no prompt final."
          />

          <div
            className="surface-card p-4 mb-6 font-mono text-xs"
            style={{ background: "hsl(var(--gold) / 0.05)", border: "1px solid hsl(var(--gold) / 0.15)" }}
          >
            Os prompts específicos de cada ambiente estão sendo preparados e serão adicionados em breve.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTERNAL_ROOMS.map((opt) => {
              const selected = state.internalRooms.includes(opt.id);
              return (
                <MultiOptionCard
                  key={opt.id}
                  selected={selected}
                  onClick={() => {
                    const next = selected
                      ? state.internalRooms.filter((id) => id !== opt.id)
                      : [...state.internalRooms, opt.id];
                    update({ internalRooms: next });
                  }}
                  label={opt.label}
                  icon={<Sparkles className="w-4 h-4" />}
                />
              );
            })}
          </div>

          <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!canGoNext} />
        </div>
      );
    }

    // Page 10 — Humanization
    const humanizationStepIndex = state.renderType === "render_interno" ? 9 : 8;
    if (state.stepIndex === humanizationStepIndex) {
      return (
        <div className="animate-fade-up max-w-3xl mx-auto">
          <StepTitle
            title="Humanização da cena"
            description="Adicionar figuras humanas ou animais escala a cena e torna o render mais vívido e comunicativo. Descreva as características e a ação de cada elemento."
          />

          <div className="surface-card p-6 mb-6">
            <div className="font-mono text-sm text-foreground mb-4">Deseja adicionar pessoas ou animais à cena?</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => update({ humanizationEnabled: true })}
                className={`px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-transform duration-200 active:scale-[0.97] ${
                  state.humanizationEnabled ? "" : ""
                }`}
                style={{
                  borderColor: state.humanizationEnabled ? "hsl(var(--gold))" : "hsl(var(--border))",
                  color: state.humanizationEnabled ? "hsl(var(--gold))" : "hsl(var(--foreground))",
                }}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => update({ humanizationEnabled: false, humanizationItems: [] })}
                className="px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-transform duration-200 active:scale-[0.97]"
                style={{
                  borderColor: !state.humanizationEnabled ? "hsl(var(--gold))" : "hsl(var(--border))",
                  color: !state.humanizationEnabled ? "hsl(var(--gold))" : "hsl(var(--foreground))",
                }}
              >
                Não
              </button>
            </div>
          </div>

          {state.humanizationEnabled && (
            <div className="space-y-4">
              {state.humanizationItems.map((item, idx) => (
                <div key={idx} className="surface-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--gold) / 0.1)" }}>
                      {item.type === "Pessoa" ? <Users className="w-4 h-4 text-gold" /> : <PawPrint className="w-4 h-4 text-gold" />}
                    </div>
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const next = [...state.humanizationItems];
                        next[idx] = { ...next[idx], type: e.target.value as HumanizationItem["type"] };
                        update({ humanizationItems: next });
                      }}
                      className="font-mono text-sm rounded-lg px-3 py-2"
                      style={{
                        background: "hsl(var(--surface-2))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      <option value="Pessoa">Pessoa</option>
                      <option value="Animal">Animal</option>
                    </select>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground mb-1">Descrição física</div>
                      <input
                        value={item.physicalDescription}
                        onChange={(e) => {
                          const next = [...state.humanizationItems];
                          next[idx] = { ...next[idx], physicalDescription: e.target.value };
                          update({ humanizationItems: next });
                        }}
                        className="w-full font-mono text-sm rounded-lg px-3 py-2"
                        style={{
                          background: "hsl(var(--surface-2))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-mono text-xs text-muted-foreground mb-1">Ação / Posição</div>
                      <input
                        value={item.actionPosition}
                        onChange={(e) => {
                          const next = [...state.humanizationItems];
                          next[idx] = { ...next[idx], actionPosition: e.target.value };
                          update({ humanizationItems: next });
                        }}
                        className="w-full font-mono text-sm rounded-lg px-3 py-2"
                        style={{
                          background: "hsl(var(--surface-2))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  update({
                    humanizationItems: [
                      ...state.humanizationItems,
                      { type: "Pessoa", physicalDescription: "", actionPosition: "" },
                    ],
                  })
                }
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-transform duration-200 active:scale-[0.97]"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              >
                <Plus className="w-4 h-4" />
                + Adicionar
              </button>
            </div>
          )}

          <NavButtons
            onBack={handleBack}
            onNext={handleNext}
            nextDisabled={!canGoNext || isGeneratingPrompt}
            nextLabel={state.humanizationEnabled ? "Gerar prompt" : "Gerar prompt"}
          />
        </div>
      );
    }

    // Final — Prompt generated
    const finalStepIndex = state.renderType === "render_interno" ? 10 : 9;
    if (state.stepIndex === finalStepIndex) {
      return (
        <div className="animate-fade-up max-w-4xl mx-auto">
          <StepTitle title="Prompt gerado" description="Recomendamos utilizar este prompt no Nano Banana Pro para melhores resultados." />

          <div className="surface-card p-1 mb-6">
            <textarea
              value={state.finalPrompt}
              readOnly
              className="prompt-output w-full resize-none focus:outline-none border-0"
              style={{ minHeight: 220 }}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(state.finalPrompt);
                toast.success("Prompt copiado.");
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium transition-all duration-200 active:scale-[0.97]"
              style={{ background: "hsl(var(--gold))", color: "hsl(var(--background))" }}
            >
              <Copy className="w-4 h-4" />
              Copiar prompt
            </button>

            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200 active:scale-[0.97]"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            >
              <RotateCcw className="w-4 h-4" />
              Recomeçar
            </button>
          </div>

          <div className="surface-card p-6">
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">Resumo das configurações</div>
            <div className="grid gap-2 font-mono text-sm">
              <div><span className="text-muted-foreground">Tipo de render:</span> {RENDER_TYPE_OPTIONS.find((o) => o.id === state.renderType)?.label || "—"}</div>
              <div><span className="text-muted-foreground">Descrição da cena:</span> {state.sceneDescription || "—"}</div>
              <div><span className="text-muted-foreground">Período do dia:</span> {LIGHTING_OPTIONS.find((o) => o.id === state.lighting)?.label || "—"}</div>
              <div><span className="text-muted-foreground">Qualidade/Estilo:</span> {QUALITY_OPTIONS.find((o) => o.id === state.quality)?.label || "—"}</div>
              <div><span className="text-muted-foreground">Elementos do ambiente:</span> {state.environmentElements.length ? state.environmentElements.map((id) => ENVIRONMENT_ELEMENTS.find((o) => o.id === id)?.label).filter(Boolean).join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Entorno:</span> {state.surroundings.length ? state.surroundings.map((id) => SURROUNDING_OPTIONS.find((o) => o.id === id)?.label).filter(Boolean).join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Câmera:</span> {CAMERA_OPTIONS.find((o) => o.id === state.camera)?.label || "—"}</div>
              {state.renderType === "render_interno" && (
                <div><span className="text-muted-foreground">Ambientes internos:</span> {state.internalRooms.length ? state.internalRooms.map((id) => INTERNAL_ROOMS.find((o) => o.id === id)?.label).filter(Boolean).join(", ") : "—"}</div>
              )}
              <div><span className="text-muted-foreground">Humanização:</span> {state.humanizationEnabled ? "Sim" : "Não"}</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="font-mono text-xs px-4 py-2 rounded-full" style={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))" }}>
          {progressText}
        </div>
      </div>

      {renderStep()}
    </div>
  );
}

function UploadZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "hsl(var(--gold) / 0.1)" }}>
        <Upload className="w-7 h-7 text-gold" />
      </div>
      <p className="text-foreground font-mono text-sm mb-1">Arraste sua imagem ou clique para fazer upload</p>
      <p className="text-muted-foreground font-mono text-xs">JPG, PNG, WEBP</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

function ImagePreviewCard({
  file,
  preview,
  onClear,
}: {
  file: File | null;
  preview: string;
  onClear: () => void;
}) {
  return (
    <div className="surface-card p-4 relative" style={{ animationDelay: "0.1s" }}>
      <button
        type="button"
        onClick={onClear}
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
        style={{ background: "hsl(var(--surface-3))" }}
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="rounded-lg overflow-hidden mb-4" style={{ maxHeight: 400 }}>
        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
          <ImageIcon className="w-4 h-4" />
          <span>{file?.name}</span>
        </div>
      </div>
    </div>
  );
}
