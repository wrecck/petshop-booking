alter table public.shops
  add column if not exists theme_preset text not null default 'sage',
  add column if not exists primary_color text not null default '#2f6256',
  add column if not exists accent_color text not null default '#a35f38',
  add column if not exists background_color text not null default '#fbf8f0',
  add column if not exists surface_color text not null default '#fffefa',
  add column if not exists text_color text not null default '#173c35',
  add column if not exists hero_title text not null default
    'Let’s get your best friend looking their best.',
  add column if not exists hero_subtitle text not null default
    'Pick a service and a time that works for you. We’ll handle the rest.',
  add column if not exists show_ratings boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_theme_preset_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_theme_preset_check check (
        theme_preset in ('sage', 'ocean', 'sunset', 'charcoal', 'custom')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_primary_color_hex_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_primary_color_hex_check check (
        primary_color ~ '^#[0-9A-Fa-f]{6}$'
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_accent_color_hex_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_accent_color_hex_check check (
        accent_color ~ '^#[0-9A-Fa-f]{6}$'
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_background_color_hex_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_background_color_hex_check check (
        background_color ~ '^#[0-9A-Fa-f]{6}$'
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_surface_color_hex_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_surface_color_hex_check check (
        surface_color ~ '^#[0-9A-Fa-f]{6}$'
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_text_color_hex_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_text_color_hex_check check (
        text_color ~ '^#[0-9A-Fa-f]{6}$'
      );
  end if;
end
$$;

create table if not exists public.shop_pages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  content text not null default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, slug),
  check (slug not in ('pages', 'book', 'login', 'dashboard', 'api', 'auth', 'home'))
);

create index if not exists shop_pages_shop_id_idx
  on public.shop_pages (shop_id, sort_order);

alter table public.shop_pages enable row level security;

drop policy if exists "Public can view published shop pages"
  on public.shop_pages;
create policy "Public can view published shop pages"
  on public.shop_pages for select
  using (
    published
    and exists (
      select 1 from public.shops
      where shops.id = shop_pages.shop_id and shops.active
    )
  );

drop policy if exists "Owners manage shop pages"
  on public.shop_pages;
create policy "Owners manage shop pages"
  on public.shop_pages for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = shop_pages.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = shop_pages.shop_id and shops.owner_id = auth.uid()
    )
  );
