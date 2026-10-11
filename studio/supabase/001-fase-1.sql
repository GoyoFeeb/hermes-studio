-- Hermes Studio — fase 1 de la migración a Supabase (ver studio/PLAN-SUPABASE-FASE-1.md).
-- Se ejecuta una vez en el SQL Editor del proyecto. Se puede repetir sin romper nada.
--
-- Acceso: solo el servidor de Studio, con la clave secreta (service_role). RLS activado y sin políticas:
-- las claves públicas (anon / authenticated) no pueden leer ni escribir nada. Las políticas llegan con los
-- usuarios, en la fase 2.

-- ---------------------------------------------------------------- trabajos
create table if not exists public.jobs (
  id          text primary key,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  -- queued | running | review | blocked | failed | completed | cancelled (JobStatus en store.ts)
  status      text not null,
  client_slug text not null,
  requester   text,
  archived_at timestamptz,
  -- El objeto Job entero, tal cual se guarda hoy en studio/data/jobs/<id>.json.
  data        jsonb not null
);
create index if not exists jobs_status_idx  on public.jobs (status);
create index if not exists jobs_created_idx on public.jobs (created_at desc);

-- ---------------------------------------------------------------- eventos de cada trabajo
create table if not exists public.job_events (
  id      bigint generated always as identity primary key,
  job_id  text not null references public.jobs (id) on delete cascade,
  ts      timestamptz not null,
  phase   text not null,
  level   text not null check (level in ('info', 'error', 'success')),
  message text not null
);
create index if not exists job_events_job_idx on public.job_events (job_id, id);

-- ---------------------------------------------------------------- fichas de marca del worker
create table if not exists public.brand_cards (
  slug       text primary key,
  updated_at timestamptz not null,
  data       jsonb not null
);

-- ---------------------------------------------------------------- cierre y permisos
alter table public.jobs        enable row level security;
alter table public.job_events  enable row level security;
alter table public.brand_cards enable row level security;

-- El proyecto se creó sin «Automatically expose new tables»: los permisos se dan a mano, y solo al servidor.
revoke all on public.jobs, public.job_events, public.brand_cards from anon, authenticated;
grant select, insert, update, delete on public.jobs, public.job_events, public.brand_cards to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------------------------------------------------------------- archivos
-- newsletters: HTML, .md y miniatura de cada trabajo (privado).
-- assets:      imágenes de brands/ que cargan los correos (público: un cliente de correo no se identifica).
-- brand-packs: el resto de brands/ — tokens, .md, capturas (privado).
insert into storage.buckets (id, name, public)
values
  ('newsletters', 'newsletters', false),
  ('assets',      'assets',      true),
  ('brand-packs', 'brand-packs', false)
on conflict (id) do nothing;
