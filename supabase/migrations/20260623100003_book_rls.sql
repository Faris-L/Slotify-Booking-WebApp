-- Slotify (book_*) — RLS policies

alter table public.book_businesses enable row level security;
alter table public.book_service_categories enable row level security;
alter table public.book_services enable row level security;
alter table public.book_employees enable row level security;
alter table public.book_employee_services enable row level security;
alter table public.book_business_hours enable row level security;
alter table public.book_employee_hours enable row level security;
alter table public.book_time_off enable row level security;
alter table public.book_clients enable row level security;
alter table public.book_bookings enable row level security;

-- Owner: businesses
create policy book_owner_select_business on public.book_businesses
  for select to authenticated
  using (owner_id = auth.uid());

create policy book_owner_insert_business on public.book_businesses
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy book_owner_update_business on public.book_businesses
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy book_public_read_business on public.book_businesses
  for select to anon, authenticated
  using (true);

-- Owner: tenant tables
create policy book_owner_all_service_categories on public.book_service_categories
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_services on public.book_services
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_employees on public.book_employees
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_employee_services on public.book_employee_services
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_business_hours on public.book_business_hours
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_employee_hours on public.book_employee_hours
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_time_off on public.book_time_off
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_clients on public.book_clients
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

create policy book_owner_all_bookings on public.book_bookings
  for all to authenticated
  using (public.book_owns_business(business_id))
  with check (public.book_owns_business(business_id));

-- Public read (anon + authenticated guests)
create policy book_public_read_active_services on public.book_services
  for select to anon, authenticated
  using (is_active = true);

create policy book_public_read_active_employees on public.book_employees
  for select to anon, authenticated
  using (is_active = true);

create policy book_public_read_employee_services on public.book_employee_services
  for select to anon, authenticated
  using (true);

create policy book_public_read_business_hours on public.book_business_hours
  for select to anon, authenticated
  using (true);

create policy book_public_read_employee_hours on public.book_employee_hours
  for select to anon, authenticated
  using (true);

create policy book_public_read_time_off on public.book_time_off
  for select to anon, authenticated
  using (true);
