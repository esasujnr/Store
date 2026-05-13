-- Store upgrades: USD default, sale pricing, discount codes, and reviews

alter table products
  add column if not exists sale_price numeric(10,2),
  add column if not exists sale_label text default '';

alter table orders
  add column if not exists discount_code text default '',
  add column if not exists discount_amount numeric(10,2) default 0;

alter table orders alter column currency set default 'USD';

create table if not exists discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text default '',
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(10,2) not null check (value >= 0),
  minimum_order_amount numeric(10,2) default 0,
  is_active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_discounts_code on discounts(code);
create index if not exists idx_discounts_active on discounts(is_active);

alter table discounts enable row level security;

do $$ begin
  create policy "Anyone can view active discounts"
    on discounts for select
    to anon, authenticated
    using (
      is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can view all discounts"
    on discounts for select
    to authenticated
    using (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can insert discounts"
    on discounts for insert
    to authenticated
    with check (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can update discounts"
    on discounts for update
    to authenticated
    using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can delete discounts"
    on discounts for delete
    to authenticated
    using (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text default '',
  body text default '',
  is_approved boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (product_id, user_id)
);

create index if not exists idx_reviews_product on reviews(product_id);
create index if not exists idx_reviews_approved on reviews(is_approved);

alter table reviews enable row level security;

do $$ begin
  create policy "Anyone can view approved reviews"
    on reviews for select
    to anon, authenticated
    using (is_approved = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own reviews"
    on reviews for insert
    to authenticated
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own reviews"
    on reviews for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all reviews"
    on reviews for all
    to authenticated
    using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

drop trigger if exists set_discounts_updated_at on discounts;
create trigger set_discounts_updated_at
  before update on discounts
  for each row execute function set_updated_at();

drop trigger if exists set_reviews_updated_at on reviews;
create trigger set_reviews_updated_at
  before update on reviews
  for each row execute function set_updated_at();
