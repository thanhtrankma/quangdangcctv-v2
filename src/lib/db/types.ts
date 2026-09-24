import type { Settings, SettingsKey } from "@/lib/types";
import type { TableName } from "@/data/seed";

export type { TableName };

export interface Query {
  /** Equality filters. An array value means "column IN (...)". */
  where?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  search?: { columns: string[]; term: string };
}

export interface ListResult<T> {
  rows: T[];
  count: number;
}

export interface Repo {
  readonly kind: "mock" | "supabase";
  list<T>(table: TableName, q?: Query): Promise<ListResult<T>>;
  get<T>(table: TableName, id: string): Promise<T | null>;
  findOne<T>(table: TableName, where: Record<string, unknown>): Promise<T | null>;
  insert<T>(table: TableName, data: Record<string, unknown>): Promise<T>;
  update<T>(table: TableName, id: string, data: Record<string, unknown>): Promise<T>;
  remove(table: TableName, id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  setSetting<K extends SettingsKey>(key: K, value: Settings[K]): Promise<void>;
}
