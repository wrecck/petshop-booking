alter table public.appointments
  alter column status set default 'pending';

alter table public.appointments
  drop constraint if exists appointments_no_staff_overlap;

alter table public.appointments
  add constraint appointments_no_staff_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'));

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
