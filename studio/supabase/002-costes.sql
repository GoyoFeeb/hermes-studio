-- Costes por trabajo (2026-10-20). Se puede repetir.
-- Columnas de filtro junto al jsonb `data`, que sigue guardando el Job entero.
-- Ejecutar en el SQL Editor antes de desplegar el worker que las envía: si faltan,
-- el upsert de jobs falla y la copia de Supabase se descarta.

alter table public.jobs add column if not exists started_at timestamptz;
alter table public.jobs add column if not exists finished_at timestamptz;
alter table public.jobs add column if not exists input_tokens bigint;
alter table public.jobs add column if not exists output_tokens bigint;
alter table public.jobs add column if not exists cache_tokens bigint;
alter table public.jobs add column if not exists cost_usd numeric;
alter table public.jobs add column if not exists cost_eur numeric;
alter table public.jobs add column if not exists model text;
alter table public.jobs add column if not exists provider text;

create index if not exists jobs_finished_idx on public.jobs (finished_at desc);
create index if not exists jobs_requester_idx on public.jobs (requester);

notify pgrst, 'reload schema';
