import { supabase } from "@/integrations/supabase/client";

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  image_preview?: string | null;
  render_config?: Record<string, unknown>;
  word_count?: number;
  created_at: string;
  is_favorite?: boolean;
  days_remaining?: number | null;
}

const PROMPT_TTL_DAYS = 30;

const getDaysRemaining = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  const expires = created + PROMPT_TTL_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return Math.ceil((expires - now) / (24 * 60 * 60 * 1000));
};

export async function getHistory(): Promise<PromptHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("prompt_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching history:", error);
    return [];
  }

  const rows = (data || []) as PromptHistoryItem[];

  // ✅ CORRIGIDO: usa "history_id" (nome real da coluna no banco)
  const { data: favoritesData } = await supabase
    .from("favorites" as never)
    .select("history_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(
    ((favoritesData ?? []) as Array<{ history_id?: string | null }>)
      .map((item) => item.history_id)
      .filter((value): value is string => Boolean(value)),
  );

  return rows
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
}

// ✅ CORRIGIDO: retorna o id do registro criado
export async function addToHistory(item: {
  prompt: string;
  imagePreview?: string;
  renderConfig?: Record<string, unknown>;
}): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const wordCount = item.prompt.trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await supabase
    .from("prompt_history")
    .insert([
      {
        user_id: user.id,
        prompt: item.prompt,
        image_preview: item.imagePreview || null,
        render_config: (item.renderConfig || {}) as unknown as Record<string, never>,
        word_count: wordCount,
      },
    ])
    .select("id")   // ← captura o id gerado
    .single();

  if (error) {
    console.error("Error saving to history:", error);
    return null;
  }

  return data?.id ?? null;
}

// ✅ CORRIGIDO: usa "history_id" ao inserir favorito
export async function toggleFavorite(
  historyId: string,
  currentlyFavorited: boolean,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (currentlyFavorited) {
    const { error } = await supabase
      .from("favorites" as never)
      .delete()
      .eq("user_id", user.id)
      .eq("history_id", historyId);

    if (error) console.error("Error removing favorite:", error);
  } else {
    const { error } = await supabase
      .from("favorites" as never)
      .insert([{ user_id: user.id, history_id: historyId }]);

    if (error) console.error("Error adding favorite:", error);
  }
}

export async function clearHistory(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("prompt_history")
    .delete()
    .eq("user_id", user.id);

  if (error) console.error("Error clearing history:", error);
}
