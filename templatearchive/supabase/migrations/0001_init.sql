-- Private template archive schema. Run in the Supabase SQL editor (or `supabase db push`).
create extension if not exists pg_trgm;

-- Who may use the app. Rows can only be inserted from the SQL editor / service role.
create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create unique index categories_name_key on public.categories (lower(name));

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create unique index tags_name_key on public.tags (lower(name));

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '' check (char_length(content) <= 200000),
  description text check (char_length(description) <= 1000),
  usage_instructions text check (char_length(usage_instructions) <= 5000),
  source_url text check (char_length(source_url) <= 2000),
  format text not null default 'text' check (format in ('text','markdown','code')),
  status text not null default 'published' check (status in ('draft','published','archived')),
  category_id uuid references public.categories(id) on delete restrict,
  is_favorite boolean not null default false,
  is_pinned boolean not null default false,
  use_count int not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index templates_title_trgm on public.templates using gin (title gin_trgm_ops);
create index templates_content_trgm on public.templates using gin (content gin_trgm_ops);
create index templates_description_trgm on public.templates using gin (description gin_trgm_ops);
create index templates_category_idx on public.templates (category_id);
create index templates_updated_idx on public.templates (updated_at desc);
create index templates_last_used_idx on public.templates (last_used_at desc nulls last);

create table public.template_tags (
  template_id uuid not null references public.templates(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (template_id, tag_id)
);
create index template_tags_tag_idx on public.template_tags (tag_id);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger templates_touch before update on public.templates
  for each row execute function public.touch_updated_at();

-- Row Level Security: nobody but listed admins can read or write anything.
alter table public.app_admins enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.templates enable row level security;
alter table public.template_tags enable row level security;
alter table public.app_settings enable row level security;

create policy admins_self_read on public.app_admins for select to authenticated using (user_id = auth.uid());
create policy owner_all on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy owner_all on public.tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy owner_all on public.templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy owner_all on public.template_tags for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy owner_all on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Defense in depth: the anonymous role gets no table access at all.
revoke all on all tables in schema public from anon;
