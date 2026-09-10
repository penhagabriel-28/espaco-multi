-- Migration: Add salario column to public.profissionais
ALTER TABLE public.profissionais 
  ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.profissionais.salario IS 'Salário fixo ou base mensal do profissional';
