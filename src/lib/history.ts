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

  const { data: favoritesData } = await supabase
    .from("favorites" as never)
    .select("prompt_history_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(
    ((favoritesData ?? []) as Array<{ prompt_history_id?: string | null }>)
      .map((item) => item.prompt_history_id)
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

export async function addToHistory(item: {
  prompt: string;
  imagePreview?: string;
  renderConfig?: Record<string, unknown>;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const wordCount = item.prompt.trim().split(/\s+/).filter(Boolean).length;

  const { error } = await supabase.from("prompt_history").insert([
    {
      user_id: user.id,
      prompt: item.prompt,
      image_preview: item.imagePreview || null,
      render_config: (item.renderConfig || {}) as unknown as Record<string, never>,
      word_count: wordCount,
    },
  ]);

  if (error) console.error("Error saving to history:", error);
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
