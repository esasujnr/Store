alter table site_content
  add column if not exists published_content jsonb not null default '{}'::jsonb;

update site_content
set published_content = case
  when published_content = '{}'::jsonb then content
  else published_content
end;

insert into site_content (key, title, content, published_content, is_published)
values
  ('global_store', 'Global Store Content', '{}'::jsonb, '{}'::jsonb, true),
  ('product_page_template', 'Product Page Template Content', '{}'::jsonb, '{}'::jsonb, true)
on conflict (key) do nothing;
