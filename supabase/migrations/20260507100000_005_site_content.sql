create table if not exists site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_by uuid null references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

do $$ begin
  create policy "site content public read published"
    on site_content for select
    to anon, authenticated
    using (is_published = true or public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site content admin insert"
    on site_content for insert
    to authenticated
    with check (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site content admin update"
    on site_content for update
    to authenticated
    using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site content admin delete"
    on site_content for delete
    to authenticated
    using (public.is_admin(auth.uid()));
exception when duplicate_object then null; end $$;

drop trigger if exists set_site_content_updated_at on site_content;
create trigger set_site_content_updated_at
  before update on site_content
  for each row execute function set_updated_at();

insert into site_content (key, title, content, published_content, is_published)
values
  ('home_page', 'Home Page Content', '{}'::jsonb, '{}'::jsonb, true),
  ('drones_page', 'Drone Collection Content', '{}'::jsonb, '{}'::jsonb, true),
  ('shop_page', 'Shop Catalog Content', '{}'::jsonb, '{}'::jsonb, true)
on conflict (key) do nothing;
