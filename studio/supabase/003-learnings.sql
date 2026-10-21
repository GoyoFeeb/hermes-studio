-- Aprendizajes de las pasadas de mejora (2026-10-21). Una sola fila: el banco entero.
-- El disco (studio/data/learnings.json) sigue mandando; esto es la copia, como el resto de la fase 1.
-- Se puede repetir. Hay que ejecutarlo en el SQL Editor antes de que la copia deje de fallar por tabla ausente.

create table if not exists public.learnings (
  id         text primary key,
  updated_at timestamptz not null,
  data       jsonb not null
);

alter table public.learnings enable row level security;
revoke all on public.learnings from anon, authenticated;
grant select, insert, update, delete on public.learnings to service_role;
