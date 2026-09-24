/**
 * Step 3 of the minhhiepcctv.vn import: upload scripts/minhhiep/images/** to Supabase Storage
 * under `import/` (the URLs transform.py already wrote into the seed data). Skips files already uploaded.
 * Run: node --env-file=.env.local --import tsx scripts/minhhiep/upload-images.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SECRET_KEY!;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media";
const dir = path.join(import.meta.dirname, "images");
const sb = createClient(url, key, { auth: { persistSession: false } });

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif",
};

function walk(d: string): string[] {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}

async function main() {
  const files = walk(dir);
  let done = 0, skipped = 0, failed = 0;
  const queue = [...files];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let f = queue.shift(); f; f = queue.shift()) {
        if (!fs.statSync(f).size) continue; // markers left where a PNG was converted to JPEG
        const rel = path.relative(dir, f).split(path.sep).join("/");
        const { error } = await sb.storage.from(bucket).upload(`import/${rel}`, fs.readFileSync(f), {
          contentType: TYPES[path.extname(f).toLowerCase()] ?? "application/octet-stream",
          cacheControl: "31536000",
          upsert: false,
        });
        if (!error) done++;
        else if (/exists|Duplicate/i.test(error.message)) skipped++;
        else {
          failed++;
          console.error("✗", rel, error.message);
        }
        if ((done + skipped + failed) % 100 === 0) console.log(`… ${done + skipped + failed}/${files.length}`);
      }
    }),
  );
  console.log(`✓ uploaded ${done}, already there ${skipped}, failed ${failed} (of ${files.length})`);
}

main();
