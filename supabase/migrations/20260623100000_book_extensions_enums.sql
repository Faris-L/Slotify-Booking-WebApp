-- Slotify (book_*) — extensions and enums
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type public.book_booking_status as enum (
  'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
);

create type public.book_confirmation_mode as enum ('auto', 'manual');

create type public.book_time_off_scope as enum ('business', 'employee');

create type public.book_time_off_type as enum ('holiday', 'block', 'break');
