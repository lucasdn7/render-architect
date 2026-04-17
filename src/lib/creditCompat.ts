import { supabase } from "@/integrations/supabase/client";
import { PlanTier } from "@/config/planPermissions";

export interface CreditSnapshot {
  baseCredits: number;
  bonusCredits: number;
  plan: PlanTier;
  source: "profiles" | "user_credits" | "default";
  identifierColumn?: "user_id" | "id";
}

type GenericRow = Record<string, unknown>;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toPlan(value: unknown): PlanTier {
  if (value === "starter" || value === "pro" || value === "free") return value;
  return "free";
}

function parseProfileRow(row: GenericRow): CreditSnapshot {
  const hasModernCredits = Object.prototype.hasOwnProperty.call(row, "prompt_credits") ||
    Object.prototype.hasOwnProperty.call(row, "avulso_credits");

  if (hasModernCredits) {
    return {
      baseCredits: toNumber(row.prompt_credits, 5),
      bonusCredits: toNumber(row.avulso_credits, 0),
      plan: toPlan(row.plan),
      source: "profiles",
    };
  }

  return {
    baseCredits: toNumber(row.credits, 5),
    bonusCredits: toNumber(row.bonus_credits, 0),
    plan: toPlan(row.subscription_plan),
    source: "profiles",
  };
}

export async function fetchCreditSnapshot(userId: string): Promise<CreditSnapshot> {
  const scopedByRls = await supabase.from("profiles").select("*").maybeSingle();
  if (!scopedByRls.error && scopedByRls.data) {
    const row = scopedByRls.data as GenericRow;
    const identifierColumn =
      row.user_id === userId ? "user_id" : row.id === userId ? "id" : undefined;

    return {
      ...parseProfileRow(row),
      identifierColumn,
    };
  }

  const byId = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!byId.error && byId.data) {
    return {
      ...parseProfileRow(byId.data as GenericRow),
      identifierColumn: "id",
    };
  }

  const byUserId = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (!byUserId.error && byUserId.data) {
    return {
      ...parseProfileRow(byUserId.data as GenericRow),
      identifierColumn: "user_id",
    };
  }

  const legacyCredits = await supabase
    .from("user_credits")
    .select("credits, bonus_credits, subscription_plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (!legacyCredits.error && legacyCredits.data) {
    return {
      baseCredits: toNumber(legacyCredits.data.credits, 5),
      bonusCredits: toNumber(legacyCredits.data.bonus_credits, 0),
      plan: toPlan(legacyCredits.data.subscription_plan),
      source: "user_credits",
      identifierColumn: "user_id",
    };
  }

  return {
    baseCredits: 5,
    bonusCredits: 0,
    plan: "free",
    source: "default",
  };
}

export async function consumeCreditFallbackCompat(userId: string): Promise<{
  consumed: boolean;
  credit_type: "avulso" | "plan" | null;
  effective_plan: PlanTier;
}> {
  const snapshot = await fetchCreditSnapshot(userId);

  if (snapshot.source === "profiles" && snapshot.identifierColumn) {
    if (snapshot.bonusCredits > 0) {
      const { error } = await supabase
        .from("profiles")
        .update({ avulso_credits: snapshot.bonusCredits - 1, updated_at: new Date().toISOString() })
        .eq(snapshot.identifierColumn, userId);

      if (!error) {
        return { consumed: true, credit_type: "avulso", effective_plan: "pro" };
      }
    }

    if (snapshot.baseCredits > 0) {
      const { error } = await supabase
        .from("profiles")
        .update({ prompt_credits: snapshot.baseCredits - 1, updated_at: new Date().toISOString() })
        .eq(snapshot.identifierColumn, userId);

      if (!error) {
        return { consumed: true, credit_type: "plan", effective_plan: snapshot.plan };
      }
    }
  }

  if (snapshot.source === "user_credits") {
    if (snapshot.bonusCredits > 0) {
      const { error } = await supabase
        .from("user_credits")
        .update({ bonus_credits: snapshot.bonusCredits - 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (!error) {
        return { consumed: true, credit_type: "avulso", effective_plan: "pro" };
      }
    }

    if (snapshot.baseCredits > 0) {
      const { error } = await supabase
        .from("user_credits")
        .update({ credits: snapshot.baseCredits - 1, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (!error) {
        return { consumed: true, credit_type: "plan", effective_plan: snapshot.plan };
      }
    }
  }

  return {
    consumed: false,
    credit_type: null,
    effective_plan: snapshot.plan,
  };
}
