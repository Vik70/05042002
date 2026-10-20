-- Editable content for the memories site.
-- Paste this whole file into the Supabase SQL Editor and press Run. It is safe to run again.
--
-- Tables live in a private schema the Data API never exposes. The site only talks to the
-- database through the aanavee_* functions below, and every one of them requires the
-- server-side MEMORIES_TOKEN, so the publishable key on its own cannot read or change anything.

create schema if not exists aanavee;
revoke all on schema aanavee from public, anon, authenticated;

create table if not exists aanavee.settings (
  name text primary key,
  value text not null
);

create table if not exists aanavee.content (
  key text primary key check (key ~ '^[a-z0-9][a-z0-9:_-]{0,79}$'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table aanavee.settings enable row level security;
alter table aanavee.content enable row level security;
revoke all on all tables in schema aanavee from public, anon, authenticated;

create or replace function aanavee.assert_token(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
begin
  select s.value into expected from aanavee.settings s where s.name = 'api_token';
  if expected is null or p_token is null or expected <> p_token then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
end;
$$;

revoke all on function aanavee.assert_token(text) from public, anon, authenticated;

-- The first server to call this with a long random token becomes the only one allowed in.
create or replace function public.aanavee_claim(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(coalesce(p_token, '')) < 32 then
    raise exception 'token too short' using errcode = '22023';
  end if;

  insert into aanavee.settings (name, value)
  values ('api_token', p_token)
  on conflict (name) do nothing;

  return exists (
    select 1 from aanavee.settings s where s.name = 'api_token' and s.value = p_token
  );
end;
$$;

create or replace function public.aanavee_list(p_token text)
returns table (key text, data jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform aanavee.assert_token(p_token);
  return query select c.key, c.data, c.updated_at from aanavee.content c;
end;
$$;

create or replace function public.aanavee_put(p_token text, p_key text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_at timestamptz;
begin
  perform aanavee.assert_token(p_token);

  insert into aanavee.content (key, data, updated_at)
  values (p_key, coalesce(p_data, '{}'::jsonb), now())
  on conflict (key) do update set data = excluded.data, updated_at = now()
  returning updated_at into saved_at;

  return saved_at;
end;
$$;

create or replace function public.aanavee_delete(p_token text, p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform aanavee.assert_token(p_token);
  delete from aanavee.content c where c.key = p_key;
end;
$$;

revoke all on function public.aanavee_claim(text) from public;
revoke all on function public.aanavee_list(text) from public;
revoke all on function public.aanavee_put(text, text, jsonb) from public;
revoke all on function public.aanavee_delete(text, text) from public;

grant execute on function public.aanavee_claim(text) to anon;
grant execute on function public.aanavee_list(text) to anon;
grant execute on function public.aanavee_put(text, text, jsonb) to anon;
grant execute on function public.aanavee_delete(text, text) to anon;
