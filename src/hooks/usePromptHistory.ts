import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  render_config: Record<string, unknown> | null;
  created_at: string;
  image_preview: string | null;
  word_count: number | null;
  is_favorite: boolean;
  days_remaining: number | null;
}

const PROMPT_TTL_DAYS = 30;

const getDaysRemaining = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  const expires = created + PROMPT_TTL_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return Math.ceil((expires - now) / (24 * 60 * 60 * 1000));
};

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

      const { data: favoritesData } = await supabase
        .from("favorites" as never)
        .select("prompt_history_id")
        .eq("user_id", user.id);

      const favoriteIds = new Set(
        ((favoritesData ?? []) as Array<{ prompt_history_id?: string | null }>)
          .map((item) => item.prompt_history_id)
          .filter((value): value is string => Boolean(value)),
      );

      const mapped = ((data || []) as Array<Omit<PromptHistoryItem, "is_favorite" | "days_remaining">>)
        .map((item) => {
          const isFavorite = favoriteIds.has(item.id);
          const daysRemaining = getDaysRemaining(item.created_at);
          return {
            ...item,
            is_favorite: isFavorite,
            days_remaining: isFavorite ? null : Math.max(0, daysRemaining),
          };
        })
        .filter((item) => item.is_favorite || (item.days_remaining ?? 0) > 0);

      setPrompts(mapped);
    } catch (err) {
      console.error("Error loading prompt history:", err);
      setError("Erro ao carregar histórico");
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    if (isFavorite) {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão inválida");

      const { error } = await supabase
        .from("favorites" as never)
        .delete()
        .eq("user_id", userId)
        .eq("prompt_history_id", id);
      if (error) throw error;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão inválida");

      const { error } = await supabase.from("favorites" as never).insert({
        user_id: userId,
        prompt_history_id: id,
      } as never);
      if (error) throw error;
    }

    setPrompts((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            is_favorite: !isFavorite,
            days_remaining: !isFavorite ? null : Math.max(0, getDaysRemaining(item.created_at)),
          };
        })
        .filter((item) => item.is_favorite || (item.days_remaining ?? 0) > 0),
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
