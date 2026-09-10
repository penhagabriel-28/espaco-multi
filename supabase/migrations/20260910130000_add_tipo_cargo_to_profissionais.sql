-- Migration: Add tipo and cargo to public.profissionais
ALTER TABLE public.profissionais 
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'clinico',
  ADD COLUMN IF NOT EXISTS cargo TEXT;

COMMENT ON COLUMN public.profissionais.tipo IS 'clinico ou administrativo';
COMMENT ON COLUMN public.profissionais.cargo IS 'Cargo ou funcao administrativa (ex: Recepcionista, Financeiro)';
