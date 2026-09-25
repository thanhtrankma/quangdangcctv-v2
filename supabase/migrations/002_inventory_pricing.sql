-- 002: inventory, purchasing and pricing.
-- Run once in Supabase → SQL Editor (safe to re-run). Also works for projects created from schema.sql.

-- Products: cost, wholesale price, stock
alter table products add column if not exists cost_price bigint not null default 0;
alter table products add column if not exists wholesale_price bigint;
alter table products add column if not exists stock integer not null default 0;
alter table products add column if not exists low_stock_threshold integer not null default 2;
alter table products add column if not exists track_stock boolean not null default false;

-- Orders: whether stock was taken out, and cost of goods at that moment
alter table orders add column if not exists stock_deducted boolean not null default false;
alter table orders add column if not exists cost_total bigint not null default 0;

create table if not exists suppliers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  tax_code text not null default '',
  bank_account text not null default '',
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id text primary key default gen_random_uuid()::text,
  code text not null unique,
  supplier_id text references suppliers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'received', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  subtotal bigint not null default 0,
  shipping_fee bigint not null default 0,
  discount bigint not null default 0,
  total bigint not null default 0,
  paid_amount bigint not null default 0,
  ordered_at date not null default current_date,
  received_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists purchase_orders_supplier_idx on purchase_orders(supplier_id);
create index if not exists purchase_orders_status_idx on purchase_orders(status, ordered_at desc);

create table if not exists stock_movements (
  id text primary key default gen_random_uuid()::text,
  product_id text references products(id) on delete cascade,
  product_name text not null default '',
  type text not null check (type in ('purchase', 'purchase_cancel', 'sale', 'sale_return', 'adjustment')),
  qty integer not null,
  stock_after integer not null,
  unit_cost bigint not null default 0,
  ref_type text not null default '',
  ref_id text not null default '',
  ref_code text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on stock_movements(product_id, created_at desc);
create index if not exists stock_movements_created_idx on stock_movements(created_at desc);

create table if not exists price_history (
  id text primary key default gen_random_uuid()::text,
  product_id text references products(id) on delete cascade,
  product_name text not null default '',
  old_price bigint,
  new_price bigint,
  old_compare_at_price bigint,
  new_compare_at_price bigint,
  old_cost_price bigint,
  new_cost_price bigint,
  source text not null default 'manual',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists price_history_product_idx on price_history(product_id, created_at desc);

alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table stock_movements enable row level security;
alter table price_history enable row level security;

-- Atomic stock change: locks the product row, updates stock (and moving-average cost on purchases),
-- writes the stock card entry and returns the new stock level.
create or replace function apply_stock_movement(
  p_product_id text,
  p_qty integer,
  p_type text,
  p_unit_cost bigint default null,
  p_ref_type text default '',
  p_ref_id text default '',
  p_ref_code text default '',
  p_note text default ''
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
  v_cost bigint;
  v_name text;
  v_new_cost bigint;
  v_base integer;
begin
  select stock, cost_price, name into v_stock, v_cost, v_name from products where id = p_product_id for update;
  if not found then
    raise exception 'Không tìm thấy sản phẩm %', p_product_id;
  end if;

  v_new_cost := v_cost;
  if p_type = 'purchase' and p_qty > 0 and p_unit_cost is not null then
    v_base := greatest(v_stock, 0);
    v_new_cost := round((v_base::numeric * v_cost + p_qty::numeric * p_unit_cost) / (v_base + p_qty));
  end if;

  update products
     set stock = stock + p_qty, cost_price = v_new_cost, track_stock = true, updated_at = now()
   where id = p_product_id;

  insert into stock_movements (product_id, product_name, type, qty, stock_after, unit_cost, ref_type, ref_id, ref_code, note)
  values (p_product_id, v_name, p_type, p_qty, v_stock + p_qty, coalesce(p_unit_cost, v_cost), p_ref_type, p_ref_id, p_ref_code, p_note);

  return v_stock + p_qty;
end;
$$;

revoke all on function apply_stock_movement(text, integer, text, bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function apply_stock_movement(text, integer, text, bigint, text, text, text, text) to service_role;

notify pgrst, 'reload schema';
