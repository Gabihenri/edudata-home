create extension if not exists pgcrypto;

create table if not exists public.eios_institutional_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  policy_type text not null,
  status text not null default 'draft',
  version integer not null default 1,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  pillars text[] not null default array['evidence','inclusion','intelligence','equity']::text[],
  scope jsonb not null default '{}'::jsonb,
  data_sources jsonb not null default '[]'::jsonb,
  score_policies jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  governance jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint eios_institutional_policies_type_check check (
    policy_type in (
      'pedagogical','intelligence','score','analytics','ai','data','privacy',
      'workflow','alerts','assessment','attendance','intervention','custom'
    )
  ),
  constraint eios_institutional_policies_status_check check (
    status in ('draft','under_review','approved','active','superseded','revoked','archived')
  ),
  constraint eios_institutional_policies_version_check check (version >= 1),
  constraint eios_institutional_policies_validity_check check (
    valid_until is null or valid_until >= valid_from
  )
);

create unique index if not exists eios_institutional_policies_version_unique
  on public.eios_institutional_policies(organization_id, code, version)
  where archived_at is null;

create index if not exists eios_institutional_policies_active_idx
  on public.eios_institutional_policies(organization_id, policy_type, status, valid_from);

create table if not exists public.eios_score_governance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_id uuid not null references public.eios_institutional_policies(id) on delete cascade,
  score_type text not null,
  score_code text not null,
  score_name text not null,
  enabled boolean not null default true,
  source_rules jsonb not null default '[]'::jsonb,
  minimum_data_quality numeric(5,4),
  minimum_sources integer,
  allow_partial_calculation boolean not null default false,
  human_review_required boolean not null default false,
  explanation_required boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint eios_score_governance_type_check check (
    score_type in (
      'learning','engagement','evidence','pedagogical_execution','risk','equity','institutional','custom'
    )
  ),
  constraint eios_score_governance_quality_check check (
    minimum_data_quality is null or (minimum_data_quality >= 0 and minimum_data_quality <= 1)
  ),
  constraint eios_score_governance_sources_check check (
    minimum_sources is null or minimum_sources >= 0
  )
);

create unique index if not exists eios_score_governance_policy_score_unique
  on public.eios_score_governance(policy_id, score_code)
  where archived_at is null;

create table if not exists public.eios_policy_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  policy_id uuid references public.eios_institutional_policies(id) on delete set null,
  event_type text not null,
  previous_version integer,
  new_version integer,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  reason text,
  impact_summary text,
  snapshot jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists eios_policy_audit_events_org_time_idx
  on public.eios_policy_audit_events(organization_id, occurred_at desc);

alter table public.eios_institutional_policies enable row level security;
alter table public.eios_score_governance enable row level security;
alter table public.eios_policy_audit_events enable row level security;

create policy "institution_members_read_policies"
  on public.eios_institutional_policies for select
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = eios_institutional_policies.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
    )
  );

create policy "institution_governors_manage_policies"
  on public.eios_institutional_policies for all
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = eios_institutional_policies.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and (
          member.can_manage_products = true
          or member.can_audit = true
          or member.role in ('principal','manager','institution_admin','super_admin')
        )
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = eios_institutional_policies.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and (
          member.can_manage_products = true
          or member.can_audit = true
          or member.role in ('principal','manager','institution_admin','super_admin')
        )
    )
  );

create policy "institution_members_read_score_governance"
  on public.eios_score_governance for select
  using (
    exists (
      select 1 from public.organization_members member
      where member.organization_id = eios_score_governance.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
    )
  );

create policy "institution_governors_manage_score_governance"
  on public.eios_score_governance for all
  using (
    exists (
      select 1 from public.organization_members member
      where member.organization_id = eios_score_governance.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and (
          member.can_manage_products = true
          or member.can_audit = true
          or member.role in ('principal','manager','institution_admin','super_admin')
        )
    )
  )
  with check (
    exists (
      select 1 from public.organization_members member
      where member.organization_id = eios_score_governance.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and (
          member.can_manage_products = true
          or member.can_audit = true
          or member.role in ('principal','manager','institution_admin','super_admin')
        )
    )
  );

create policy "institution_members_read_policy_audit"
  on public.eios_policy_audit_events for select
  using (
    exists (
      select 1 from public.organization_members member
      where member.organization_id = eios_policy_audit_events.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and (member.can_audit = true or member.role in ('principal','manager','institution_admin','super_admin'))
    )
  );

create policy "institution_governors_insert_policy_audit"
  on public.eios_policy_audit_events for insert
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1 from public.organization_members member
      where member.organization_id = eios_policy_audit_events.organization_id
        and member.user_id = auth.uid()
        and member.status = 'active'
        and (
          member.can_manage_products = true
          or member.can_audit = true
          or member.role in ('principal','manager','institution_admin','super_admin')
        )
    )
  );
