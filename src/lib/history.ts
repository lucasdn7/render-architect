import { PromptHistoryItem } from "@/types/promptRender";

const STORAGE_KEY = "promptrender_history";
const MAX_ITEMS = 5;

export function getHistory(): PromptHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: Omit<PromptHistoryItem, "id" | "timestamp">): void {
  const history = getHistory();
  const newItem: PromptHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const updated = [newItem, ...history].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
