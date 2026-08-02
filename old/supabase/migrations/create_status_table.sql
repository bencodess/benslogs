create table if not exists public.status (
  id bigint generated always as identity primary key,
  message text not null default 'Available',
  updated_at timestamptz not null default now()
);

insert into public.status (message) values ('I''m here — available as usual.')
on conflict (id) do nothing;

alter table public.status enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'status' and policyname = 'Anyone can read status') then
    create policy "Anyone can read status" on public.status for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'status' and policyname = 'Authenticated users can update status') then
    create policy "Authenticated users can update status" on public.status for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;
