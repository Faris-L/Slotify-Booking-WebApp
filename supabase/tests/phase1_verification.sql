-- Slotify Faza 1 — verifikacija RLS izolacije i exclusion constraint-a
-- Pokreni: Supabase SQL Editor ili MCP execute_sql (service role)
-- Test podaci se kreiraju i brišu u istoj sesiji.
--
-- Napomena: book_businesses ima namjernu javnu SELECT politiku (/{slug} stranica).
-- RLS izolacija se testira na book_clients i book_bookings (bez javnog read-a).

DO $$
DECLARE
  user_a uuid := '50b34f4d-8372-465c-a780-5a30a14eff28';
  user_b uuid := '67fd28ce-d8f5-411e-b438-1f7bcc3ce52d';
  biz_a uuid;
  biz_b uuid;
  emp_a uuid;
  emp_b uuid;
  svc_a uuid;
  svc_b uuid;
  client_a uuid;
  client_b uuid;
  own_clients_a int;
  leak_clients_b int;
  own_clients_b int;
  leak_clients_a int;
  leak_bookings int;
  overlap_caught boolean := false;
  slot_start timestamptz := '2030-06-01 10:00:00+00';
  slot_end timestamptz := '2030-06-01 11:00:00+00';
BEGIN
  DELETE FROM public.book_bookings WHERE business_id IN (
    SELECT id FROM public.book_businesses WHERE slug LIKE 'book-phase1-test-%'
  );
  DELETE FROM public.book_clients WHERE business_id IN (
    SELECT id FROM public.book_businesses WHERE slug LIKE 'book-phase1-test-%'
  );
  DELETE FROM public.book_employee_services WHERE business_id IN (
    SELECT id FROM public.book_businesses WHERE slug LIKE 'book-phase1-test-%'
  );
  DELETE FROM public.book_employees WHERE business_id IN (
    SELECT id FROM public.book_businesses WHERE slug LIKE 'book-phase1-test-%'
  );
  DELETE FROM public.book_services WHERE business_id IN (
    SELECT id FROM public.book_businesses WHERE slug LIKE 'book-phase1-test-%'
  );
  DELETE FROM public.book_businesses WHERE slug LIKE 'book-phase1-test-%';

  INSERT INTO public.book_businesses (owner_id, name, slug)
  VALUES (user_a, 'Phase1 Test Salon A', 'book-phase1-test-a')
  RETURNING id INTO biz_a;

  INSERT INTO public.book_businesses (owner_id, name, slug)
  VALUES (user_b, 'Phase1 Test Salon B', 'book-phase1-test-b')
  RETURNING id INTO biz_b;

  INSERT INTO public.book_employees (business_id, full_name)
  VALUES (biz_a, 'Test Employee A')
  RETURNING id INTO emp_a;

  INSERT INTO public.book_employees (business_id, full_name)
  VALUES (biz_b, 'Test Employee B')
  RETURNING id INTO emp_b;

  INSERT INTO public.book_services (business_id, name, duration_minutes, price)
  VALUES (biz_a, 'Test Haircut A', 60, 25.00)
  RETURNING id INTO svc_a;

  INSERT INTO public.book_services (business_id, name, duration_minutes, price)
  VALUES (biz_b, 'Test Haircut B', 60, 30.00)
  RETURNING id INTO svc_b;

  INSERT INTO public.book_employee_services (business_id, employee_id, service_id)
  VALUES (biz_a, emp_a, svc_a), (biz_b, emp_b, svc_b);

  INSERT INTO public.book_clients (business_id, full_name, email)
  VALUES (biz_a, 'Client A', 'book-phase1-a@test.local')
  RETURNING id INTO client_a;

  INSERT INTO public.book_clients (business_id, full_name, email)
  VALUES (biz_b, 'Client B', 'book-phase1-b@test.local')
  RETURNING id INTO client_b;

  INSERT INTO public.book_bookings (
    business_id, employee_id, service_id, client_id,
    status, starts_at, ends_at, price, manage_token
  ) VALUES (
    biz_b, emp_b, svc_b, client_b,
    'confirmed', '2030-07-01 10:00:00+00', '2030-07-01 11:00:00+00',
    30.00, 'book-phase1-b-booking'
  );

  -- Test 1: korisnik A — vidi svoje klijente, ne tuđe
  PERFORM set_config('request.jwt.claim.sub', user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  SELECT count(*)::int INTO own_clients_a
  FROM public.book_clients
  WHERE business_id = biz_a;

  SELECT count(*)::int INTO leak_clients_b
  FROM public.book_clients
  WHERE business_id = biz_b;

  SELECT count(*)::int INTO leak_bookings
  FROM public.book_bookings
  WHERE business_id = biz_b;

  RESET ROLE;

  IF own_clients_a <> 1 THEN
    RAISE EXCEPTION 'RLS FAIL (user A own clients): očekivan 1, dobijeno %', own_clients_a;
  END IF;
  IF leak_clients_b <> 0 THEN
    RAISE EXCEPTION 'RLS FAIL (user A): vidi klijente biznisa B (%)', leak_clients_b;
  END IF;
  IF leak_bookings <> 0 THEN
    RAISE EXCEPTION 'RLS FAIL (user A): vidi rezervacije biznisa B (%)', leak_bookings;
  END IF;

  -- Test 2: korisnik B — simetrično
  PERFORM set_config('request.jwt.claim.sub', user_b::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  SELECT count(*)::int INTO own_clients_b
  FROM public.book_clients
  WHERE business_id = biz_b;

  SELECT count(*)::int INTO leak_clients_a
  FROM public.book_clients
  WHERE business_id = biz_a;

  SELECT count(*)::int INTO leak_bookings
  FROM public.book_bookings
  WHERE business_id = biz_a;

  RESET ROLE;

  IF own_clients_b <> 1 THEN
    RAISE EXCEPTION 'RLS FAIL (user B own clients): očekivan 1, dobijeno %', own_clients_b;
  END IF;
  IF leak_clients_a <> 0 THEN
    RAISE EXCEPTION 'RLS FAIL (user B): vidi klijente biznisa A (%)', leak_clients_a;
  END IF;
  IF leak_bookings <> 0 THEN
    RAISE EXCEPTION 'RLS FAIL (user B): vidi rezervacije biznisa A (%)', leak_bookings;
  END IF;

  -- Test 3: exclusion constraint
  INSERT INTO public.book_bookings (
    business_id, employee_id, service_id, client_id,
    status, starts_at, ends_at, price, manage_token
  ) VALUES (
    biz_a, emp_a, svc_a, client_a,
    'confirmed', slot_start, slot_end, 25.00, 'book-phase1-token-1'
  );

  BEGIN
    INSERT INTO public.book_bookings (
      business_id, employee_id, service_id, client_id,
      status, starts_at, ends_at, price, manage_token
    ) VALUES (
      biz_a, emp_a, svc_a, client_a,
      'confirmed',
      slot_start + interval '30 minutes',
      slot_end + interval '30 minutes',
      25.00, 'book-phase1-token-2'
    );
  EXCEPTION
    WHEN exclusion_violation THEN
      overlap_caught := true;
  END;

  IF NOT overlap_caught THEN
    RAISE EXCEPTION 'CONSTRAINT FAIL: preklapajući termin nije odbijen';
  END IF;

  DELETE FROM public.book_bookings WHERE business_id IN (biz_a, biz_b);
  DELETE FROM public.book_clients WHERE business_id IN (biz_a, biz_b);
  DELETE FROM public.book_employee_services WHERE business_id IN (biz_a, biz_b);
  DELETE FROM public.book_employees WHERE business_id IN (biz_a, biz_b);
  DELETE FROM public.book_services WHERE business_id IN (biz_a, biz_b);
  DELETE FROM public.book_businesses WHERE id IN (biz_a, biz_b);

  RAISE NOTICE 'Faza 1 PASS: RLS izolacija klijenata/rezervacija OK, exclusion constraint OK';
END $$;
