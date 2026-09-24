import { mockRepo } from "./mock";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

export * from "./types";

export const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseSecret = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** DATA_SOURCE=mock forces the local JSON database even when Supabase keys are present. */
export const isSupabaseConfigured = () =>
  process.env.DATA_SOURCE !== "mock" && Boolean(supabaseUrl() && supabaseSecret());

/** Supabase when its env vars are set, otherwise the local JSON mock database. */
export function db(): Repo {
  return isSupabaseConfigured() ? supabaseRepo : mockRepo;
}
