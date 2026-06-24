-- Migration to add document_processing_jobs table for background PDF processing queue

create table if not exists public.document_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  study_space_id uuid not null,
  document_id uuid not null references public.documents(id) on delete cascade,
  status text not null default 'pending',
  current_step text,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Enable Row Level Security (RLS)
alter table public.document_processing_jobs enable row level security;

-- Policies for Row Level Security
create policy "Allow all actions for service role"
  on public.document_processing_jobs
  for all
  to service_role
  using (true)
  with check (true);

create policy "Users can view their own document jobs"
  on public.document_processing_jobs
  for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_processing_jobs.document_id
      and d.user_id = auth.uid()
    )
  );

-- Grant select and update permissions on table
grant all privileges on table public.document_processing_jobs to postgres, service_role;
grant select, insert, update, delete on table public.document_processing_jobs to authenticated;
