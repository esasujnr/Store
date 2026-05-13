create or replace function public.increment_discount_usage(code_input text)
returns void
language plpgsql
security definer
as $$
begin
  update discounts
  set used_count = coalesce(used_count, 0) + 1,
      updated_at = now()
  where upper(code) = upper(code_input)
    and code_input <> '';
end;
$$;

grant execute on function public.increment_discount_usage(text) to service_role;
