-- =====================================================
-- EDUDATA IA PLATFORM
-- ORGANIZATION CORE
-- Migration 14
-- =====================================================

create extension if not exists pgcrypto;

create table if not exists public.organizations (

    id uuid primary key
        default gen_random_uuid(),

    name text not null,

    short_name text,

    organization_type text not null,

    document text,

    email text,

    phone text,

    website text,

    logo_url text,

    address text,

    city text,

    state text,

    zip_code text,

    country text default 'Brasil',

    status text not null
        default 'active',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);

create unique index if not exists
idx_organizations_name
on public.organizations(name);

create index if not exists
idx_organizations_status
on public.organizations(status);

create index if not exists
idx_organizations_type
on public.organizations(organization_type);

create index if not exists
idx_organizations_city
on public.organizations(city);

create index if not exists
idx_organizations_state
on public.organizations(state);

create or replace function
public.update_updated_at_column()
returns trigger
language plpgsql
as
$$
begin

    new.updated_at = now();

    return new;

end;
$$;

drop trigger if exists
trg_organizations_updated_at
on public.organizations;

create trigger
trg_organizations_updated_at

before update
on public.organizations

for each row

execute function
public.update_updated_at_column();