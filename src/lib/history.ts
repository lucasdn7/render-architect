import { supabase } from "@/integrations/supabase/client";
import { ensureSupabaseSession } from "@/lib/supabaseAuth";

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  image_preview?: string | null;
  render_config?: Record<string, unknown>;
  word_count?: number;
  created_at: string;
}

export async function getHistory(): Promise<PromptHistoryItem[]> {
  await ensureSupabaseSession();

  const { data, error } = await supabase
    .from("prompt_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

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
  await ensureSupabaseSession();

  const wordCount = item.prompt.trim().split(/\s+/).filter(Boolean).length;

  const { error } = await supabase.from("prompt_history").insert([
    {
      prompt: item.prompt,
      image_preview: item.imagePreview || null,
      render_config: (item.renderConfig || {}) as unknown as Record<string, never>,
      word_count: wordCount,
    },
  ]);

  if (error) {
    console.error("Error saving to history:", error);
  }
}

export async function clearHistory(): Promise<void> {
  await ensureSupabaseSession();

  const { error } = await supabase
    .from("prompt_history")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

  if (error) {
    console.error("Error clearing history:", error);
  }
}
