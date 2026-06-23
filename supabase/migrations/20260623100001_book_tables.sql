-- Slotify (book_*) — tables

create table public.book_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  logo_url text,
  brand_color text default '#0ea5e9',
  confirmation_mode public.book_confirmation_mode not null default 'auto',
  min_lead_minutes int not null default 120,
  max_horizon_days int not null default 60,
  cancel_cutoff_hours int not null default 24,
  allow_any_employee boolean not null default true,
  created_at timestamptz not null default now()
);

create index book_businesses_owner_id_idx on public.book_businesses (owner_id);

create table public.book_service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create index book_service_categories_business_id_idx on public.book_service_categories (business_id);

create table public.book_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  category_id uuid references public.book_service_categories (id) on delete set null,
  name text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0),
  buffer_minutes int not null default 0 check (buffer_minutes >= 0),
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index book_services_business_id_idx on public.book_services (business_id);
create index book_services_category_id_idx on public.book_services (category_id);

create table public.book_employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  full_name text not null,
  email text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index book_employees_business_id_idx on public.book_employees (business_id);

create table public.book_employee_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  employee_id uuid not null references public.book_employees (id) on delete cascade,
  service_id uuid not null references public.book_services (id) on delete cascade,
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  duration_override_minutes int check (duration_override_minutes is null or duration_override_minutes > 0),
  unique (employee_id, service_id)
);

create index book_employee_services_business_id_idx on public.book_employee_services (business_id);
create index book_employee_services_service_id_idx on public.book_employee_services (service_id);
create index book_employee_services_employee_id_idx on public.book_employee_services (employee_id);

create table public.book_business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  open_time time not null,
  close_time time not null check (close_time > open_time),
  is_closed boolean not null default false,
  unique (business_id, weekday)
);

create table public.book_employee_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  employee_id uuid not null references public.book_employees (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  open_time time not null,
  close_time time not null check (close_time > open_time),
  is_closed boolean not null default false,
  unique (employee_id, weekday)
);

create index book_employee_hours_business_id_idx on public.book_employee_hours (business_id);

create table public.book_time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  employee_id uuid references public.book_employees (id) on delete cascade,
  scope public.book_time_off_scope not null,
  type public.book_time_off_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  reason text
);

create index book_time_off_business_id_idx on public.book_time_off (business_id);
create index book_time_off_employee_id_idx on public.book_time_off (employee_id);
create index book_time_off_range_idx on public.book_time_off using gist (tstzrange(starts_at, ends_at));

create table public.book_clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index book_clients_business_id_idx on public.book_clients (business_id);
create unique index book_clients_business_email_key on public.book_clients (business_id, email) where email is not null;
create unique index book_clients_business_phone_key on public.book_clients (business_id, phone) where phone is not null;

create table public.book_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.book_businesses (id) on delete cascade,
  employee_id uuid not null references public.book_employees (id) on delete restrict,
  service_id uuid not null references public.book_services (id) on delete restrict,
  client_id uuid not null references public.book_clients (id) on delete restrict,
  status public.book_booking_status not null default 'pending',
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  buffer_minutes int not null default 0,
  price numeric(10, 2) not null,
  manage_token text not null unique,
  source text not null default 'online',
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book_bookings
  add constraint book_no_overlap_per_employee
  exclude using gist (
    employee_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'));

create index book_bookings_business_id_idx on public.book_bookings (business_id);
create index book_bookings_employee_starts_idx on public.book_bookings (employee_id, starts_at);
create index book_bookings_business_starts_idx on public.book_bookings (business_id, starts_at);
create index book_bookings_status_idx on public.book_bookings (status);
