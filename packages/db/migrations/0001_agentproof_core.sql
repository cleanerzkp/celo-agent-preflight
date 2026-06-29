create extension if not exists pgcrypto;
create schema if not exists pgboss;

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  registry_address text not null,
  agent_id text not null,
  owner_address text,
  agent_wallet_address text,
  agent_uri text,
  name text,
  description text,
  image_url text,
  first_seen_block bigint,
  first_seen_at timestamptz,
  latest_scan_run_id uuid,
  latest_status text,
  latest_score integer check (latest_score is null or latest_score between 0 and 100),
  latest_report_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, registry_address, agent_id)
);

create table if not exists scan_runs (
  id uuid primary key default gen_random_uuid(),
  agent_db_id uuid references agents(id),
  chain_id integer not null,
  registry_address text not null,
  agent_id text not null,
  status text not null,
  score integer not null check (score between 0 and 100),
  scanner_version text not null,
  git_sha text,
  report_hash text not null unique,
  report_uri text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  raw_report jsonb not null
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agents_latest_scan_run_fk'
  ) then
    alter table agents
      add constraint agents_latest_scan_run_fk
      foreign key (latest_scan_run_id) references scan_runs(id)
      deferrable initially deferred;
  end if;
end $$;

create table if not exists check_results (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid references scan_runs(id) on delete cascade,
  check_id text not null,
  category text not null,
  status text not null,
  severity text not null,
  summary text not null,
  evidence jsonb not null,
  remediation text,
  created_at timestamptz not null default now()
);

create table if not exists endpoints (
  id uuid primary key default gen_random_uuid(),
  agent_db_id uuid references agents(id) on delete cascade,
  type text not null,
  url text,
  address text,
  chain_id integer,
  declared_in text,
  created_at timestamptz not null default now()
);

create table if not exists endpoint_samples (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid references endpoints(id) on delete cascade,
  scan_run_id uuid references scan_runs(id) on delete cascade,
  status text not null,
  http_status integer,
  latency_ms integer,
  content_type text,
  error text,
  sampled_at timestamptz not null default now()
);

create table if not exists attestations (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid references scan_runs(id),
  chain_id integer not null,
  contract_address text not null,
  tx_hash text not null unique,
  block_number bigint,
  agent_id text not null,
  subject_address text,
  report_hash text not null,
  score integer not null check (score between 0 and 100),
  report_uri text not null,
  attested_at timestamptz
);

create table if not exists indexer_checkpoints (
  id text primary key,
  chain_id integer not null,
  contract_address text not null,
  last_indexed_block bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists contract_evidence (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  address text not null,
  role text not null,
  is_contract boolean not null,
  sourcify_status text,
  abi_available boolean,
  source_available boolean,
  checked_at timestamptz not null default now(),
  raw jsonb,
  unique (chain_id, address, role)
);

create index if not exists agents_latest_report_hash_idx on agents (latest_report_hash);
create index if not exists scan_runs_agent_db_id_idx on scan_runs (agent_db_id);
create index if not exists scan_runs_report_hash_idx on scan_runs (report_hash);
create index if not exists check_results_scan_run_id_idx on check_results (scan_run_id);
create index if not exists endpoints_agent_db_id_idx on endpoints (agent_db_id);
create index if not exists endpoint_samples_endpoint_id_idx on endpoint_samples (endpoint_id);
create index if not exists attestations_report_hash_idx on attestations (report_hash);
create index if not exists contract_evidence_address_idx on contract_evidence (chain_id, address);
