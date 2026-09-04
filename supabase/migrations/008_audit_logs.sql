-- 008_audit_logs.sql: Comprehensive action logging
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid not null default '00000000-0000-0000-0000-000000000001',
  user_id uuid references profiles(id) on delete set null,
  user_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
create policy "Allow read on audit_logs" on audit_logs for select using (true);
create policy "Allow insert on audit_logs" on audit_logs for insert with check (true);
