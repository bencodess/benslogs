create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  viewed_at timestamptz not null default now(),
  page text not null default '/'
);

alter table public.page_views enable row level security;

create policy "Anyone can insert page_views"
  on public.page_views for insert
  with check (true);

create policy "Anyone can read page_views"
  on public.page_views for select
  using (true);
