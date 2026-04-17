import { supabase } from "@/integrations/supabase/client";

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  image_preview?: string | null;
  render_config?: Record<string, unknown>;
  word_count?: number;
  created_at: string;
}

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
  return (data || []) as PromptHistoryItem[];
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
