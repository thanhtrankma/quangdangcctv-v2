-- Base schema. Run once in Supabase → SQL Editor, then every file in supabase/migrations/ in order, then `npm run db:seed`.
-- All reads/writes go through the Next.js server using the secret key, so RLS is enabled
-- with no public policies (the anon/publishable key cannot read or write anything).

create extension if not exists pgcrypto;

create table if not exists categories (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  parent_id text references categories(id) on delete set null,
  tagline text not null default '',
  description text not null default '',
  banner text not null default '',
  color text not null default '#0e9488',
  sort_order int not null default 0,
  show_on_home boolean not null default false,
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brands (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  logo text not null default '',
  description text not null default '',
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  sku text not null default '',
  price bigint not null default 0,
  compare_at_price bigint,
  variant_label text not null default '',
  images jsonb not null default '[]'::jsonb,
  category_id text references categories(id) on delete set null,
  brand_id text references brands(id) on delete set null,
  short_description text not null default '',
  description text not null default '',
  status text not null default 'published' check (status in ('published', 'draft')),
  featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_brand_idx on products(brand_id);
create index if not exists products_status_idx on products(status, sort_order);

create table if not exists banners (
  id text primary key default gen_random_uuid()::text,
  title text not null default '',
  eyebrow text not null default '',
  subtitle text not null default '',
  image text not null default '',
  image_mobile text not null default '',
  link text not null default '',
  button_text text not null default '',
  position text not null default 'home_hero',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists post_categories (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists posts (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  cover text not null default '',
  content text not null default '',
  category_id text references post_categories(id) on delete set null,
  published_at date not null default current_date,
  views int not null default 0,
  status text not null default 'published' check (status in ('published', 'draft')),
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pages (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  title text not null,
  content text not null default '',
  template text not null default 'default',
  faqs jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('published', 'draft')),
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists videos (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  youtube_url text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  customer_name text not null,
  phone text not null,
  email text not null default '',
  province text not null default '',
  ward text not null default '',
  address text not null default '',
  note text not null default '',
  items jsonb not null default '[]'::jsonb,
  total bigint not null default 0,
  status text not null default 'new',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on orders(created_at desc);

create table if not exists contact_messages (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  phone text not null default '',
  email text not null default '',
  message text not null default '',
  source text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['categories','brands','products','banners','post_categories','posts','pages','videos','orders','contact_messages','settings']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Tell PostgREST to pick up the new tables immediately.
notify pgrst, 'reload schema';
