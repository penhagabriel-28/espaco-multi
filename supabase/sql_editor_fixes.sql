-- ==============================================================================
-- SCRIPT DE CORREÇÃO E SINCRONIZAÇÃO COMPLETA PARA O SUPABASE SQL EDITOR
-- Espaço Multi — Sistema de Gestão e Agendamento
-- ==============================================================================

-- 1. TABELA: profissionais
-- Adiciona colunas para suporte a profissionais clínicos e administrativos
ALTER TABLE public.profissionais 
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'clinico',
  ADD COLUMN IF NOT EXISTS cargo TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Sincroniza tipo e cargo a partir do JSONB valores_config (se já preenchido)
UPDATE public.profissionais 
SET tipo = COALESCE(valores_config->>'tipo', 'clinico') 
WHERE tipo IS NULL OR tipo = '';

UPDATE public.profissionais 
SET cargo = valores_config->>'cargo' 
WHERE (cargo IS NULL OR cargo = '') AND valores_config->>'cargo' IS NOT NULL;

-- 2. TABELA: pacientes
-- Garante todas as colunas de apoio financeiro, cobrança e observações
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS apoio_frequencia TEXT DEFAULT 'avulso',
  ADD COLUMN IF NOT EXISTS apoio_valor_personalizado NUMERIC,
  ADD COLUMN IF NOT EXISTS cobrar_dia INTEGER,
  ADD COLUMN IF NOT EXISTS cids_secundarios JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS valor_mensal NUMERIC DEFAULT 0;

-- 3. TABELA: responsaveis
-- Garante campos de contato completos
ALTER TABLE public.responsaveis
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS parentesco TEXT;

-- 4. TABELA: agendamentos
-- Garante campos de plano ABA e assinaturas de frequência
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS plano_aba JSONB,
  ADD COLUMN IF NOT EXISTS assinatura_responsavel TEXT,
  ADD COLUMN IF NOT EXISTS nome_assinante TEXT,
  ADD COLUMN IF NOT EXISTS data_assinatura TIMESTAMPTZ;

-- 5. TABELA: paciente_profissional
-- Garante existência da tabela de vínculo paciente-terapeuta
CREATE TABLE IF NOT EXISTS public.paciente_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (paciente_id, profissional_id)
);

-- 6. PERMISSÕES & POLÍTICAS RLS (Garantir leitura e escrita para todos os usuários autenticados)
GRANT ALL ON public.profissionais TO authenticated;
GRANT ALL ON public.pacientes TO authenticated;
GRANT ALL ON public.responsaveis TO authenticated;
GRANT ALL ON public.agendamentos TO authenticated;
GRANT ALL ON public.paciente_profissional TO authenticated;
GRANT ALL ON public.salas TO authenticated;
GRANT ALL ON public.servicos TO authenticated;

-- Políticas permissivas para uso do sistema
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profissionais_all_policy" ON public.profissionais;
CREATE POLICY "profissionais_all_policy" ON public.profissionais FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pacientes_all_policy" ON public.pacientes;
CREATE POLICY "pacientes_all_policy" ON public.pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "responsaveis_all_policy" ON public.responsaveis;
CREATE POLICY "responsaveis_all_policy" ON public.responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agendamentos_all_policy" ON public.agendamentos;
CREATE POLICY "agendamentos_all_policy" ON public.agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.paciente_profissional ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "paciente_profissional_all_policy" ON public.paciente_profissional;
CREATE POLICY "paciente_profissional_all_policy" ON public.paciente_profissional FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notificar schema reload
NOTIFY pgrst, 'reload schema';
