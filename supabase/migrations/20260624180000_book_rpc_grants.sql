-- Faza 8: revoke public RPC execute on SECURITY DEFINER booking functions.
-- book_create_booking is only called via service_role from server actions.

revoke all on function public.book_create_booking(uuid, uuid, uuid, timestamptz, text, text, text)
  from public, anon, authenticated;

grant execute on function public.book_create_booking(uuid, uuid, uuid, timestamptz, text, text, text)
  to service_role;

-- book_owns_business is used in RLS policies; keep authenticated only.
revoke all on function public.book_owns_business(uuid)
  from public, anon;

grant execute on function public.book_owns_business(uuid)
  to authenticated;
