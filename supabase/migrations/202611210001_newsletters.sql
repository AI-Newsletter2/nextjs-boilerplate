create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  thumbnail_url text,
  publish_time time not null default '08:00',
  frequency text not null check (
    frequency in ('daily', 'every_other_day', 'weekly', 'monthly')
  ),
  layout jsonb not null default '[]'::jsonb,
  template text not null default 'editorial' check (
    template in ('editorial', 'minimal', 'classic')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletters_user_id_created_at_idx
  on public.newsletters (user_id, created_at desc);

alter table public.newsletters enable row level security;

create policy "Users can read their own newsletters"
  on public.newsletters for select
  using ((select auth.uid()) = user_id);

create policy "Users can create their own newsletters"
  on public.newsletters for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own newsletters"
  on public.newsletters for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own newsletters"
  on public.newsletters for delete
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('newsletter-thumbnails', 'newsletter-thumbnails', true)
on conflict (id) do nothing;

create policy "Users can read newsletter thumbnails"
  on storage.objects for select
  using (bucket_id = 'newsletter-thumbnails');

create policy "Users can upload their own newsletter thumbnails"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'newsletter-thumbnails'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own newsletter thumbnails"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'newsletter-thumbnails'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
