-- ================================================================
-- SPD LOGISTICS — SUPABASE CLOUD DATABASE SCHEMA
-- Migration: Centralized cross-device synchronized database
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. BILTIES TABLE
create table if not exists bilties (
  id text primary key,
  bilty_number text not null,
  booking_date text,
  sender_name text,
  sender_phone text,
  receiver_name text,
  receiver_phone text,
  origin text,
  destination text,
  item_description text,
  packages_count integer default 1,
  weight numeric default 0,
  total_freight numeric default 0,
  payment_mode text default 'TO-PAY',
  status text default 'Booked',
  created_at timestamptz default now()
);

-- 2. CUSTOMERS / PARTIES TABLE
create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  city text,
  created_at timestamptz default now()
);

-- 3. CASH BOOKS TABLE
create table if not exists cash_books (
  id text primary key,
  date text not null,
  description text,
  type text not null, -- 'IN' or 'OUT'
  amount numeric not null default 0,
  created_at timestamptz default now()
);

-- 4. CHALLANS TABLE
create table if not exists challans (
  id text primary key,
  challan_number text not null,
  vehicle_number text,
  driver_name text,
  origin text,
  destination text,
  status text default 'In Transit',
  created_at timestamptz default now()
);

-- Disable Row Level Security (RLS) for seamless instant sync across all client devices
alter table bilties disable row level security;
alter table customers disable row level security;
alter table cash_books disable row level security;
alter table challans disable row level security;

-- Zero-Meter Clean Slate Guarantee (Wipes any existing test rows)
truncate table bilties;
truncate table challans;
truncate table cash_books;
truncate table customers;

