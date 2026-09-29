alter table public.shops drop constraint if exists shops_currency_check;

alter table public.shops
  add constraint shops_currency_check check (
    currency in ('USD', 'CAD', 'GBP', 'EUR', 'AUD', 'NZD', 'PHP')
  );
