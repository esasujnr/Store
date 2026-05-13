-- 013: Notifications and inventory rules
-- Adds safe inventory controls, order notification logs, and stock decrement RPCs.

create table if not exists marketplace_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text default '',
  logo_url text default '',
  website_url text default '',
  origin_type text not null default 'curated_brand' check (origin_type in ('wingxtra', 'curated_brand', 'partner_brand')),
  warranty_notes text default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table marketplace_brands enable row level security;
drop policy if exists "Anyone can view active marketplace brands" on marketplace_brands;
create policy "Anyone can view active marketplace brands" on marketplace_brands for select to anon, authenticated using (is_active = true);
drop policy if exists "Admins can manage marketplace brands" on marketplace_brands;
create policy "Admins can manage marketplace brands" on marketplace_brands for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

alter table products add column if not exists sale_price numeric(10,2);
alter table products add column if not exists sale_label text default '';
alter table products add column if not exists brand_id uuid references marketplace_brands(id) on delete set null;
alter table products add column if not exists brand text default 'Wingxtra';
alter table products add column if not exists product_family text default 'additive_manufacturing';
alter table products add column if not exists product_origin text default 'wingxtra';
alter table products add column if not exists delivery_type text;
alter table products add column if not exists additive_manufacturing_type text;
alter table products add column if not exists supplier_sku text default '';
alter table products add column if not exists warranty_notes text default '';
alter table products add column if not exists compatibility_notes text default '';
alter table products add column if not exists is_new_arrival boolean not null default false;
alter table products add column if not exists track_inventory boolean not null default true;
alter table products add column if not exists inventory_policy text not null default 'deny';
alter table products add column if not exists low_stock_threshold integer not null default 3;
alter table products add column if not exists lead_time_days integer not null default 0;

alter table products drop constraint if exists products_inventory_policy_check;
alter table products add constraint products_inventory_policy_check check (inventory_policy in ('deny', 'allow_backorder', 'made_to_order'));

update products
set
  brand = coalesce(nullif(brand, ''), 'Wingxtra'),
  delivery_type = coalesce(delivery_type, case when fulfillment_type = 'fdm' then 'digital_download' when fulfillment_type = 'mjf' then 'made_to_order' else 'physical_shipment' end),
  additive_manufacturing_type = coalesce(additive_manufacturing_type, case when fulfillment_type = 'fdm' then 'fdm_printable_files' when fulfillment_type = 'mjf' then 'mjf_printed_parts' else null end),
  track_inventory = case when fulfillment_type = 'fdm' then false else coalesce(track_inventory, true) end,
  inventory_policy = case when fulfillment_type = 'fdm' then 'made_to_order' else coalesce(inventory_policy, 'deny') end;

create index if not exists idx_products_family on products(product_family);
create index if not exists idx_products_brand on products(brand);
create index if not exists idx_products_inventory_policy on products(inventory_policy);

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  media_type text not null default 'image',
  title text not null default '',
  description text default '',
  url text default '',
  storage_path text default '',
  file_path text default '',
  mime_type text default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table product_media enable row level security;
drop policy if exists "Anyone can view active product media" on product_media;
create policy "Anyone can view active product media" on product_media for select to anon, authenticated using (is_active = true);
drop policy if exists "Admins can manage product media" on product_media;
create policy "Admins can manage product media" on product_media for all to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin')) with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

alter table orders add column if not exists discount_code text default '';
alter table orders add column if not exists discount_amount numeric(10,2) default 0;
alter table orders add column if not exists shipping_courier text default '';
alter table orders add column if not exists tracking_url text default '';
alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;
alter table orders add column if not exists admin_notes text default '';
alter table orders add column if not exists fulfillment_notes text default '';

alter table orders drop constraint if exists orders_shipping_status_check;
alter table orders add constraint orders_shipping_status_check check (shipping_status in ('not_required', 'pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'returned'));

create table if not exists order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null,
  recipient_email text not null,
  subject text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  provider_response jsonb default '{}'::jsonb,
  error_message text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_order_notifications_order on order_notifications(order_id);
create index if not exists idx_order_notifications_event on order_notifications(event_type);

alter table order_notifications enable row level security;
drop policy if exists "Users can view own order notifications" on order_notifications;
create policy "Users can view own order notifications" on order_notifications for select to authenticated using (exists (select 1 from orders where orders.id = order_notifications.order_id and orders.user_id = auth.uid()));
drop policy if exists "Admins can view all order notifications" on order_notifications;
create policy "Admins can view all order notifications" on order_notifications for select to authenticated using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create or replace function decrement_product_stock(product_id_input uuid, quantity_input integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update products
  set stock_count = case
    when coalesce(track_inventory, true) = false then stock_count
    when fulfillment_type = 'fdm' then stock_count
    when inventory_policy = 'allow_backorder' then stock_count - greatest(quantity_input, 0)
    when inventory_policy = 'made_to_order' then stock_count
    else greatest(stock_count - greatest(quantity_input, 0), 0)
  end,
  updated_at = now()
  where id = product_id_input;
end;
$$;

create or replace function validate_product_stock(product_id_input uuid, quantity_input integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when is_active = false then false
      when fulfillment_type = 'fdm' then true
      when coalesce(track_inventory, true) = false then true
      when inventory_policy in ('allow_backorder', 'made_to_order') then true
      else stock_count >= greatest(quantity_input, 1)
    end
    from products
    where id = product_id_input
  ), false);
$$;
