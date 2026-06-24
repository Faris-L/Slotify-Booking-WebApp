-- Public read for service categories (needed for /{slug} catalog SSR)

create policy book_public_read_service_categories on public.book_service_categories
  for select to anon, authenticated
  using (true);
