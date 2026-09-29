alter table public.shops
  add column if not exists currency text not null default 'USD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_currency_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_currency_check check (
        currency in ('USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shops_slug_reserved_check'
      and conrelid = 'public.shops'::regclass
  ) then
    alter table public.shops
      add constraint shops_slug_reserved_check check (
        slug not in ('api', 'auth', 'book', 'dashboard', 'home', 'login')
      );
  end if;
end
$$;

drop policy if exists "Owners manage staff services"
  on public.staff_services;

create policy "Owners manage staff services"
  on public.staff_services for all to authenticated
  using (
    exists (
      select 1
      from public.staff
      join public.services on services.id = staff_services.service_id
      join public.shops on shops.id = staff.shop_id
      where staff.id = staff_services.staff_id
        and services.shop_id = staff.shop_id
        and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.staff
      join public.services on services.id = staff_services.service_id
      join public.shops on shops.id = staff.shop_id
      where staff.id = staff_services.staff_id
        and services.shop_id = staff.shop_id
        and shops.owner_id = auth.uid()
    )
  );
