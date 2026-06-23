-- Slotify (book_*) — helper functions and RPC

create or replace function public.book_owns_business(b_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.book_businesses
    where id = b_id and owner_id = auth.uid()
  );
$$;

create or replace function public.book_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger book_bookings_set_updated_at
  before update on public.book_bookings
  for each row
  execute function public.book_set_updated_at();

create or replace function public.book_create_booking(
  p_business_id uuid,
  p_employee_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text
)
returns public.book_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.book_services%rowtype;
  v_es public.book_employee_services%rowtype;
  v_duration int;
  v_buffer int;
  v_price numeric(10, 2);
  v_ends timestamptz;
  v_client_id uuid;
  v_booking public.book_bookings%rowtype;
  v_mode public.book_confirmation_mode;
  v_email text;
  v_phone text;
begin
  select * into v_service
  from public.book_services
  where id = p_service_id and business_id = p_business_id;

  if not found then
    raise exception 'Service not found';
  end if;

  select * into v_es
  from public.book_employee_services
  where employee_id = p_employee_id and service_id = p_service_id;

  if not found then
    raise exception 'Employee does not offer service';
  end if;

  v_duration := coalesce(v_es.duration_override_minutes, v_service.duration_minutes);
  v_buffer := v_service.buffer_minutes;
  v_price := coalesce(v_es.price_override, v_service.price);
  v_ends := p_starts_at + make_interval(mins => v_duration);
  v_email := nullif(trim(p_client_email), '');
  v_phone := nullif(trim(p_client_phone), '');

  if v_email is not null then
    insert into public.book_clients (business_id, full_name, email, phone)
    values (p_business_id, p_client_name, v_email, v_phone)
    on conflict (business_id, email) where (email is not null)
    do update set
      full_name = excluded.full_name,
      phone = coalesce(excluded.phone, public.book_clients.phone)
    returning id into v_client_id;
  elsif v_phone is not null then
    insert into public.book_clients (business_id, full_name, email, phone)
    values (p_business_id, p_client_name, v_email, v_phone)
    on conflict (business_id, phone) where (phone is not null)
    do update set full_name = excluded.full_name
    returning id into v_client_id;
  else
    insert into public.book_clients (business_id, full_name, email, phone)
    values (p_business_id, p_client_name, v_email, v_phone)
    returning id into v_client_id;
  end if;

  select confirmation_mode into v_mode
  from public.book_businesses
  where id = p_business_id;

  insert into public.book_bookings (
    business_id,
    employee_id,
    service_id,
    client_id,
    status,
    starts_at,
    ends_at,
    buffer_minutes,
    price,
    manage_token,
    source
  ) values (
    p_business_id,
    p_employee_id,
    p_service_id,
    v_client_id,
    case when v_mode = 'auto' then 'confirmed'::public.book_booking_status else 'pending'::public.book_booking_status end,
    p_starts_at,
    v_ends,
    v_buffer,
    v_price,
    replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'),
    'online'
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.book_owns_business(uuid) to authenticated, anon;
grant execute on function public.book_create_booking(uuid, uuid, uuid, timestamptz, text, text, text) to service_role;
