-- Default checkout/order currency should be Ghana cedi for Wingxtra Store
alter table public.orders
  alter column currency set default 'GHS';
