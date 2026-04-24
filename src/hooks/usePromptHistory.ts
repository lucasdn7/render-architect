import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  render_config: Record<string, unknown> | null;
  created_at: string;
  image_preview: string | null;
  word_count: number | null;
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
        .select("id, prompt, render_config, created_at, image_preview, word_count")
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

  useEffect(() => {
    loadPromptHistory();
  }, [loadPromptHistory]);

  return {
    prompts,
    loading,
    error,
    reload: loadPromptHistory,
  };
}
