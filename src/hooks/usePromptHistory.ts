import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  render_config: Record<string, unknown> | null;
  created_at: string;
  image_preview: string | null;
  word_count: number | null;
  is_favorite: boolean | null;
}

export function usePromptHistory() {
  const [prompts, setPrompts] = useState<PromptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPromptHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPrompts([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("prompt_history")
        .select("id, prompt, render_config, created_at, image_preview, word_count, is_favorite")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setPrompts((data || []) as PromptHistoryItem[]);
    } catch (err) {
      console.error("Error loading prompt history:", err);
      setError("Erro ao carregar histórico");
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    const { error: updateError } = await supabase
      .from("prompt_history")
      .update({ is_favorite: !isFavorite })
      .eq("id", id);

    if (updateError) throw updateError;

    setPrompts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_favorite: !isFavorite } : item,
      ),
    );
  }, []);

  useEffect(() => {
    loadPromptHistory();
  }, [loadPromptHistory]);

  return {
    prompts,
    loading,
    error,
    reload: loadPromptHistory,
    toggleFavorite,
  };
}
