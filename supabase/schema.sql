-- ================================================================
-- SPD LOGISTICS — MASTER SUPABASE CLOUD DATABASE SCHEMA
-- Centralized cross-device synchronized database (Zero-Meter Fresh State)
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. BILTIES TABLE
create table if not exists bilties (
  id text primary key default gen_random_uuid()::text,
  bilty_number text not null,
  manual_bilty_number text,
  sender_name text not null default 'Walk-in Shipper',
  receiver_name text not null default 'Consignee',
  origin_station text not null default 'Karachi',
  destination_station text not null default 'Lahore',
  freight_amount numeric not null default 0,
  advance_paid numeric not null default 0,
  remaining_balance numeric not null default 0,
  status text not null default 'Booked',
  payment_mode text not null default 'TO-PAY',
  -- Backward-compatibility & extended fields
  booking_date text,
  sender_phone text,
  receiver_phone text,
  origin text,
  destination text,
  item_description text,
  packages_count integer default 1,
  weight numeric default 0,
  total_freight numeric default 0,
  payment_status text default 'PENDING',
  vehicle_number text,
  driver_name text,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- 2. CUSTOMERS / PARTIES TABLE
create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  email text,
  address text,
  city text,
  opening_balance numeric default 0,
  current_balance numeric default 0,
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. CASH BOOKS TABLE
create table if not exists cash_books (
  id text primary key,
  date text not null,
  description text,
  category text,
  party text,
  type text not null, -- 'IN' or 'OUT'
  amount numeric not null default 0,
  balance numeric default 0,
  created_at timestamptz default now()
);

-- 4. CHALLANS TABLE
create table if not exists challans (
  id text primary key,
  challan_number text not null,
  vehicle_number text,
  driver_name text,
  driver_phone text,
  origin text,
  destination text,
  total_truck_hire numeric default 0,
  advance_paid numeric default 0,
  balance_payable numeric default 0,
  status text default 'In Transit',
  created_at timestamptz default now()
);

-- 5. DRIVERS TABLE
create table if not exists drivers (
  id text primary key,
  name text not null,
  phone text,
  cnic text,
  license_number text,
  vehicle_number text,
  status text default 'Active',
  avatar_url text,
  created_at timestamptz default now()
);

-- 6. VEHICLES TABLE
create table if not exists vehicles (
  id text primary key,
  vehicle_number text not null,
  registration_number text,
  vehicle_type text default 'Mazda / Linehaul Truck',
  capacity text,
  driver_name text,
  driver_phone text,
  status text default 'Available',
  created_at timestamptz default now()
);

-- 6b. BROKERS TABLE
create table if not exists brokers (
  id text primary key,
  name text not null,
  phone text,
  company_name text,
  city text default 'Karachi',
  balance numeric default 0,
  status text default 'ACTIVE',
  created_at timestamptz default now()
);

-- 7. ACCOUNTS & FINANCIAL LEDGERS
create table if not exists accounts (
  id text primary key,
  account_title text not null,
  account_number text,
  bank_name text,
  branch text,
  balance numeric default 0,
  created_at timestamptz default now()
);

-- 8. RECEIVABLES TABLE
create table if not exists receivables (
  id text primary key,
  bilty_id text,
  customer_name text,
  amount numeric default 0,
  due_date text,
  status text default 'Unpaid',
  created_at timestamptz default now()
);

-- 9. PAYABLES TABLE
create table if not exists payables (
  id text primary key,
  challan_id text,
  vendor_name text,
  amount numeric default 0,
  due_date text,
  status text default 'Unpaid',
  created_at timestamptz default now()
);

-- 10. DELIVERIES TABLE
create table if not exists deliveries (
  id text primary key,
  bilty_id text,
  bilty_number text not null,
  delivered_to text,
  delivery_date text,
  status text default 'Delivered',
  receiver_signature text,
  remarks text,
  created_at timestamptz default now()
);

-- 11. NOTIFICATIONS TABLE
create table if not exists notifications (
  id text primary key,
  title text not null,
  message text not null,
  type text default 'INFO',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 12. USERS & ROLES TABLE
create table if not exists users (
  id text primary key,
  name text,
  email text unique,
  phone text,
  role text default 'SUPER_ADMIN',
  avatar text,
  avatar_url text,
  status text default 'ACTIVE',
  created_at timestamptz default now()
);

-- 12. SYSTEM SETTINGS TABLE (Cloud settings & global configurations)
create table if not exists system_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Ensure columns exist in case of preexisting tables
alter table customers add column if not exists current_balance numeric default 0;
alter table customers add column if not exists opening_balance numeric default 0;
alter table customers add column if not exists avatar_url text;
alter table drivers add column if not exists avatar_url text;
alter table drivers add column if not exists vehicle_number text;
alter table vehicles add column if not exists driver_phone text;

-- Disable Row Level Security (RLS) for seamless instant sync across all client devices
alter table bilties disable row level security;
alter table customers disable row level security;
alter table cash_books disable row level security;
alter table challans disable row level security;
alter table drivers disable row level security;
alter table vehicles disable row level security;
alter table accounts disable row level security;
alter table receivables disable row level security;
alter table payables disable row level security;
alter table deliveries disable row level security;
alter table notifications disable row level security;
alter table users disable row level security;
alter table system_settings disable row level security;
alter table brokers disable row level security;

-- Setup Supabase Storage Bucket for Profile Avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public Access to Avatars" on storage.objects
for select using (bucket_id = 'avatars');

create policy "Upload Access to Avatars" on storage.objects
for insert with check (bucket_id = 'avatars');

create policy "Update Access to Avatars" on storage.objects
for update using (bucket_id = 'avatars');

create policy "Delete Access to Avatars" on storage.objects
for delete using (bucket_id = 'avatars');

-- Zero-Meter Clean Slate Guarantee (Wipes any testing rows for production deployment)
truncate table bilties;
truncate table challans;
truncate table cash_books;
truncate table customers;
truncate table drivers;
truncate table vehicles;
truncate table accounts;
truncate table receivables;
truncate table payables;
truncate table deliveries;
truncate table notifications;
truncate table brokers;
