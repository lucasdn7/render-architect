import { useState, useEffect } from "react";
import { Clock, Trash2, Copy, X, Star } from "lucide-react";
import { getHistory, clearHistory, PromptHistoryItem } from "@/lib/history";
import { supabase } from "@/integrations/supabase/client";

type HistoryItemWithFavorite = PromptHistoryItem & {
  is_favorite?: boolean | null;
};

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItemWithFavorite[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      getHistory().then(setItems);
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = async (prompt: string, id: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClear = async () => {
    await clearHistory();
    setItems([]);
  };

  const handleToggleFavorite = async (item: HistoryItemWithFavorite) => {
    const nextValue = !item.is_favorite;
    const { error } = await supabase
      .from("prompt_history")
      .update({ is_favorite: nextValue })
      .eq("id", item.id);

    if (error) return;

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, is_favorite: nextValue } : entry,
      ),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div
        className="relative w-full max-w-md h-full overflow-y-auto p-6"
        style={{ background: "hsl(var(--background))", borderLeft: "1px solid hsl(var(--border))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            <h3 className="font-display text-lg font-semibold">Prompts Recentes</h3>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={handleClear} className="p-2 rounded-lg transition-colors" style={{ color: "hsl(var(--destructive))" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-sm text-muted-foreground">Nenhum prompt salvo ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="surface-card p-4">
                <div className="font-mono text-xs text-muted-foreground mb-2">
                  {new Date(item.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
                <p className="font-mono text-xs text-foreground leading-relaxed line-clamp-4 mb-3">
                  {item.prompt}
                </p>
                <button
                  onClick={() => handleCopy(item.prompt, item.id)}
                  className="flex items-center gap-1.5 font-mono text-xs transition-colors mr-3"
                  style={{ color: copiedId === item.id ? "hsl(142 70% 45%)" : "hsl(var(--gold))" }}
                >
                  <Copy className="w-3 h-3" />
                  {copiedId === item.id ? "Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={() => handleToggleFavorite(item)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
                  style={{ color: item.is_favorite ? "hsl(var(--gold))" : "hsl(var(--muted-foreground))" }}
                >
                  <Star className="w-3 h-3" fill={item.is_favorite ? "hsl(var(--gold))" : "none"} />
                  {item.is_favorite ? "Favorito" : "Favoritar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
