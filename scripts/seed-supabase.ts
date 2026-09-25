/**
 * Push the seed data (src/data/seed.ts) into Supabase and create the storage bucket.
 *   npm run db:seed              upsert only: safe to re-run, keeps rows you added/edited in the admin
 *   npm run db:seed -- --reset   REPLACE all catalog/content tables and settings with the seed data
 *                                (orders and contact messages are kept)
 */
import { createClient } from "@supabase/supabase-js";
import { seedSettings, seedTables, TABLES } from "../src/data/seed";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY (see .env.local)");

const reset = process.argv.includes("--reset");
const sb = createClient(url, key, { auth: { persistSession: false } });
const CONTENT_TABLES = ["products", "posts", "banners", "pages", "videos", "brands", "post_categories", "categories"] as const;
const LEGACY_DEMO_ROWS = { orders: ["order-demo-1"], contact_messages: ["contact-demo-1"] };

async function main() {
  if (reset) {
    for (const t of CONTENT_TABLES) {
      const { error } = await sb.from(t).delete().neq("id", "");
      if (error) throw new Error(`reset ${t}: ${error.message}`);
    }
    for (const [t, ids] of Object.entries(LEGACY_DEMO_ROWS)) await sb.from(t).delete().in("id", ids);
    console.log("✓ cleared content tables");
  }

  // Parents before children so foreign keys resolve.
  const cats = seedTables.categories;
  const ordered: typeof cats = [];
  const placed = new Set<string>();
  while (ordered.length < cats.length) {
    const before = ordered.length;
    for (const c of cats) {
      if (!placed.has(c.id) && (!c.parent_id || placed.has(c.parent_id))) {
        ordered.push(c);
        placed.add(c.id);
      }
    }
    if (ordered.length === before) throw new Error("categories: parent_id cycle or missing parent");
  }
  const tables = { ...seedTables, categories: ordered };

  for (const t of TABLES) {
    const rows = tables[t] as object[];
    if (!rows.length) continue; // nothing to seed (e.g. inventory tables start empty)
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await sb.from(t).upsert(rows.slice(i, i + 200), { onConflict: "id", ignoreDuplicates: !reset });
      if (error) throw new Error(`${t}: ${error.message}`);
    }
    console.log(`✓ ${t}: ${rows.length}`);
  }

  const settingsRows = Object.entries(seedSettings).map(([k, value]) => ({ key: k, value, updated_at: new Date().toISOString() }));
  const { error } = await sb.from("settings").upsert(settingsRows, { onConflict: "key", ignoreDuplicates: !reset });
  if (error) throw new Error(`settings: ${error.message}`);
  console.log(`✓ settings: ${settingsRows.length}`);

  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === bucket)) {
    const { error: be } = await sb.storage.createBucket(bucket, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
    if (be) throw new Error(`bucket: ${be.message}`);
    console.log(`✓ created public storage bucket "${bucket}"`);
  }
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
