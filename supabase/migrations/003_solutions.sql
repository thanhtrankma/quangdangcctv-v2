-- 003: "Giải pháp" (solutions). Run once in Supabase → SQL Editor (safe to re-run), then `npm run db:seed`
-- to insert the 6 starter solutions (existing rows are left untouched).

create table if not exists solutions (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  icon text not null default 'cctv',
  cover text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  content text not null default '',
  related_categories jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  show_on_home boolean not null default true,
  sort_order int not null default 0,
  status text not null default 'published' check (status in ('published', 'draft')),
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists solutions_order_idx on solutions(status, sort_order);
alter table solutions enable row level security;

notify pgrst, 'reload schema';
