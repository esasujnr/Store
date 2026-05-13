create table if not exists site_content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_key text not null,
  title text not null default '',
  action text not null default 'draft',
  content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_by uuid null references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_content_revisions_key_created
  on site_content_revisions(content_key, created_at desc);

alter table site_content_revisions enable row level security;

drop policy if exists "Admins can view site content revisions" on site_content_revisions;
create policy "Admins can view site content revisions"
  on site_content_revisions for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can create site content revisions" on site_content_revisions;
create policy "Admins can create site content revisions"
  on site_content_revisions for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete site content revisions" on site_content_revisions;
create policy "Admins can delete site content revisions"
  on site_content_revisions for delete
  to authenticated
  using (public.is_admin(auth.uid()));

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read product media files" on storage.objects;
create policy "Public read product media files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-media');

drop policy if exists "Admins can upload product media files" on storage.objects;
create policy "Admins can upload product media files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-media'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can update product media files" on storage.objects;
create policy "Admins can update product media files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-media'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'product-media'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can delete product media files" on storage.objects;
create policy "Admins can delete product media files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-media'
    and public.is_admin(auth.uid())
  );
