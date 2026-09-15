-- Migration: Adicionar detalhes de contato, CPF e endereço para responsáveis e dados de nota fiscal
-- Data: 2026-09-15

-- 1. TABELA: responsaveis
-- Adiciona CPF e Endereço para os responsáveis do paciente
ALTER TABLE public.responsaveis
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT;

-- 2. TABELA: pacientes
-- Adiciona campo de endereço caso necessário a nível de paciente
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS endereco TEXT;

-- 3. TABELA: controle_relatorios
-- Adiciona campos para armazenar email, endereço e meses de referência da nota fiscal
ALTER TABLE public.controle_relatorios
  ADD COLUMN IF NOT EXISTS responsavel_email TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_endereco TEXT,
  ADD COLUMN IF NOT EXISTS meses_referencia TEXT;
