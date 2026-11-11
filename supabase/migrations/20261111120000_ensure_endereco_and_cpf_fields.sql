-- Migration: Garantir que os campos de endereço e CPF existam nas tabelas pacientes e responsaveis
-- Data: 2026-11-11

-- 1. TABELA: pacientes
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS endereco TEXT;

-- 2. TABELA: responsaveis
ALTER TABLE public.responsaveis
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT;

