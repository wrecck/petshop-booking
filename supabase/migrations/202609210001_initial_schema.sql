create extension if not exists btree_gist;

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
    check (slug not in ('api', 'auth', 'book', 'dashboard', 'home', 'login')),
  timezone text not null default 'America/Los_Angeles',
  currency text not null default 'USD' check (
    currency in ('USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'PHP')
  ),
  theme_preset text not null default 'sage' check (
    theme_preset in ('sage', 'ocean', 'sunset', 'charcoal', 'custom')
  ),
  primary_color text not null default '#2f6256'
    check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null default '#a35f38'
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text not null default '#fbf8f0'
    check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  surface_color text not null default '#fffefa'
    check (surface_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color text not null default '#173c35'
    check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  hero_title text not null default
    'Let’s get your best friend looking their best.',
  hero_subtitle text not null default
    'Pick a service and a time that works for you. We’ll handle the rest.',
  show_ratings boolean not null default true,
  address text,
  city text,
  state text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_pages (
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

create index shop_pages_shop_id_idx
  on public.shop_pages (shop_id, sort_order);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 15 and 480),
  price_cents integer not null check (price_cents >= 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text not null default 'Groomer',
  initials text not null default '',
  color text not null default 'sage',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff_services (
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at time not null default '09:00',
  closes_at time not null default '17:00',
  closed boolean not null default false,
  unique (shop_id, day_of_week),
  check (closed or closes_at > opens_at)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_shop_email_key
  on public.customers (shop_id, lower(email));

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  pet_type text not null default 'Dog',
  breed text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  service_id uuid not null references public.services(id),
  staff_id uuid not null references public.staff(id),
  customer_id uuid not null references public.customers(id),
  pet_id uuid not null references public.pets(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint appointments_no_staff_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index appointments_shop_starts_at_idx
  on public.appointments (shop_id, starts_at);
create index appointments_customer_idx on public.appointments (customer_id);

alter table public.shops enable row level security;
alter table public.shop_pages enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_services enable row level security;
alter table public.business_hours enable row level security;
alter table public.customers enable row level security;
alter table public.pets enable row level security;
alter table public.appointments enable row level security;

create policy "Public can view active shops"
  on public.shops for select
  using (active);
create policy "Owners manage their shops"
  on public.shops for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Public can view published shop pages"
  on public.shop_pages for select
  using (
    published
    and exists (
      select 1 from public.shops
      where shops.id = shop_pages.shop_id and shops.active
    )
  );
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

create policy "Public can view active services"
  on public.services for select
  using (
    active and exists (
      select 1 from public.shops
      where shops.id = services.shop_id and shops.active
    )
  );
create policy "Owners manage services"
  on public.services for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = services.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = services.shop_id and shops.owner_id = auth.uid()
    )
  );

create policy "Public can view active staff"
  on public.staff for select
  using (
    active and exists (
      select 1 from public.shops
      where shops.id = staff.shop_id and shops.active
    )
  );
create policy "Owners manage staff"
  on public.staff for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = staff.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = staff.shop_id and shops.owner_id = auth.uid()
    )
  );

create policy "Public can view staff services"
  on public.staff_services for select using (true);
create policy "Owners manage staff services"
  on public.staff_services for all to authenticated
  using (
    exists (
      select 1
      from public.staff
      join public.shops on shops.id = staff.shop_id
      where staff.id = staff_services.staff_id
        and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.staff
      join public.shops on shops.id = staff.shop_id
      where staff.id = staff_services.staff_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "Public can view business hours"
  on public.business_hours for select using (true);
create policy "Owners manage business hours"
  on public.business_hours for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = business_hours.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = business_hours.shop_id and shops.owner_id = auth.uid()
    )
  );

create policy "Owners view customers"
  on public.customers for select to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id and shops.owner_id = auth.uid()
    )
  );
create policy "Owners manage customers"
  on public.customers for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id and shops.owner_id = auth.uid()
    )
  );

create policy "Owners view pets"
  on public.pets for select to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = pets.shop_id and shops.owner_id = auth.uid()
    )
  );
create policy "Owners manage pets"
  on public.pets for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = pets.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = pets.shop_id and shops.owner_id = auth.uid()
    )
  );

create policy "Owners view appointments"
  on public.appointments for select to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = appointments.shop_id and shops.owner_id = auth.uid()
    )
  );
create policy "Owners manage appointments"
  on public.appointments for all to authenticated
  using (
    exists (
      select 1 from public.shops
      where shops.id = appointments.shop_id and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = appointments.shop_id and shops.owner_id = auth.uid()
    )
  );

create or replace function public.get_available_slots(
  p_shop_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_date date
)
returns table (
  starts_at timestamptz,
  display_time text,
  staff_id uuid,
  staff_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select
      shops.id as shop_id,
      shops.timezone,
      services.duration_minutes
    from public.shops
    join public.services on services.shop_id = shops.id
    where shops.slug = p_shop_slug
      and shops.active
      and services.id = p_service_id
      and services.active
  ),
  hours as (
    select
      target.*,
      business_hours.opens_at,
      business_hours.closes_at
    from target
    join public.business_hours
      on business_hours.shop_id = target.shop_id
      and business_hours.day_of_week = extract(dow from p_date)::integer
    where not business_hours.closed
  ),
  qualified_staff as (
    select staff.id, staff.name
    from public.staff
    join target on target.shop_id = staff.shop_id
    join public.staff_services
      on staff_services.staff_id = staff.id
      and staff_services.service_id = p_service_id
    where staff.active and (p_staff_id is null or staff.id = p_staff_id)
  ),
  slots as (
    select
      generated.starts_at,
      hours.timezone,
      hours.duration_minutes
    from hours
    cross join lateral generate_series(
      (p_date + hours.opens_at) at time zone hours.timezone,
      ((p_date + hours.closes_at) at time zone hours.timezone)
        - make_interval(mins => hours.duration_minutes),
      interval '30 minutes'
    ) as generated(starts_at)
  )
  select distinct on (slots.starts_at)
    slots.starts_at,
    to_char(slots.starts_at at time zone slots.timezone, 'FMHH12:MI AM'),
    qualified_staff.id,
    qualified_staff.name
  from slots
  cross join qualified_staff
  where not exists (
    select 1
    from public.appointments
    where appointments.staff_id = qualified_staff.id
      and appointments.status in ('pending', 'confirmed')
      and tstzrange(appointments.starts_at, appointments.ends_at, '[)')
        && tstzrange(
          slots.starts_at,
          slots.starts_at + make_interval(mins => slots.duration_minutes),
          '[)'
        )
  )
  order by slots.starts_at, qualified_staff.name;
$$;

create or replace function public.book_appointment(
  p_shop_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_pet_name text,
  p_pet_type text,
  p_pet_breed text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop public.shops;
  v_service public.services;
  v_customer_id uuid;
  v_pet_id uuid;
  v_appointment_id uuid;
begin
  select * into v_shop
  from public.shops
  where slug = p_shop_slug and active;

  if v_shop.id is null then
    raise exception 'Shop is not available';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and shop_id = v_shop.id and active;

  if v_service.id is null or not exists (
    select 1
    from public.staff
    join public.staff_services on staff_services.staff_id = staff.id
    where staff.id = p_staff_id
      and staff.shop_id = v_shop.id
      and staff.active
      and staff_services.service_id = v_service.id
  ) then
    raise exception 'Service or staff is not available';
  end if;

  if not exists (
    select 1
    from public.get_available_slots(
      p_shop_slug,
      p_service_id,
      p_staff_id,
      (p_starts_at at time zone v_shop.timezone)::date
    )
    where starts_at = p_starts_at and staff_id = p_staff_id
  ) then
    raise exception 'Selected time is not available';
  end if;

  insert into public.customers (shop_id, name, email, phone)
  values (
    v_shop.id,
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    nullif(trim(p_customer_phone), '')
  )
  on conflict (shop_id, lower(email))
  do update set
    name = excluded.name,
    phone = coalesce(excluded.phone, customers.phone),
    updated_at = now()
  returning id into v_customer_id;

  select id into v_pet_id
  from public.pets
  where customer_id = v_customer_id
    and lower(name) = lower(trim(p_pet_name))
  limit 1;

  if v_pet_id is null then
    insert into public.pets (
      shop_id,
      customer_id,
      name,
      pet_type,
      breed
    )
    values (
      v_shop.id,
      v_customer_id,
      trim(p_pet_name),
      coalesce(nullif(trim(p_pet_type), ''), 'Dog'),
      nullif(trim(p_pet_breed), '')
    )
    returning id into v_pet_id;
  end if;

  insert into public.appointments (
    shop_id,
    service_id,
    staff_id,
    customer_id,
    pet_id,
    starts_at,
    ends_at,
    notes
  )
  values (
    v_shop.id,
    v_service.id,
    p_staff_id,
    v_customer_id,
    v_pet_id,
    p_starts_at,
    p_starts_at + make_interval(mins => v_service.duration_minutes),
    nullif(trim(p_notes), '')
  )
  returning id into v_appointment_id;

  return v_appointment_id;
exception
  when exclusion_violation then
    raise exception 'Selected time is not available';
end;
$$;

create or replace function public.create_shop_with_defaults(
  p_name text,
  p_slug text,
  p_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_staff_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if exists (select 1 from public.shops where owner_id = auth.uid()) then
    raise exception 'You already own a shop';
  end if;

  insert into public.shops (owner_id, name, slug, timezone)
  values (auth.uid(), trim(p_name), lower(trim(p_slug)), p_timezone)
  returning id into v_shop_id;

  insert into public.staff (shop_id, user_id, name, role, initials, color)
  values (
    v_shop_id,
    auth.uid(),
    coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Owner'),
    'Owner & groomer',
    upper(left(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', 'OW'), 2)),
    'sage'
  )
  returning id into v_staff_id;

  with inserted_services as (
    insert into public.services (
      shop_id,
      name,
      description,
      duration_minutes,
      price_cents,
      sort_order
    )
    values
      (v_shop_id, 'The Full Groom', 'Bath, haircut, nail trim & finishing spritz', 90, 8500, 1),
      (v_shop_id, 'Bath & Brush', 'Deep-cleansing bath, blow-dry & brush out', 60, 5500, 2),
      (v_shop_id, 'Puppy''s First Visit', 'A gentle introduction for pups under 6 months', 45, 4500, 3)
    returning id
  )
  insert into public.staff_services (staff_id, service_id)
  select v_staff_id, id from inserted_services;

  insert into public.business_hours (
    shop_id,
    day_of_week,
    opens_at,
    closes_at,
    closed
  )
  select
    v_shop_id,
    day_number,
    '09:00'::time,
    '17:00'::time,
    day_number = 0
  from generate_series(0, 6) as day_number;

  return v_shop_id;
end;
$$;

revoke all on function public.book_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text, text, text, text
) from public;
grant execute on function public.book_appointment(
  text, uuid, uuid, timestamptz, text, text, text, text, text, text, text
) to anon, authenticated;
grant execute on function public.get_available_slots(text, uuid, uuid, date)
  to anon, authenticated;
grant execute on function public.create_shop_with_defaults(text, text, text)
  to authenticated;
