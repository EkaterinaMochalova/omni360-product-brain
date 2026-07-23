-- Выполнить один раз в Supabase SQL Editor.
-- Скрипт дополняет уже созданные таблицы и включает безопасный доступ только для авторизованных пользователей.

alter table public.requests add column if not exists type text default 'Feature request';
alter table public.requests add column if not exists normalized_title text not null default '';
alter table public.requests add column if not exists requirement text not null default '';
alter table public.requests add column if not exists problem text not null default '';
alter table public.requests add column if not exists business_value text not null default '';
alter table public.requests add column if not exists acceptance text not null default '';
alter table public.requests add column if not exists uncertainty text not null default '';
alter table public.requests add column if not exists quality text not null default 'Не обработано';

alter table public.categories enable row level security;
alter table public.requests enable row level security;

-- Удаляем политики с такими именами, чтобы скрипт можно было запускать повторно.
drop policy if exists "authenticated users can read categories" on public.categories;
drop policy if exists "authenticated users can insert categories" on public.categories;
drop policy if exists "authenticated users can update categories" on public.categories;
drop policy if exists "authenticated users can delete categories" on public.categories;
drop policy if exists "authenticated users can read requests" on public.requests;
drop policy if exists "authenticated users can insert requests" on public.requests;
drop policy if exists "authenticated users can update requests" on public.requests;
drop policy if exists "authenticated users can delete requests" on public.requests;

create policy "authenticated users can read categories" on public.categories for select to authenticated using (true);
create policy "authenticated users can insert categories" on public.categories for insert to authenticated with check (true);
create policy "authenticated users can update categories" on public.categories for update to authenticated using (true) with check (true);
create policy "authenticated users can delete categories" on public.categories for delete to authenticated using (true);

create policy "authenticated users can read requests" on public.requests for select to authenticated using (true);
create policy "authenticated users can insert requests" on public.requests for insert to authenticated with check (true);
create policy "authenticated users can update requests" on public.requests for update to authenticated using (true) with check (true);
create policy "authenticated users can delete requests" on public.requests for delete to authenticated using (true);
