import { useEffect, useState } from "react";
import { Check, Copy, RotateCcw, Pencil, Eye, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepResultProps {
  prompt: string;
  promptId?: string | null;
  usedKeys?: string[];
  isGenerating?: boolean;
  onReset: () => void;
}

const SECTION_COLORS: Record<string, { color: string; label: string }> = {
  description: { color: "#E5C76B", label: "🟡 Descrição da Imagem" },
  render: { color: "#6BA3E5", label: "🔵 Configurações de Render" },
  humanization: { color: "#6BE58A", label: "🟢 Humanização" },
  suffix: { color: "#CCCCCC", label: "⚪ Sufixo Técnico" },
};

export default function StepResult({ prompt, promptId, usedKeys = [], isGenerating, onReset }: StepResultProps) {
  const [copied, setCopied] = useState(false);
  const [editable, setEditable] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [showStructure, setShowStructure] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(false);
  }, [promptId, prompt]);

  const currentPrompt = editable ? editedPrompt : prompt;
  const wordCount = currentPrompt.trim().split(/\s+/).filter(Boolean).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const blob = new Blob([currentPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prompt-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatKeyLabel = (key: string) =>
    key
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

  const handleToggleFavorite = async () => {
    if (!promptId) return;

    try {
      setFavoriteLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        toast.error("Faça login novamente para favoritar.");
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites" as never)
          .delete()
          .eq("user_id", userId)
          .eq("prompt_history_id", promptId);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("Prompt removido dos favoritos.");
        return;
      }

      const { error } = await supabase.from("favorites" as never).insert({
        user_id: userId,
        prompt_history_id: promptId,
      } as never);

      if (error) throw error;
      setIsFavorite(true);
      toast.success("Prompt adicionado aos favoritos.");
    } catch (error) {
      console.error("Error toggling favorite from result:", error);
      toast.error("Não foi possível atualizar favorito.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="animate-fade-up max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "hsl(var(--gold) / 0.1)" }}>
          <Loader2 className="w-7 h-7 text-gold animate-spin" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-2" style={{ lineHeight: 1.1 }}>
          Gerando seu prompt final...
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          A IA está refinando e combinando todos os elementos
        </p>
      </div>
    );
  }

  if (!prompt) return null;

  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <span className="step-badge mb-4">Step 05</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 mb-2" style={{ lineHeight: 1.1 }}>
          Prompt Final
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Seu prompt está pronto para criar renders incríveis
        </p>
      </div>

      {/* Word count badge */}
      <div className="flex justify-center mb-4">
        <span className="font-mono text-xs px-3 py-1 rounded-full" style={{ background: "hsl(var(--gold) / 0.1)", color: "hsl(var(--gold))" }}>
          Prompt gerado com {wordCount} palavras
        </span>
      </div>

      {usedKeys.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {usedKeys.map((key) => (
            <Badge key={key} variant="outline" className="font-mono text-[11px]">
              {formatKeyLabel(key)}
            </Badge>
          ))}
        </div>
      )}

      {/* Prompt Output */}
      <div className="surface-card p-1 mb-4">
        {editable ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="prompt-output w-full resize-none focus:outline-none border-0"
            style={{ minHeight: 200 }}
          />
        ) : (
          <div className="prompt-output" style={{ minHeight: 120 }}>
            {currentPrompt}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium transition-all duration-200 active:scale-[0.97]"
          style={{
            background: copied ? "hsl(142 70% 45%)" : "hsl(var(--gold))",
            color: "hsl(var(--background))",
          }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado!" : "Copiar Prompt"}
        </button>
        <button
          onClick={handleExportTxt}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200 active:scale-[0.97]"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          Exportar .txt
        </button>
        <button
          onClick={handleToggleFavorite}
          disabled={!promptId || favoriteLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200 active:scale-[0.97] disabled:opacity-60"
          style={{
            borderColor: isFavorite ? "hsl(var(--gold))" : "hsl(var(--border))",
            color: isFavorite ? "hsl(var(--gold))" : "hsl(var(--foreground))",
          }}
        >
          <Star className="w-4 h-4" fill={isFavorite ? "hsl(var(--gold))" : "none"} />
          {isFavorite ? "Favorito" : "Favoritar"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200 active:scale-[0.97]"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          <RotateCcw className="w-4 h-4" />
          Gerar Novo
        </button>
        <button
          onClick={() => {
            setEditable(!editable);
            if (!editable) setEditedPrompt(prompt);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200 active:scale-[0.97]"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          <Pencil className="w-4 h-4" />
          {editable ? "Salvar" : "Editar"}
        </button>
        <button
          onClick={() => setShowStructure(!showStructure)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-sm font-medium border transition-all duration-200 active:scale-[0.97]"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
        >
          <Eye className="w-4 h-4" />
          {showStructure ? "Ocultar" : "Ver"} Estrutura
        </button>
      </div>

      {/* Structure Legend */}
      {showStructure && (
        <div className="surface-card p-4" style={{ animation: "fade-up 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Legenda da Estrutura</div>
          <div className="flex flex-wrap gap-3">
            {Object.values(SECTION_COLORS).map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="font-mono text-xs text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
