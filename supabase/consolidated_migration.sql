-- ==========================================
-- Migration: 20260529201250_6a78eec0-7f9d-4243-9eb3-f8031ddd9517.sql
-- ==========================================

-- ============ ENUMS ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'recepcionista', 'profissional');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paciente_status') THEN
    CREATE TYPE public.paciente_status AS ENUM ('ativo', 'inativo', 'lista_espera');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_atendimento') THEN
    CREATE TYPE public.tipo_atendimento AS ENUM ('particular', 'convenio');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agendamento_status') THEN
    CREATE TYPE public.agendamento_status AS ENUM ('pendente', 'confirmado', 'cancelado', 'realizado', 'falta');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recorrencia_tipo') THEN
    CREATE TYPE public.recorrencia_tipo AS ENUM ('unica', 'semanal', 'quinzenal', 'mensal');
  END IF;
END $$;

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read profiles" ON public.profiles;
CREATE POLICY "auth read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "user updates own profile" ON public.profiles;
CREATE POLICY "user updates own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- ============ USER ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth read user_roles" ON public.user_roles;
CREATE POLICY "auth read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ AUTO PROFILE + FIRST USER = ADMIN ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email);

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recepcionista');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFISSIONAIS ============
CREATE TABLE IF NOT EXISTS public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  especialidade TEXT,
  registro TEXT,
  email TEXT,
  telefone TEXT,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  valor_sessao NUMERIC(10,2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissionais TO authenticated;
GRANT ALL ON public.profissionais TO service_role;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all profissionais" ON public.profissionais;
CREATE POLICY "auth all profissionais" ON public.profissionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_prof_upd ON public.profissionais;
CREATE TRIGGER trg_prof_upd BEFORE UPDATE ON public.profissionais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SERVICOS ============
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 50,
  cor TEXT NOT NULL DEFAULT '#fb923c',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all servicos" ON public.servicos;
CREATE POLICY "auth all servicos" ON public.servicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.servicos (nome, duracao_minutos) VALUES
  ('ABA', 60), ('Fonoaudiologia', 45), ('Psicologia', 50),
  ('Terapia Ocupacional', 50), ('Psicopedagogia', 50);

-- ============ SALAS ============
CREATE TABLE IF NOT EXISTS public.salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas TO authenticated;
GRANT ALL ON public.salas TO service_role;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all salas" ON public.salas;
CREATE POLICY "auth all salas" ON public.salas FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.salas (nome) VALUES ('Sala 1'), ('Sala 2'), ('Sala 3');

-- ============ PACIENTES ============
CREATE TABLE IF NOT EXISTS public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_nascimento DATE,
  cid_principal TEXT,
  cids_secundarios TEXT[],
  tipo_atendimento public.tipo_atendimento NOT NULL DEFAULT 'particular',
  convenio_nome TEXT,
  observacoes TEXT,
  foto_url TEXT,
  status public.paciente_status NOT NULL DEFAULT 'ativo',
  valor_mensal NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all pacientes" ON public.pacientes;
CREATE POLICY "auth all pacientes" ON public.pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_pac_upd ON public.pacientes;
CREATE TRIGGER trg_pac_upd BEFORE UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RESPONSAVEIS ============
CREATE TABLE IF NOT EXISTS public.responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responsaveis TO authenticated;
GRANT ALL ON public.responsaveis TO service_role;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all responsaveis" ON public.responsaveis;
CREATE POLICY "auth all responsaveis" ON public.responsaveis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_resp_paciente ON public.responsaveis(paciente_id);

-- ============ AGENDAMENTOS ============
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE RESTRICT,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE RESTRICT,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  sala_id UUID REFERENCES public.salas(id) ON DELETE SET NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  status public.agendamento_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  motivo_cancelamento TEXT,
  recorrencia public.recorrencia_tipo NOT NULL DEFAULT 'unica',
  recorrencia_grupo UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all agendamentos" ON public.agendamentos;
CREATE POLICY "auth all agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_ag_upd ON public.agendamentos;
CREATE TRIGGER trg_ag_upd BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_ag_inicio ON public.agendamentos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_ag_profissional ON public.agendamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_ag_paciente ON public.agendamentos(paciente_id);

-- ============ BLOQUEIOS ============
CREATE TABLE IF NOT EXISTS public.bloqueios_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bloqueios_agenda TO authenticated;
GRANT ALL ON public.bloqueios_agenda TO service_role;
ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all bloqueios" ON public.bloqueios_agenda;
CREATE POLICY "auth all bloqueios" ON public.bloqueios_agenda FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ==========================================
-- Migration: 20260530115809_919a0c4d-8075-4ce2-aaf9-308f964ea282.sql
-- ==========================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fatura_status') THEN
    CREATE TYPE public.fatura_status AS ENUM ('aberta','paga','vencida','cancelada');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pagamento') THEN
    CREATE TYPE public.metodo_pagamento AS ENUM ('pix','dinheiro','cartao_credito','cartao_debito','transferencia','boleto','convenio','outro');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  competencia date NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  status fatura_status NOT NULL DEFAULT 'aberta',
  vencimento date,
  pago_em timestamptz,
  metodo metodo_pagamento,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturas TO authenticated;
GRANT ALL ON public.faturas TO service_role;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all faturas" ON public.faturas;
CREATE POLICY "auth all faturas" ON public.faturas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.fatura_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  agendamento_id uuid,
  descricao text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatura_itens TO authenticated;
GRANT ALL ON public.fatura_itens TO service_role;
ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all fatura_itens" ON public.fatura_itens;
CREATE POLICY "auth all fatura_itens" ON public.fatura_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS faturas_updated_at ON public.faturas;
CREATE TRIGGER faturas_updated_at BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_faturas_paciente ON public.faturas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status ON public.faturas(status);
CREATE INDEX IF NOT EXISTS idx_fatura_itens_fatura ON public.fatura_itens(fatura_id);


-- ==========================================
-- Migration: 20260601181500_add_valores_config_to_profissionais.sql
-- ==========================================
-- Migration to add values and discounts configuration to professionals
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS valores_config JSONB DEFAULT '{"especialidades": [], "descontos": []}'::jsonb;


-- ==========================================
-- Migration: 20260603142200_sync_agendamento_financeiro.sql
-- ==========================================
-- Migration to sync agendamentos with faturas and fatura_itens when status is 'confirmado'

CREATE OR REPLACE FUNCTION public.fn_get_especialidade(
  p_servico_id uuid,
  p_paciente_id uuid,
  p_profissional_id uuid
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_servico_nome text;
  v_pac_cids text[];
  v_prof_especialidade text;
  v_prof_specs text[];
  v_spec text;
  v_ps text;
BEGIN
  -- 1. Check servico_id
  IF p_servico_id IS NOT NULL THEN
    SELECT nome INTO v_servico_nome FROM public.servicos WHERE id = p_servico_id;
    IF v_servico_nome IS NOT NULL THEN
      RETURN v_servico_nome;
    END IF;
  END IF;

  -- 2. Get patient cids_secundarios
  SELECT cids_secundarios INTO v_pac_cids FROM public.pacientes WHERE id = p_paciente_id;
  
  -- 3. Get professional specialties
  SELECT especialidade INTO v_prof_especialidade FROM public.profissionais WHERE id = p_profissional_id;
  
  IF v_prof_especialidade IS NOT NULL AND v_prof_especialidade <> '' THEN
    -- Convert comma separated list to array, trimming each element
    SELECT array_agg(trim(s)) INTO v_prof_specs
    FROM unnest(string_to_array(v_prof_especialidade, ',')) s
    WHERE trim(s) <> '';
  END IF;

  -- 4. Check intersection
  IF v_pac_cids IS NOT NULL AND array_length(v_pac_cids, 1) > 0 AND v_prof_specs IS NOT NULL AND array_length(v_prof_specs, 1) > 0 THEN
    FOREACH v_spec IN ARRAY v_pac_cids LOOP
      FOREACH v_ps IN ARRAY v_prof_specs LOOP
        IF lower(v_spec) = lower(v_ps) THEN
          RETURN v_spec;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  -- 5. Fallback to first professional specialty
  IF v_prof_specs IS NOT NULL AND array_length(v_prof_specs, 1) > 0 THEN
    RETURN v_prof_specs[1];
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_get_pricing(
  p_paciente_id uuid,
  p_profissional_id uuid,
  p_especialidade text,
  p_tipo_agendamento text
) RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_valor_sessao numeric;
  v_valores_config jsonb;
  v_descontos jsonb;
  v_especialidades jsonb;
  v_d jsonb;
  v_e jsonb;
  v_discount_sessao numeric;
  v_discount_avaliacao numeric;
  v_spec_sessao numeric;
  v_spec_avaliacao numeric;
BEGIN
  -- Get professional defaults
  SELECT valor_sessao, valores_config INTO v_valor_sessao, v_valores_config
  FROM public.profissionais
  WHERE id = p_profissional_id;

  IF v_valores_config IS NOT NULL THEN
    v_descontos := v_valores_config->'descontos';
    v_especialidades := v_valores_config->'especialidades';
  END IF;

  -- 1. Check custom patient discount
  IF v_descontos IS NOT NULL AND jsonb_array_length(v_descontos) > 0 THEN
    FOR v_d IN SELECT jsonb_array_elements(v_descontos) LOOP
      IF (v_d->>'paciente_id')::uuid = p_paciente_id AND lower(v_d->>'especialidade') = lower(p_especialidade) THEN
        v_discount_sessao := (v_d->>'valor_sessao')::numeric;
        v_discount_avaliacao := (v_d->>'valor_avaliacao')::numeric;
        
        IF p_tipo_agendamento = 'anamnese' THEN
          RETURN COALESCE(v_discount_avaliacao, 0);
        ELSE
          RETURN COALESCE(v_discount_sessao, 0);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 2. Check standard specialty rates
  IF v_especialidades IS NOT NULL AND jsonb_array_length(v_especialidades) > 0 THEN
    FOR v_e IN SELECT jsonb_array_elements(v_especialidades) LOOP
      IF lower(v_e->>'nome') = lower(p_especialidade) THEN
        v_spec_sessao := (v_e->>'valor_sessao')::numeric;
        v_spec_avaliacao := (v_e->>'valor_avaliacao')::numeric;
        
        IF p_tipo_agendamento = 'anamnese' THEN
          RETURN COALESCE(v_spec_avaliacao, 0);
        ELSE
          IF lower(p_especialidade) = 'ap' THEN
            RETURN 0;
          ELSE
            RETURN COALESCE(v_spec_sessao, v_valor_sessao, 0);
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 3. Default professional rate
  IF p_tipo_agendamento = 'anamnese' THEN
    RETURN 0;
  ELSE
    RETURN COALESCE(v_valor_sessao, 0);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_total numeric;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
BEGIN
  -- 1. CLEANUP OLD ASSOCIATED ITEM IF IT EXISTS (for UPDATE or DELETE)
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      -- Delete the item
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
      
      -- Subtract value from old invoice
      UPDATE public.faturas
      SET valor = GREATEST(0, valor - v_old_total)
      WHERE id = v_old_fatura_id;

      -- Delete invoice if it has no more items
      DELETE FROM public.faturas
      WHERE id = v_old_fatura_id
        AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
    END IF;
  END IF;

  -- 2. INSERT NEW ITEM IF STATUS IS CONFIRMADO (for INSERT or UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'confirmado' THEN
      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create open invoice
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = NEW.paciente_id
        AND competencia = v_competencia
        AND status = 'aberta'
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status)
        VALUES (NEW.paciente_id, v_competencia, 0, 'aberta')
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Insert item
      INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
      VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);

      -- Add value to invoice
      UPDATE public.faturas
      SET valor = valor + v_valor
      WHERE id = v_fatura_id;
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER tr_sync_agendamento_financeiro
AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_agendamento_financeiro();


-- ==========================================
-- Migration: 20260603150000_update_sync_agendamento_financeiro.sql
-- ==========================================
-- Update migration to make sync idempotent and fix anamnese pricing fallback

CREATE OR REPLACE FUNCTION public.fn_get_pricing(
  p_paciente_id uuid,
  p_profissional_id uuid,
  p_especialidade text,
  p_tipo_agendamento text
) RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_valor_sessao numeric;
  v_valores_config jsonb;
  v_descontos jsonb;
  v_especialidades jsonb;
  v_d jsonb;
  v_e jsonb;
  v_discount_sessao numeric;
  v_discount_avaliacao numeric;
  v_spec_sessao numeric;
  v_spec_avaliacao numeric;
BEGIN
  -- Get professional defaults
  SELECT valor_sessao, valores_config INTO v_valor_sessao, v_valores_config
  FROM public.profissionais
  WHERE id = p_profissional_id;

  IF v_valores_config IS NOT NULL THEN
    v_descontos := v_valores_config->'descontos';
    v_especialidades := v_valores_config->'especialidades';
  END IF;

  -- 1. Check custom patient discount
  IF v_descontos IS NOT NULL AND jsonb_array_length(v_descontos) > 0 THEN
    FOR v_d IN SELECT jsonb_array_elements(v_descontos) LOOP
      IF (v_d->>'paciente_id')::uuid = p_paciente_id AND lower(v_d->>'especialidade') = lower(p_especialidade) THEN
        v_discount_sessao := (v_d->>'valor_sessao')::numeric;
        v_discount_avaliacao := (v_d->>'valor_avaliacao')::numeric;
        
        IF p_tipo_agendamento = 'anamnese' THEN
          RETURN COALESCE(v_discount_avaliacao, v_discount_sessao, 0);
        ELSE
          RETURN COALESCE(v_discount_sessao, 0);
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 2. Check standard specialty rates
  IF v_especialidades IS NOT NULL AND jsonb_array_length(v_especialidades) > 0 THEN
    FOR v_e IN SELECT jsonb_array_elements(v_especialidades) LOOP
      IF lower(v_e->>'nome') = lower(p_especialidade) THEN
        v_spec_sessao := (v_e->>'valor_sessao')::numeric;
        v_spec_avaliacao := (v_e->>'valor_avaliacao')::numeric;
        
        IF p_tipo_agendamento = 'anamnese' THEN
          RETURN COALESCE(v_spec_avaliacao, v_spec_sessao, v_valor_sessao, 0);
        ELSE
          IF lower(p_especialidade) = 'ap' THEN
            RETURN 0;
          ELSE
            RETURN COALESCE(v_spec_sessao, v_valor_sessao, 0);
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 3. Default professional rate
  IF p_tipo_agendamento = 'anamnese' THEN
    RETURN COALESCE(v_valor_sessao, 0);
  ELSE
    RETURN COALESCE(v_valor_sessao, 0);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_total numeric;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
BEGIN
  -- 1. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      -- Delete the item
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
      
      -- Subtract value from old invoice
      UPDATE public.faturas
      SET valor = GREATEST(0, valor - v_old_total)
      WHERE id = v_old_fatura_id;

      -- Delete invoice if it has no more items
      DELETE FROM public.faturas
      WHERE id = v_old_fatura_id
        AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
    END IF;
  END IF;

  -- 2. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if item already exists for this agendamento
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'confirmado' THEN
      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create open invoice
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = NEW.paciente_id
        AND competencia = v_competencia
        AND status = 'aberta'
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status)
        VALUES (NEW.paciente_id, v_competencia, 0, 'aberta')
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Check if we are updating an existing invoice item
      IF v_item_id IS NOT NULL THEN
        IF v_old_fatura_id = v_fatura_id THEN
          -- Same invoice, update item description, unit price, total and adjust invoice valor
          UPDATE public.fatura_itens
          SET descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          UPDATE public.faturas
          SET valor = valor - v_old_total + v_valor
          WHERE id = v_fatura_id;
        ELSE
          -- Different invoice, subtract from old invoice
          UPDATE public.faturas
          SET valor = GREATEST(0, valor - v_old_total)
          WHERE id = v_old_fatura_id;

          -- Move item to new invoice
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id, descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          -- Add to new invoice
          UPDATE public.faturas
          SET valor = valor + v_valor
          WHERE id = v_fatura_id;

          -- Delete old invoice if empty
          DELETE FROM public.faturas
          WHERE id = v_old_fatura_id
            AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
        END IF;
      ELSE
        -- Item does not exist, insert it
        INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
        VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);

        -- Add value to invoice
        UPDATE public.faturas
        SET valor = valor + v_valor
        WHERE id = v_fatura_id;
      END IF;
    ELSE
      -- Status is not confirmed, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        UPDATE public.faturas
        SET valor = GREATEST(0, valor - v_old_total)
        WHERE id = v_old_fatura_id;

        DELETE FROM public.faturas
        WHERE id = v_old_fatura_id
          AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;


-- ==========================================
-- Migration: 20260603160000_backfill_confirmed_agendamentos.sql
-- ==========================================
-- Migration to backfill existing confirmed agendamentos into faturas and fatura_itens

DO $$
DECLARE
  r RECORD;
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_paciente_nome text;
  v_data_str text;
BEGIN
  FOR r IN 
    SELECT id, paciente_id, profissional_id, servico_id, data_inicio, observacoes
    FROM public.agendamentos
    WHERE status = 'confirmado'
  LOOP
    -- Check if it already has a fatura item
    SELECT id INTO v_item_id
    FROM public.fatura_itens
    WHERE agendamento_id = r.id;

    IF v_item_id IS NULL THEN
      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(r.servico_id, r.paciente_id, r.profissional_id);
      
      -- Resolve tipo_agendamento
      IF r.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(r.paciente_id, r.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', r.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = r.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', r.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create open invoice
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = r.paciente_id
        AND competencia = v_competencia
        AND status = 'aberta'
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status)
        VALUES (r.paciente_id, v_competencia, 0, 'aberta')
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Insert item
      INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
      VALUES (v_fatura_id, r.id, v_descricao, 1, v_valor, v_valor);

      -- Add value to invoice
      UPDATE public.faturas
      SET valor = valor + v_valor
      WHERE id = v_fatura_id;
    END IF;
  END LOOP;
END $$;


-- ==========================================
-- Migration: 20260603170000_create_despesas.sql
-- ==========================================
-- Migration to create the despesas (expenses) table

CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant access to authenticated and service roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas TO authenticated;
GRANT ALL ON public.despesas TO service_role;

-- Enable Row Level Security
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (consistent with other tables in this schema)
DROP POLICY IF EXISTS "auth all despesas" ON public.despesas;
CREATE POLICY "auth all despesas" ON public.despesas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at field on update
DROP TRIGGER IF EXISTS despesas_updated_at ON public.despesas;
CREATE TRIGGER despesas_updated_at BEFORE UPDATE ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ==========================================
-- Migration: 20260604110000_create_second_admin.sql
-- ==========================================
-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update the handle_new_user trigger function to promote gabymartyns04@gmail.com to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first OR NEW.email = 'gabymartyns04@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recepcionista')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create user gabymartyns04@gmail.com with password Gabi2020@ if they do not exist
DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'gabymartyns04@gmail.com';
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_encrypted_pw := extensions.crypt('Gabi2020@', extensions.gen_salt('bf'));
    
    -- 1. Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'gabymartyns04@gmail.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nome":"Gabi Martins"}'::jsonb,
      now(),
      now()
    );

    -- 2. Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, 'gabymartyns04@gmail.com')::jsonb,
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- 3. Ensure they have the admin role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove other roles if they exist to prevent role conflicts
  DELETE FROM public.user_roles WHERE user_id = v_user_id AND role != 'admin';
END $$;


-- ==========================================
-- Migration: 20260604120000_fix_second_admin.sql
-- ==========================================
-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update the handle_new_user trigger function to promote gabymartyns04@gmail.com to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first OR NEW.email = 'gabymartyns04@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recepcionista')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Repair / Create user gabymartyns04@gmail.com
DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'gabymartyns04@gmail.com';
  v_encrypted_pw := extensions.crypt('Gabi2020@', extensions.gen_salt('bf'));

  IF v_user_id IS NOT NULL THEN
    -- Update existing user to ensure confirmed_at is set and password is correct
    UPDATE auth.users
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      encrypted_password = v_encrypted_pw,
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = '{"nome":"Gabi Martins"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;

    -- Ensure the identity exists
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
      v_user_id,
        v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id::text, 'gabymartyns04@gmail.com')::jsonb,
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    ELSE
      UPDATE auth.identities
      SET 
        identity_data = format('{"sub":"%s","email":"%s"}', v_user_id::text, 'gabymartyns04@gmail.com')::jsonb,
        provider_id = v_user_id::text,
        updated_at = now()
      WHERE user_id = v_user_id;
    END IF;

  ELSE
    -- Recreate from scratch if they do not exist
    v_user_id := gen_random_uuid();
    
    -- 1. Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'gabymartyns04@gmail.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nome":"Gabi Martins"}'::jsonb,
      now(),
      now()
    );

    -- 2. Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, 'gabymartyns04@gmail.com')::jsonb,
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- 3. Ensure they have the admin role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove other roles if they exist to prevent role conflicts
  DELETE FROM public.user_roles WHERE user_id = v_user_id AND role != 'admin';
END $$;


-- ==========================================
-- Migration: 20260604130000_allow_new_registrations.sql
-- ==========================================
-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a BEFORE INSERT trigger function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_before_insert ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_before_insert ON auth.users;
CREATE TRIGGER on_auth_user_created_before_insert BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- Update the handle_new_user trigger function to:
-- 1. Create/update the profile
-- 2. Grant roles correctly (only the first user and gabymartyns04@gmail.com are admin)
-- 3. Check if email exists in public.profissionais and set role to 'profissional' + link user_id
-- 4. Otherwise, set role to 'recepcionista'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
  is_prof BOOLEAN;
BEGIN
  -- Insert or update profile
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email;

  -- Check if first user
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;

  -- Check if they are in professionals table
  SELECT EXISTS (SELECT 1 FROM public.profissionais WHERE email = NEW.email) INTO is_prof;

  IF is_first OR NEW.email = 'gabymartyns04@gmail.com' THEN
    -- Admin role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF is_prof THEN
    -- Professional role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'profissional')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Link user_id in profissionais table
    UPDATE public.profissionais
    SET user_id = NEW.id
    WHERE email = NEW.email;
  ELSE
    -- Receptionist role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recepcionista')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


-- ==========================================
-- Migration: 20260604140000_confirm_all_existing_users.sql
-- ==========================================
-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Confirm all existing users in auth.users
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- Also check if they need identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  id,
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  id::text,
  now(),
  created_at,
  updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
) ON CONFLICT DO NOTHING;


-- ==========================================
-- Migration: 20260607192000_fix_agendamentos_rls.sql
-- ==========================================
-- Grant permissions on agendamentos to all roles (both anonymous and authenticated users)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO anon, authenticated;

-- Recreate RLS policy for agendamentos to ensure fully permissive access for anyone (public)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "public all agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "public all agendamentos" ON public.agendamentos;
CREATE POLICY "public all agendamentos" ON public.agendamentos FOR ALL TO public USING (true) WITH CHECK (true);

-- Ensure faturas RLS is active and correct
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all faturas" ON public.faturas;
DROP POLICY IF EXISTS "public all faturas" ON public.faturas;
DROP POLICY IF EXISTS "auth all faturas" ON public.faturas;
CREATE POLICY "auth all faturas" ON public.faturas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure fatura_itens RLS is active and correct
ALTER TABLE public.fatura_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all fatura_itens" ON public.fatura_itens;
DROP POLICY IF EXISTS "public all fatura_itens" ON public.fatura_itens;
DROP POLICY IF EXISTS "auth all fatura_itens" ON public.fatura_itens;
CREATE POLICY "auth all fatura_itens" ON public.fatura_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update the sync trigger function to run as SECURITY DEFINER
-- This ensures database side-effects (like syncing appointments with invoices) bypass RLS
CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_total numeric;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
BEGIN
  -- 1. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      -- Delete the item
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
      
      -- Subtract value from old invoice
      UPDATE public.faturas
      SET valor = GREATEST(0, valor - v_old_total)
      WHERE id = v_old_fatura_id;

      -- Delete invoice if it has no more items
      DELETE FROM public.faturas
      WHERE id = v_old_fatura_id
        AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
    END IF;
  END IF;

  -- 2. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if item already exists for this agendamento
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'confirmado' THEN
      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create open invoice
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = NEW.paciente_id
        AND competencia = v_competencia
        AND status = 'aberta'
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status)
        VALUES (NEW.paciente_id, v_competencia, 0, 'aberta')
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Check if we are updating an existing invoice item
      IF v_item_id IS NOT NULL THEN
        IF v_old_fatura_id = v_fatura_id THEN
          -- Same invoice, update item description, unit price, total and adjust invoice valor
          UPDATE public.fatura_itens
          SET descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          UPDATE public.faturas
          SET valor = valor - v_old_total + v_valor
          WHERE id = v_fatura_id;
        ELSE
          -- Different invoice, subtract from old invoice
          UPDATE public.faturas
          SET valor = GREATEST(0, valor - v_old_total)
          WHERE id = v_old_fatura_id;

          -- Move item to new invoice
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id, descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          -- Add to new invoice
          UPDATE public.faturas
          SET valor = valor + v_valor
          WHERE id = v_fatura_id;

          -- Delete old invoice if empty
          DELETE FROM public.faturas
          WHERE id = v_old_fatura_id
            AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
        END IF;
      ELSE
        -- Item does not exist, insert it
        INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
        VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);

        -- Add value to invoice
        UPDATE public.faturas
        SET valor = valor + v_valor
        WHERE id = v_fatura_id;
      END IF;
    ELSE
      -- Status is not confirmed, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        UPDATE public.faturas
        SET valor = GREATEST(0, valor - v_old_total)
        WHERE id = v_old_fatura_id;

        DELETE FROM public.faturas
        WHERE id = v_old_fatura_id
          AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;


-- ==========================================
-- Migration: 20260609140000_add_pago_status_to_agendamentos.sql
-- ==========================================
ALTER TYPE public.agendamento_status ADD VALUE IF NOT EXISTS 'pago';

CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_total numeric;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
  v_target_status public.fatura_status;
BEGIN
  -- 1. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      -- Delete the item
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
      
      -- Subtract value from old invoice
      UPDATE public.faturas
      SET valor = GREATEST(0, valor - v_old_total)
      WHERE id = v_old_fatura_id;

      -- Delete invoice if it has no more items
      DELETE FROM public.faturas
      WHERE id = v_old_fatura_id
        AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
    END IF;
  END IF;

  -- 2. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if item already exists for this agendamento
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'realizado' OR NEW.status = 'pago' OR NEW.status = 'falta' THEN
      -- Resolve target status
      v_target_status := CASE WHEN NEW.status = 'pago' OR NEW.status = 'falta' THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END;

      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create invoice with target status
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = NEW.paciente_id
        AND competencia = v_competencia
        AND status = v_target_status
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status, pago_em, metodo)
        VALUES (
          NEW.paciente_id, 
          v_competencia, 
          0, 
          v_target_status,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END
        )
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Check if we are updating an existing invoice item
      IF v_item_id IS NOT NULL THEN
        IF v_old_fatura_id = v_fatura_id THEN
          -- Same invoice, update item description, unit price, total and adjust invoice valor
          UPDATE public.fatura_itens
          SET descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          UPDATE public.faturas
          SET valor = valor - v_old_total + v_valor
          WHERE id = v_fatura_id;
        ELSE
          -- Different invoice, subtract from old invoice
          UPDATE public.faturas
          SET valor = GREATEST(0, valor - v_old_total)
          WHERE id = v_old_fatura_id;

          -- Move item to new invoice
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id, descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          -- Add to new invoice
          UPDATE public.faturas
          SET valor = valor + v_valor
          WHERE id = v_fatura_id;

          -- Delete old invoice if empty
          DELETE FROM public.faturas
          WHERE id = v_old_fatura_id
            AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
        END IF;
      ELSE
        -- Item does not exist, insert it
        INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
        VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);

        -- Add value to invoice
        UPDATE public.faturas
        SET valor = valor + v_valor
        WHERE id = v_fatura_id;
      END IF;
    ELSE
      -- Status is not realizado, pago or falta, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        UPDATE public.faturas
        SET valor = GREATEST(0, valor - v_old_total)
        WHERE id = v_old_fatura_id;

        DELETE FROM public.faturas
        WHERE id = v_old_fatura_id
          AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;


-- ==========================================
-- Migration: 20260609150000_create_paciente_profissional_table.sql
-- ==========================================
CREATE TABLE IF NOT EXISTS public.paciente_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paciente_id, profissional_id)
);

ALTER TABLE public.paciente_profissional ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public all paciente_profissional" ON public.paciente_profissional;
CREATE POLICY "public all paciente_profissional" ON public.paciente_profissional 
  FOR ALL TO public USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.paciente_profissional TO anon, authenticated;
GRANT ALL ON public.paciente_profissional TO service_role;


-- ==========================================
-- Migration: 20260616183500_add_assinatura_to_agendamentos.sql
-- ==========================================
-- Add signature columns to agendamentos table to enable digital attendance
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS assinatura_responsavel text;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS nome_assinante text;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS data_assinatura timestamp with time zone;


-- ==========================================
-- Migration: 20260619183600_create_anamneses.sql
-- ==========================================
-- ============ ANAMNESES ============
CREATE TABLE IF NOT EXISTS public.anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth all anamneses" ON public.anamneses;
CREATE POLICY "auth all anamneses" ON public.anamneses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_anamneses_upd ON public.anamneses;
CREATE TRIGGER trg_anamneses_upd BEFORE UPDATE ON public.anamneses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;


-- ==========================================
-- Migration: 20260623124500_fix_falta_payment_status.sql
-- ==========================================
-- Migration to set target status of 'falta' appointments to 'aberta' (pending payment)
-- in the tg_sync_agendamento_financeiro trigger function, matching 'realizado'.

CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_total numeric;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
  v_target_status public.fatura_status;
BEGIN
  -- 1. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      -- Delete the item
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
      
      -- Subtract value from old invoice
      UPDATE public.faturas
      SET valor = GREATEST(0, valor - v_old_total)
      WHERE id = v_old_fatura_id;

      -- Delete invoice if it has no more items
      DELETE FROM public.faturas
      WHERE id = v_old_fatura_id
        AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
    END IF;
  END IF;

  -- 2. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if item already exists for this agendamento
    SELECT id, total, fatura_id INTO v_item_id, v_old_total, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'realizado' OR NEW.status = 'pago' OR NEW.status = 'falta' THEN
      -- Resolve target status (only 'pago' appointments generate paid invoices directly)
      v_target_status := CASE WHEN NEW.status = 'pago' THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END;

      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create invoice with target status
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = NEW.paciente_id
        AND competencia = v_competencia
        AND status = v_target_status
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status, pago_em, metodo)
        VALUES (
          NEW.paciente_id, 
          v_competencia, 
          0, 
          v_target_status,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END
        )
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Check if we are updating an existing invoice item
      IF v_item_id IS NOT NULL THEN
        IF v_old_fatura_id = v_fatura_id THEN
          -- Same invoice, update item description, unit price, total and adjust invoice valor
          UPDATE public.fatura_itens
          SET descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          UPDATE public.faturas
          SET valor = valor - v_old_total + v_valor
          WHERE id = v_fatura_id;
        ELSE
          -- Different invoice, subtract from old invoice
          UPDATE public.faturas
          SET valor = GREATEST(0, valor - v_old_total)
          WHERE id = v_old_fatura_id;

          -- Move item to new invoice
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id, descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;

          -- Add to new invoice
          UPDATE public.faturas
          SET valor = valor + v_valor
          WHERE id = v_fatura_id;

          -- Delete old invoice if empty
          DELETE FROM public.faturas
          WHERE id = v_old_fatura_id
            AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
        END IF;
      ELSE
        -- Item does not exist, insert it
        INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
        VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);

        -- Add value to invoice
        UPDATE public.faturas
        SET valor = valor + v_valor
        WHERE id = v_fatura_id;
      END IF;
    ELSE
      -- Status is not realizado, pago or falta, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        UPDATE public.faturas
        SET valor = GREATEST(0, valor - v_old_total)
        WHERE id = v_old_fatura_id;

        DELETE FROM public.faturas
        WHERE id = v_old_fatura_id
          AND NOT EXISTS (SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_old_fatura_id);
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;


-- ==========================================
-- Migration: 20260623131500_add_professional_specialty_to_faturas.sql
-- ==========================================
-- Migration to add profissional_id and especialidade columns to faturas table

ALTER TABLE public.faturas ADD COLUMN profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL;
ALTER TABLE public.faturas ADD COLUMN especialidade text;


-- ==========================================
-- Migration: 20260623140000_fatura_itens_integrity.sql
-- ==========================================
-- Migration to enforce referential integrity between fatura_itens and agendamentos,
-- and automatically keep faturas.valor totals synchronized.

-- 1. Ensure foreign key exists with ON DELETE CASCADE
ALTER TABLE public.fatura_itens
  DROP CONSTRAINT IF EXISTS fk_fatura_itens_agendamento;

ALTER TABLE public.fatura_itens
  ADD CONSTRAINT fk_fatura_itens_agendamento
  FOREIGN KEY (agendamento_id)
  REFERENCES public.agendamentos(id)
  ON DELETE CASCADE;

-- 2. Create the invoice total synchronization trigger function
CREATE OR REPLACE FUNCTION public.tg_sync_fatura_valor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fatura_id uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_fatura_id := NEW.fatura_id;
  ELSE
    v_fatura_id := OLD.fatura_id;
  END IF;

  -- Update invoice total with the sum of its items
  UPDATE public.faturas
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = v_fatura_id
  ), 0)
  WHERE id = v_fatura_id;

  -- Handle cleanup of old invoice if fatura_id changed during UPDATE
  IF TG_OP = 'UPDATE' AND OLD.fatura_id <> NEW.fatura_id THEN
    UPDATE public.faturas
    SET valor = COALESCE((
      SELECT SUM(total)
      FROM public.fatura_itens
      WHERE fatura_id = OLD.fatura_id
    ), 0)
    WHERE id = OLD.fatura_id;

    DELETE FROM public.faturas
    WHERE id = OLD.fatura_id
      AND status = 'aberta'
      AND NOT EXISTS (
        SELECT 1 FROM public.fatura_itens WHERE fatura_id = OLD.fatura_id
      );
  END IF;

  -- Delete target invoice if it became empty and is status 'aberta'
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    DELETE FROM public.faturas
    WHERE id = v_fatura_id
      AND status = 'aberta'
      AND NOT EXISTS (
        SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_fatura_id
      );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 3. Create trigger on fatura_itens
DROP TRIGGER IF EXISTS tr_sync_fatura_valor ON public.fatura_itens;
DROP TRIGGER IF EXISTS tr_sync_fatura_valor ON public.fatura_itens;
CREATE TRIGGER tr_sync_fatura_valor AFTER INSERT OR UPDATE OR DELETE ON public.fatura_itens
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_fatura_valor();

-- 4. Simplify the agendamentos synchronization trigger function
CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
  v_target_status public.fatura_status;
BEGIN
  -- A. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.fatura_itens WHERE agendamento_id = OLD.id;
  END IF;

  -- B. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if item already exists for this agendamento
    SELECT id, fatura_id INTO v_item_id, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'realizado' OR NEW.status = 'pago' OR NEW.status = 'falta' THEN
      -- Resolve target status (only 'pago' appointments generate paid invoices directly)
      v_target_status := CASE WHEN NEW.status = 'pago' THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END;

      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      -- Format date to DD/MM/YYYY HH:MI in Brazilian time
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Find or create invoice with target status
      SELECT id INTO v_fatura_id
      FROM public.faturas
      WHERE paciente_id = NEW.paciente_id
        AND competencia = v_competencia
        AND status = v_target_status
      LIMIT 1;

      IF v_fatura_id IS NULL THEN
        INSERT INTO public.faturas (paciente_id, competencia, valor, status, pago_em, metodo)
        VALUES (
          NEW.paciente_id, 
          v_competencia, 
          0, 
          v_target_status,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END
        )
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Check if we are updating an existing invoice item
      IF v_item_id IS NOT NULL THEN
        IF v_old_fatura_id = v_fatura_id THEN
          -- Same invoice, update item description, unit price and total
          UPDATE public.fatura_itens
          SET descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;
        ELSE
          -- Different invoice, move item to new invoice
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id, descricao = v_descricao, valor_unitario = v_valor, total = v_valor
          WHERE id = v_item_id;
        END IF;
      ELSE
        -- Item does not exist, insert it
        INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
        VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);
      END IF;
    ELSE
      -- Status is not realizado, pago or falta, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;


-- ==========================================
-- Migration: 20260625123000_create_controle_relatorios.sql
-- ==========================================
-- ============ CONTROLE DE RELATÓRIOS DE EVOLUÇÃO ============
CREATE TABLE IF NOT EXISTS public.controle_relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  responsavel_nome TEXT NOT NULL,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_limite DATE NOT NULL,
  data_entrega DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.controle_relatorios ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users (consistent with other tables in this schema)
DROP POLICY IF EXISTS "auth all controle_relatorios" ON public.controle_relatorios;
CREATE POLICY "auth all controle_relatorios" ON public.controle_relatorios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions to authenticated and service roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.controle_relatorios TO authenticated;
GRANT ALL ON public.controle_relatorios TO service_role;

-- Auto-update updated_at field on update
DROP TRIGGER IF EXISTS trg_controle_relatorios_upd ON public.controle_relatorios;
CREATE TRIGGER trg_controle_relatorios_upd BEFORE UPDATE ON public.controle_relatorios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ==========================================
-- Migration: 20260625124000_add_profissional_to_controle_relatorios.sql
-- ==========================================
-- ============ ADICIONAR PROFISSIONAL AO CONTROLE DE RELATÓRIOS ============
ALTER TABLE public.controle_relatorios 
  ADD COLUMN IF NOT EXISTS profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL;


-- ==========================================
-- Migration: 20260625134000_create_tipos_documento.sql
-- ==========================================
-- ============ CRIAÇÃO DA TABELA DE TIPOS DE DOCUMENTO ============
CREATE TABLE IF NOT EXISTS public.tipos_documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_documento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all tipos_documento" ON public.tipos_documento;
CREATE POLICY "auth all tipos_documento" ON public.tipos_documento FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_documento TO authenticated;
GRANT ALL ON public.tipos_documento TO service_role;

-- Inserir tipos padrão inicial
INSERT INTO public.tipos_documento (nome) VALUES 
  ('Relatório de Evolução'),
  ('Declaração'),
  ('Nota Fiscal'),
  ('Ficha de Anamnese')
ON CONFLICT (nome) DO NOTHING;

-- Adicionar a coluna tipo_documento_id na tabela controle_relatorios
ALTER TABLE public.controle_relatorios 
  ADD COLUMN IF NOT EXISTS tipo_documento_id UUID REFERENCES public.tipos_documento(id) ON DELETE SET NULL;

-- Atualizar registros existentes para apontar para o tipo padrão "Relatório de Evolução"
DO $$
DECLARE
  v_tipo_id UUID;
BEGIN
  SELECT id INTO v_tipo_id FROM public.tipos_documento WHERE nome = 'Relatório de Evolução' LIMIT 1;
  IF v_tipo_id IS NOT NULL THEN
    UPDATE public.controle_relatorios SET tipo_documento_id = v_tipo_id WHERE tipo_documento_id IS NULL;
  END IF;
END $$;


-- ==========================================
-- Migration: 20260625141000_add_cpf_and_billing_fields.sql
-- ==========================================
-- Adicionar coluna cpf na tabela pacientes
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar colunas de notas fiscais na tabela controle_relatorios
ALTER TABLE public.controle_relatorios 
  ADD COLUMN IF NOT EXISTS responsavel_cpf TEXT,
  ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS especialidades TEXT;


-- ==========================================
-- Migration: 20260625150000_fix_anamneses_trigger.sql
-- ==========================================
-- 1. Criar a função específica para atualizar a coluna atualizado_em
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN 
  NEW.atualizado_em = now(); 
  RETURN NEW; 
END;
$$;

-- 2. Remover o gatilho antigo com erro
DROP TRIGGER IF EXISTS trg_anamneses_upd ON public.anamneses;

-- 3. Criar o novo gatilho usando a função correta
DROP TRIGGER IF EXISTS trg_anamneses_upd ON public.anamneses;
CREATE TRIGGER trg_anamneses_upd BEFORE UPDATE ON public.anamneses 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_atualizado_em();


-- ==========================================
-- Migration: 20260625160000_make_tables_public_rls.sql
-- ==========================================
-- Make public.profissionais RLS policy fully permissive for anyone (public)
DROP POLICY IF EXISTS "auth all profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "public all profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "public all profissionais" ON public.profissionais;
CREATE POLICY "public all profissionais" ON public.profissionais FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.profissionais TO anon, authenticated;

-- Make public.pacientes RLS policy fully permissive for anyone (public)
DROP POLICY IF EXISTS "auth all pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "public all pacientes" ON public.pacientes;
DROP POLICY IF EXISTS "public all pacientes" ON public.pacientes;
CREATE POLICY "public all pacientes" ON public.pacientes FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.pacientes TO anon, authenticated;

-- Make public.responsaveis RLS policy fully permissive for anyone (public)
DROP POLICY IF EXISTS "auth all responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "public all responsaveis" ON public.responsaveis;
DROP POLICY IF EXISTS "public all responsaveis" ON public.responsaveis;
CREATE POLICY "public all responsaveis" ON public.responsaveis FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.responsaveis TO anon, authenticated;

-- Make public.anamneses RLS policy fully permissive for anyone (public)
DROP POLICY IF EXISTS "auth all anamneses" ON public.anamneses;
DROP POLICY IF EXISTS "public all anamneses" ON public.anamneses;
DROP POLICY IF EXISTS "public all anamneses" ON public.anamneses;
CREATE POLICY "public all anamneses" ON public.anamneses FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.anamneses TO anon, authenticated;

-- Make public.servicos RLS policy fully permissive for anyone (public)
DROP POLICY IF EXISTS "auth all servicos" ON public.servicos;
DROP POLICY IF EXISTS "public all servicos" ON public.servicos;
DROP POLICY IF EXISTS "public all servicos" ON public.servicos;
CREATE POLICY "public all servicos" ON public.servicos FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.servicos TO anon, authenticated;

-- Make public.salas RLS policy fully permissive for anyone (public)
DROP POLICY IF EXISTS "auth all salas" ON public.salas;
DROP POLICY IF EXISTS "public all salas" ON public.salas;
DROP POLICY IF EXISTS "public all salas" ON public.salas;
CREATE POLICY "public all salas" ON public.salas FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON public.salas TO anon, authenticated;


-- ==========================================
-- Migration: 20260626150000_split_faturas_per_session.sql
-- ==========================================
-- Migration to recreate tg_sync_agendamento_financeiro to enforce a 1-to-1 relationship 
-- between public.agendamentos (sessions) and public.faturas (invoices),
-- preventing payment updates from synchronizing across multiple sessions of the same month.

CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
  v_target_status public.fatura_status;
BEGIN
  -- A. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    -- Get old fatura id before delete
    SELECT fatura_id INTO v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    DELETE FROM public.fatura_itens WHERE agendamento_id = OLD.id;

    -- Clean up invoice if empty
    IF v_old_fatura_id IS NOT NULL THEN
      DELETE FROM public.faturas f
      WHERE f.id = v_old_fatura_id
        AND NOT EXISTS (
          SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
        );
    END IF;
  END IF;

  -- B. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check if item already exists for this agendamento
    SELECT id, fatura_id INTO v_item_id, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'realizado' OR NEW.status = 'pago' OR NEW.status = 'falta' THEN
      -- Resolve target status
      v_target_status := CASE WHEN NEW.status = 'pago' THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END;

      -- Resolve specialty
      v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
      
      -- Resolve tipo_agendamento
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
      ELSE
        v_tipo_agendamento := 'sessao';
      END IF;

      -- Resolve price
      v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF v_tipo_agendamento = 'anamnese' THEN
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- 1-to-1 Mapping: If fatura already exists, reuse it. Otherwise, always create a NEW fatura
      IF v_item_id IS NOT NULL THEN
        v_fatura_id := v_old_fatura_id;
        
        -- Update the dedicated fatura
        UPDATE public.faturas
        SET status = v_target_status,
            pago_em = CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
            metodo = CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END
        WHERE id = v_fatura_id;
      ELSE
        INSERT INTO public.faturas (paciente_id, competencia, valor, status, pago_em, metodo)
        VALUES (
          NEW.paciente_id, 
          v_competencia, 
          0, 
          v_target_status,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
          CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END
        )
        RETURNING id INTO v_fatura_id;
      END IF;

      -- Check if we are updating an existing invoice item
      IF v_item_id IS NOT NULL THEN
        -- Update item description, unit price and total
        UPDATE public.fatura_itens
        SET descricao = v_descricao, valor_unitario = v_valor, total = v_valor
        WHERE id = v_item_id;
      ELSE
        -- Item does not exist, insert it
        INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
        VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);
      END IF;
    ELSE
      -- Status is not realizado, pago or falta, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        -- Clean up invoice if it is now empty (no items left)
        IF v_old_fatura_id IS NOT NULL THEN
          DELETE FROM public.faturas f
          WHERE f.id = v_old_fatura_id
            AND NOT EXISTS (
              SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
            );
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;

-- DATA MIGRATION: Split existing consolidated invoices that contain multiple sessions
-- so that each session gets its own dedicated invoice.
DO $$
DECLARE
  r RECORD;
  v_new_fatura_id uuid;
BEGIN
  -- Find all items that are not the first item in their fatura
  FOR r IN 
    WITH ranked_items AS (
      SELECT 
        id AS item_id, 
        fatura_id, 
        total,
        ROW_NUMBER() OVER (PARTITION BY fatura_id ORDER BY id) as rn
      FROM public.fatura_itens
    )
    SELECT ri.item_id, ri.fatura_id, ri.total, f.paciente_id, f.competencia, f.status, f.vencimento, f.pago_em, f.metodo, f.observacoes, f.profissional_id, f.especialidade
    FROM ranked_items ri
    JOIN public.faturas f ON f.id = ri.fatura_id
    WHERE ri.rn > 1
  LOOP
    -- Create a new fatura for the item, copying original fatura details
    INSERT INTO public.faturas (
      paciente_id, competencia, valor, status, vencimento, pago_em, metodo, observacoes, profissional_id, especialidade
    ) VALUES (
      r.paciente_id, r.competencia, r.total, r.status, r.vencimento, r.pago_em, r.metodo, r.observacoes, r.profissional_id, r.especialidade
    )
    RETURNING id INTO v_new_fatura_id;

    -- Update the item to point to the new fatura
    UPDATE public.fatura_itens
    SET fatura_id = v_new_fatura_id
    WHERE id = r.item_id;
  END LOOP;

  -- Recalculate valor for all faturas
  UPDATE public.faturas f
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = f.id
  ), 0);

  -- Remove empty faturas (if any became empty and are in status 'aberta' or other statuses, except manual faturas with no items but value > 0)
  DELETE FROM public.faturas f
  WHERE NOT EXISTS (
    SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
  ) AND f.valor = 0;

END $$;


-- ==========================================
-- Migration: 20260626170000_apoio_and_coordenadora_rules.sql
-- ==========================================
-- Migration to recreate tg_sync_agendamento_financeiro to support monthly packages for 'Apoio' specialty,
-- and manage Apoio packages dynamically.

-- 1. Helper function to calculate the package price based on weekly frequency and update the consolidated invoice
CREATE OR REPLACE FUNCTION public.fn_recalculate_apoio_package(
  p_paciente_id uuid,
  p_competencia date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_weekly_freq integer;
  v_package_valor numeric;
  v_package_desc text;
  v_fatura_id uuid;
  v_item_id uuid;
  v_has_sessions boolean;
  v_target_status public.fatura_status;
BEGIN
  -- 1. Check if there are any billable 'Apoio' sessions for this patient in this month
  SELECT EXISTS (
    SELECT 1
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
  ) INTO v_has_sessions;

  -- 2. Find the consolidated Apoio invoice for this patient and month
  SELECT id INTO v_fatura_id
  FROM public.faturas
  WHERE paciente_id = p_paciente_id
    AND competencia = p_competencia
    AND especialidade = 'Apoio'
  LIMIT 1;

  -- 3. If there are no sessions, we clean up the package item and the invoice
  IF NOT v_has_sessions THEN
    IF v_fatura_id IS NOT NULL THEN
      -- Delete the package fee item
      DELETE FROM public.fatura_itens 
      WHERE fatura_id = v_fatura_id 
        AND agendamento_id IS NULL 
        AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio');
      
      -- Delete the invoice if it has no more items
      DELETE FROM public.faturas f
      WHERE f.id = v_fatura_id
        AND NOT EXISTS (
          SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
        );
    END IF;
    RETURN;
  END IF;

  -- 4. Calculate maximum weekly frequency of billable 'Apoio' sessions
  SELECT COALESCE(MAX(weekly_count), 0)
  INTO v_max_weekly_freq
  FROM (
    SELECT count(*) as weekly_count
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
    GROUP BY date_trunc('week', a.data_inicio)
  ) sub;

  -- Map to price
  IF v_max_weekly_freq = 1 THEN
    v_package_valor := 240;
    v_package_desc := 'Pacote Apoio - 1x por semana';
  ELSIF v_max_weekly_freq = 2 THEN
    v_package_valor := 360;
    v_package_desc := 'Pacote Apoio - 2x por semana';
  ELSIF v_max_weekly_freq >= 3 THEN
    v_package_valor := 450;
    v_package_desc := 'Pacote Apoio - Semana Inteira';
  ELSE
    v_package_valor := 0;
    v_package_desc := 'Pacote Apoio';
  END IF;

  -- 5. If no invoice exists, create one
  IF v_fatura_id IS NULL THEN
    -- Resolve status based on session statuses: if any session is 'pago', we make it 'paga', otherwise 'aberta'
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.paciente_id = p_paciente_id
        AND date_trunc('month', a.data_inicio)::date = p_competencia
        AND a.status = 'pago'
        AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
    ) THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END INTO v_target_status;

    INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade, pago_em, metodo)
    VALUES (
      p_paciente_id, 
      p_competencia, 
      v_package_valor, 
      v_target_status, 
      'Apoio',
      CASE WHEN v_target_status = 'paga' THEN p_competencia::timestamp ELSE NULL END,
      CASE WHEN v_target_status = 'paga' THEN 'pix'::public.metodo_pagamento ELSE NULL END
    )
    RETURNING id INTO v_fatura_id;
  END IF;

  -- 6. Update or insert the package fee item (identified by having agendamento_id IS NULL and starting with 'Pacote Apoio')
  SELECT id INTO v_item_id
  FROM public.fatura_itens
  WHERE fatura_id = v_fatura_id
    AND agendamento_id IS NULL
    AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio')
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    UPDATE public.fatura_itens
    SET descricao = v_package_desc,
        valor_unitario = v_package_valor,
        total = v_package_valor
    WHERE id = v_item_id;
  ELSE
    INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
    VALUES (v_fatura_id, NULL, v_package_desc, 1, v_package_valor, v_package_valor);
  END IF;

  -- 7. Ensure all 'Apoio' session items for this patient and month are linked to this invoice and have value 0
  UPDATE public.fatura_itens fi
  SET fatura_id = v_fatura_id,
      valor_unitario = 0,
      total = 0
  FROM public.agendamentos a
  WHERE fi.agendamento_id = a.id
    AND a.paciente_id = p_paciente_id
    AND date_trunc('month', a.data_inicio)::date = p_competencia
    AND a.status IN ('realizado', 'pago', 'falta')
    AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

  -- 8. Recalculate fatura total
  UPDATE public.faturas
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = v_fatura_id
  ), 0)
  WHERE id = v_fatura_id;

END;
$$;


-- 2. Recreate the trigger function tg_sync_agendamento_financeiro to use fn_recalculate_apoio_package
CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_old_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_old_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
  v_target_status public.fatura_status;
BEGIN
  -- A. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    -- Get old item details
    SELECT id, fatura_id INTO v_item_id, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
    END IF;

    v_old_especialidade := public.fn_get_especialidade(OLD.servico_id, OLD.paciente_id, OLD.profissional_id);
    v_old_competencia := date_trunc('month', OLD.data_inicio)::date;

    IF lower(v_old_especialidade) = 'apoio' THEN
      -- Recalculate Apoio package
      PERFORM public.fn_recalculate_apoio_package(OLD.paciente_id, v_old_competencia);
    ELSE
      -- Clean up old non-apoio fatura if empty
      IF v_old_fatura_id IS NOT NULL THEN
        DELETE FROM public.faturas f
        WHERE f.id = v_old_fatura_id
          AND NOT EXISTS (
            SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
          );
      END IF;
    END IF;
  END IF;

  -- B. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Resolve specialties
    v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
    IF TG_OP = 'UPDATE' THEN
      v_old_especialidade := public.fn_get_especialidade(OLD.servico_id, OLD.paciente_id, OLD.profissional_id);
      v_old_competencia := date_trunc('month', OLD.data_inicio)::date;
    END IF;

    -- Check if item already exists for this agendamento
    SELECT id, fatura_id INTO v_item_id, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'realizado' OR NEW.status = 'pago' OR NEW.status = 'falta' THEN
      -- Resolve target status
      v_target_status := CASE WHEN NEW.status = 'pago' THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END;
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      -- Resolve description
      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_tipo_agendamento := 'sessao';
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- CASE 1: SPECIALTY IS APOIO
      IF lower(v_especialidade) = 'apoio' THEN
        -- Resolve consolidated fatura_id for Apoio
        SELECT id INTO v_fatura_id
        FROM public.faturas
        WHERE paciente_id = NEW.paciente_id
          AND competencia = v_competencia
          AND especialidade = 'Apoio'
        LIMIT 1;

        IF v_fatura_id IS NULL THEN
          -- Temporarily create fatura (will be updated by fn_recalculate_apoio_package)
          INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade)
          VALUES (NEW.paciente_id, v_competencia, 0, 'aberta', 'Apoio')
          RETURNING id INTO v_fatura_id;
        END IF;

        -- Update or insert session item (value 0)
        IF v_item_id IS NOT NULL THEN
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id,
              descricao = v_descricao,
              valor_unitario = 0,
              total = 0
          WHERE id = v_item_id;
        ELSE
          INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
          VALUES (v_fatura_id, NEW.id, v_descricao, 1, 0, 0);
        END IF;

        -- Recalculate package price and invoice total
        PERFORM public.fn_recalculate_apoio_package(NEW.paciente_id, v_competencia);

        -- If the session was moved from another month/patient or changed from another specialty, recalculate the old package
        IF TG_OP = 'UPDATE' AND (OLD.paciente_id <> NEW.paciente_id OR v_old_competencia <> v_competencia OR lower(v_old_especialidade) <> 'apoio') THEN
          IF lower(v_old_especialidade) = 'apoio' THEN
            PERFORM public.fn_recalculate_apoio_package(OLD.paciente_id, v_old_competencia);
          END IF;
        END IF;

      -- CASE 2: SPECIALTY IS NOT APOIO
      ELSE
        -- 1-to-1 Mapping: If fatura already exists, reuse it. Otherwise, always create a NEW fatura
        v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);

        IF v_item_id IS NOT NULL THEN
          v_fatura_id := v_old_fatura_id;
          
          UPDATE public.faturas
          SET status = v_target_status,
              pago_em = CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
              metodo = CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END,
              especialidade = v_especialidade,
              profissional_id = NEW.profissional_id
          WHERE id = v_fatura_id;
        ELSE
          INSERT INTO public.faturas (paciente_id, competencia, valor, status, pago_em, metodo, especialidade, profissional_id)
          VALUES (
            NEW.paciente_id, 
            v_competencia, 
            0, 
            v_target_status,
            CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
            CASE WHEN v_target_status = 'paga'::public.fatura_status THEN 'pix'::public.metodo_pagamento ELSE NULL END,
            v_especialidade,
            NEW.profissional_id
          )
          RETURNING id INTO v_fatura_id;
        END IF;

        -- Update or insert item
        IF v_item_id IS NOT NULL THEN
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id,
              descricao = v_descricao,
              valor_unitario = v_valor,
              total = v_valor
          WHERE id = v_item_id;
        ELSE
          INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
          VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);
        END IF;

        -- If it was changed from Apoio to non-Apoio, recalculate the old Apoio package
        IF TG_OP = 'UPDATE' AND lower(v_old_especialidade) = 'apoio' THEN
          PERFORM public.fn_recalculate_apoio_package(OLD.paciente_id, v_old_competencia);
        END IF;
      END IF;

    ELSE
      -- Status is not realizado, pago or falta, but item exists (we need to remove it)
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        IF lower(v_especialidade) = 'apoio' THEN
          PERFORM public.fn_recalculate_apoio_package(NEW.paciente_id, date_trunc('month', NEW.data_inicio)::date);
        ELSE
          -- Clean up non-apoio fatura if empty
          IF v_old_fatura_id IS NOT NULL THEN
            DELETE FROM public.faturas f
            WHERE f.id = v_old_fatura_id
              AND NOT EXISTS (
                SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
              );
          END IF;
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;


-- 3. Data Migration: Group existing Apoio sessions of each patient into monthly packages
DO $$
DECLARE
  r RECORD;
  v_fatura_id uuid;
BEGIN
  -- First, delete any existing manual package items to prevent duplicates
  DELETE FROM public.fatura_itens WHERE agendamento_id IS NULL AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio');

  -- Loop through all patient/competency groups that have Apoio sessions
  FOR r IN
    SELECT 
      a.paciente_id,
      date_trunc('month', a.data_inicio)::date as competencia
    FROM public.agendamentos a
    WHERE a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
    GROUP BY a.paciente_id, date_trunc('month', a.data_inicio)::date
  LOOP
    -- A. Find or create a consolidated Apoio invoice for this patient and month
    SELECT id INTO v_fatura_id
    FROM public.faturas
    WHERE paciente_id = r.paciente_id
      AND competencia = r.competencia
      AND especialidade = 'Apoio'
    LIMIT 1;

    IF v_fatura_id IS NULL THEN
      INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade)
      VALUES (r.paciente_id, r.competencia, 0, 'aberta', 'Apoio')
      RETURNING id INTO v_fatura_id;
    END IF;

    -- B. Link all Apoio sessions of this patient/month to this consolidated invoice and set their values to 0
    UPDATE public.fatura_itens fi
    SET fatura_id = v_fatura_id,
        valor_unitario = 0,
        total = 0
    FROM public.agendamentos a
    WHERE fi.agendamento_id = a.id
      AND a.paciente_id = r.paciente_id
      AND date_trunc('month', a.data_inicio)::date = r.competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

    -- C. Recalculate the package item and total value
    PERFORM public.fn_recalculate_apoio_package(r.paciente_id, r.competencia);
  END LOOP;

  -- D. Clean up empty faturas that were split or orphaned
  DELETE FROM public.faturas f
  WHERE NOT EXISTS (
    SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
  ) AND (f.especialidade = 'Apoio' OR f.valor = 0);

END $$;


-- ==========================================
-- Migration: 20260627120000_add_plano_aba_to_agendamentos.sql
-- ==========================================
-- Add plano_aba JSONB column to agendamentos table
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS plano_aba JSONB;


-- ==========================================
-- Migration: 20260628123540_75944786-ee64-4b78-a618-af3a195c4b65.sql
-- ==========================================

-- Permitir acesso anônimo a todas as tabelas operacionais (proteção das abas diretoria/despesas permanece no client via senha)

-- 1) Recriar policies para incluir anon explicitamente em TODAS as tabelas operacionais
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'agendamentos','anamneses','bloqueios_agenda','controle_relatorios',
    'despesas','fatura_itens','faturas','paciente_profissional','pacientes',
    'profissionais','responsaveis','salas','servicos','tipos_documento'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public all %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "auth all %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "open all %s" ON public.%I AS PERMISSIVE FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- 2) user_roles e profiles continuam restritos a authenticated (sem alteração de policies existentes)


-- ==========================================
-- Migration: 20260628124414_099d1335-0e12-4152-80ab-31e8d66eeaf0.sql
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissionais TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissionais TO authenticated;
GRANT ALL ON public.profissionais TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.paciente_profissional TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paciente_profissional TO authenticated;
GRANT ALL ON public.paciente_profissional TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas TO authenticated;
GRANT ALL ON public.salas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.responsaveis TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responsaveis TO authenticated;
GRANT ALL ON public.responsaveis TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_documento TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_documento TO authenticated;
GRANT ALL ON public.tipos_documento TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.controle_relatorios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.controle_relatorios TO authenticated;
GRANT ALL ON public.controle_relatorios TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturas TO authenticated;
GRANT ALL ON public.faturas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatura_itens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatura_itens TO authenticated;
GRANT ALL ON public.fatura_itens TO service_role;

-- ==========================================
-- Migration: 20260629120000_add_apoio_frequencia.sql
-- ==========================================
-- 1. Alter table public.pacientes to add Apoio frequency and custom price/discount
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS apoio_frequencia TEXT DEFAULT 'avulso';
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS apoio_valor_personalizado NUMERIC;

-- Comment on columns
COMMENT ON COLUMN public.pacientes.apoio_frequencia IS 'Frequência do aluno no Apoio: avulso, 1x, 2x, 3x, semana_toda';
COMMENT ON COLUMN public.pacientes.apoio_valor_personalizado IS 'Valor personalizado (desconto) para o Apoio: mensal se pacote, ou por sessão se avulso';


-- 2. Update existing Apoio patients to ensure they default to 'avulso' if NULL
UPDATE public.pacientes 
SET apoio_frequencia = 'avulso' 
WHERE apoio_frequencia IS NULL;


-- 3. Recreate the function public.fn_recalculate_apoio_package to support the new rules
CREATE OR REPLACE FUNCTION public.fn_recalculate_apoio_package(
  p_paciente_id uuid,
  p_competencia date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_weekly_freq integer;
  v_package_valor numeric;
  v_package_desc text;
  v_fatura_id uuid;
  v_item_id uuid;
  v_has_sessions boolean;
  v_target_status public.fatura_status;
  
  -- New variables
  v_apoio_frequencia text;
  v_apoio_valor_personalizado numeric;
  v_session_count integer;
BEGIN
  -- 1. Check if there are any billable 'Apoio' sessions for this patient in this month
  SELECT EXISTS (
    SELECT 1
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
  ) INTO v_has_sessions;

  -- 2. Find the consolidated Apoio invoice for this patient and month
  SELECT id INTO v_fatura_id
  FROM public.faturas
  WHERE paciente_id = p_paciente_id
    AND competencia = p_competencia
    AND especialidade = 'Apoio'
  LIMIT 1;

  -- 3. If there are no sessions, we clean up the package item and the invoice
  IF NOT v_has_sessions THEN
    IF v_fatura_id IS NOT NULL THEN
      -- Delete the package fee item
      DELETE FROM public.fatura_itens 
      WHERE fatura_id = v_fatura_id 
        AND agendamento_id IS NULL 
        AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio');
      
      -- Delete the invoice if it has no more items
      DELETE FROM public.faturas f
      WHERE f.id = v_fatura_id
        AND NOT EXISTS (
          SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
        );
    END IF;
    RETURN;
  END IF;

  -- 4. Get patient's configuration
  SELECT COALESCE(apoio_frequencia, 'avulso'), apoio_valor_personalizado
  INTO v_apoio_frequencia, v_apoio_valor_personalizado
  FROM public.pacientes
  WHERE id = p_paciente_id;

  -- 5. Calculate price based on selected frequency
  IF v_apoio_frequencia = '1x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 120.00);
    v_package_desc := 'Pacote Apoio - 1x por semana';
  ELSIF v_apoio_frequencia = '2x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 240.00);
    v_package_desc := 'Pacote Apoio - 2x por semana';
  ELSIF v_apoio_frequencia = '3x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 360.00);
    v_package_desc := 'Pacote Apoio - 3x por semana';
  ELSIF v_apoio_frequencia = 'semana_toda' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 450.00);
    v_package_desc := 'Pacote Apoio - Semana Inteira';
  ELSIF v_apoio_frequencia = 'avulso' THEN
    -- Sessão avulsa = R$ 50.00 per session
    SELECT COUNT(*)
    INTO v_session_count
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

    v_package_valor := v_session_count * COALESCE(v_apoio_valor_personalizado, 50.00);
    v_package_desc := 'Pacote Apoio - Sessões Avulsas (' || v_session_count || ' sessões)';
  ELSE
    -- Fallback to old dynamic count logic based on maximum weekly sessions (in case of undefined values)
    SELECT COALESCE(MAX(weekly_count), 0)
    INTO v_max_weekly_freq
    FROM (
      SELECT count(*) as weekly_count
      FROM public.agendamentos a
      WHERE a.paciente_id = p_paciente_id
        AND date_trunc('month', a.data_inicio)::date = p_competencia
        AND a.status IN ('realizado', 'pago', 'falta')
        AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
      GROUP BY date_trunc('week', a.data_inicio)
    ) sub;

    IF v_max_weekly_freq = 1 THEN
      v_package_valor := 120.00;
      v_package_desc := 'Pacote Apoio - 1x por semana';
    ELSIF v_max_weekly_freq = 2 THEN
      v_package_valor := 240.00;
      v_package_desc := 'Pacote Apoio - 2x por semana';
    ELSIF v_max_weekly_freq = 3 THEN
      v_package_valor := 360.00;
      v_package_desc := 'Pacote Apoio - 3x por semana';
    ELSIF v_max_weekly_freq >= 4 THEN
      v_package_valor := 450.00;
      v_package_desc := 'Pacote Apoio - Semana Inteira';
    ELSE
      v_package_valor := 0;
      v_package_desc := 'Pacote Apoio';
    END IF;
  END IF;

  -- 6. If no invoice exists, create one
  IF v_fatura_id IS NULL THEN
    -- Resolve status based on session statuses: if any session is 'pago', we make it 'paga', otherwise 'aberta'
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.paciente_id = p_paciente_id
        AND date_trunc('month', a.data_inicio)::date = p_competencia
        AND a.status = 'pago'
        AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
    ) THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END INTO v_target_status;

    INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade, pago_em, metodo)
    VALUES (
      p_paciente_id, 
      p_competencia, 
      v_package_valor, 
      v_target_status, 
      'Apoio',
      CASE WHEN v_target_status = 'paga' THEN p_competencia::timestamp ELSE NULL END,
      CASE WHEN v_target_status = 'paga' THEN 'pix'::public.metodo_pagamento ELSE NULL END
    )
    RETURNING id INTO v_fatura_id;
  END IF;

  -- 7. Update or insert the package fee item
  SELECT id INTO v_item_id
  FROM public.fatura_itens
  WHERE fatura_id = v_fatura_id
    AND agendamento_id IS NULL
    AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio')
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    UPDATE public.fatura_itens
    SET descricao = v_package_desc,
        valor_unitario = v_package_valor,
        total = v_package_valor
    WHERE id = v_item_id;
  ELSE
    INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
    VALUES (v_fatura_id, NULL, v_package_desc, 1, v_package_valor, v_package_valor);
  END IF;

  -- 8. Ensure all 'Apoio' session items for this patient and month are linked to this invoice and have value 0
  UPDATE public.fatura_itens fi
  SET fatura_id = v_fatura_id,
      valor_unitario = 0,
      total = 0
  FROM public.agendamentos a
  WHERE fi.agendamento_id = a.id
    AND a.paciente_id = p_paciente_id
    AND date_trunc('month', a.data_inicio)::date = p_competencia
    AND a.status IN ('realizado', 'pago', 'falta')
    AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

  -- 9. Recalculate fatura total
  UPDATE public.faturas
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = v_fatura_id
  ), 0)
  WHERE id = v_fatura_id;

END;
$$;


-- ==========================================
-- Migration: 20260629130000_add_fatura_itens_agendamento_index.sql
-- ==========================================
-- CREATE INDEX IF NOT EXISTS to optimize performance of agendamento edits, deletes and triggers
CREATE INDEX IF NOT EXISTS idx_fatura_itens_agendamento ON public.fatura_itens(agendamento_id);


-- ==========================================
-- Migration: 20260630120000_add_pacientes_apoio_recalc_trigger.sql
-- ==========================================
-- Migration to automatically trigger fn_recalculate_apoio_package
-- when a patient's Apoio-related configurations are updated in the database.

CREATE OR REPLACE FUNCTION public.tg_sync_paciente_apoio_recalc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_competencia date;
BEGIN
  v_competencia := date_trunc('month', now())::date;

  IF TG_OP = 'INSERT' THEN
    IF NEW.cids_secundarios IS NOT NULL AND NEW.cids_secundarios::text ILIKE '%apoio%' THEN
      PERFORM public.fn_recalculate_apoio_package(NEW.id, v_competencia);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.cids_secundarios IS NOT NULL AND NEW.cids_secundarios::text ILIKE '%apoio%')
       OR (OLD.cids_secundarios::text ILIKE '%apoio%' AND NOT NEW.cids_secundarios::text ILIKE '%apoio%')
       OR (OLD.apoio_frequencia IS DISTINCT FROM NEW.apoio_frequencia)
       OR (OLD.apoio_valor_personalizado IS DISTINCT FROM NEW.apoio_valor_personalizado)
    THEN
      PERFORM public.fn_recalculate_apoio_package(NEW.id, v_competencia);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_paciente_apoio_recalc ON public.pacientes;
DROP TRIGGER IF EXISTS tr_sync_paciente_apoio_recalc ON public.pacientes;
CREATE TRIGGER tr_sync_paciente_apoio_recalc AFTER INSERT OR UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_paciente_apoio_recalc();


-- ==========================================
-- Migration: 20260630130000_enable_realtime_for_tables.sql
-- ==========================================
-- Migration to enable Supabase Realtime for agendamentos, pacientes, faturas and fatura_itens.

do $$
declare
  v_table text;
  v_tables text[] := array['agendamentos', 'pacientes', 'faturas', 'fatura_itens'];
begin
  -- Ensure publication exists
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  
  foreach v_table in array v_tables loop
    if not exists (
      select 1 
      from pg_publication_rel pr 
      join pg_class c on pr.prrelid = c.oid 
      join pg_namespace n on c.relnamespace = n.oid 
      join pg_publication p on pr.prpubid = p.oid
      where p.pubname = 'supabase_realtime' 
        and n.nspname = 'public' 
        and c.relname = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end
$$;


-- ==========================================
-- Migration: 20260702120000_update_fn_recalculate_apoio_package.sql
-- ==========================================
-- Migration to update fn_recalculate_apoio_package so that Apoio packages are billed flat monthly
-- even if no sessions are completed yet or if sessions are pending.

CREATE OR REPLACE FUNCTION public.fn_recalculate_apoio_package(
  p_paciente_id uuid,
  p_competencia date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_weekly_freq integer;
  v_package_valor numeric;
  v_package_desc text;
  v_fatura_id uuid;
  v_item_id uuid;
  v_has_sessions boolean;
  v_target_status public.fatura_status;
  
  -- New variables
  v_apoio_frequencia text;
  v_apoio_valor_personalizado numeric;
  v_session_count integer;
  v_is_apoio boolean;
  v_has_realized_sessions boolean;
  v_target_prof_id uuid;
BEGIN
  -- 1. Check if patient is configured as Apoio (has 'Apoio' or 'AP' in cids_secundarios)
  SELECT (
    cids_secundarios IS NOT NULL AND (
      'Apoio' = ANY(cids_secundarios) OR 'AP' = ANY(cids_secundarios)
    )
  ), apoio_frequencia, apoio_valor_personalizado
  INTO v_is_apoio, v_apoio_frequencia, v_apoio_valor_personalizado
  FROM public.pacientes
  WHERE id = p_paciente_id;

  -- Check if there are any billable 'Apoio' sessions in status realizado, pago, falta
  SELECT EXISTS (
    SELECT 1
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
  ) INTO v_has_realized_sessions;

  -- An Apoio patient gets a package invoice if they have completed/missed sessions, OR if they are on a fixed monthly package (not avulso)
  v_has_sessions := COALESCE(v_has_realized_sessions, false) 
    OR (COALESCE(v_is_apoio, false) AND COALESCE(v_apoio_frequencia, 'avulso') <> 'avulso');

  -- 2. Find the consolidated Apoio invoice for this patient and month
  SELECT id INTO v_fatura_id
  FROM public.faturas
  WHERE paciente_id = p_paciente_id
    AND competencia = p_competencia
    AND especialidade = 'Apoio'
  LIMIT 1;

  -- 3. If there are no sessions, we clean up the package item and the invoice
  IF NOT v_has_sessions THEN
    IF v_fatura_id IS NOT NULL THEN
      -- Delete the package fee item
      DELETE FROM public.fatura_itens 
      WHERE fatura_id = v_fatura_id 
        AND agendamento_id IS NULL 
        AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio');
      
      -- Delete the invoice if it has no more items
      DELETE FROM public.faturas f
      WHERE f.id = v_fatura_id
        AND NOT EXISTS (
          SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
        );
    END IF;
    RETURN;
  END IF;

  -- 4. Get Apoio configuration
  v_apoio_frequencia := COALESCE(v_apoio_frequencia, 'avulso');

  -- 5. Calculate price based on selected frequency
  IF v_apoio_frequencia = '1x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 120.00);
    v_package_desc := 'Pacote Apoio - 1x por semana';
  ELSIF v_apoio_frequencia = '2x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 240.00);
    v_package_desc := 'Pacote Apoio - 2x por semana';
  ELSIF v_apoio_frequencia = '3x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 360.00);
    v_package_desc := 'Pacote Apoio - 3x por semana';
  ELSIF v_apoio_frequencia = 'semana_toda' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 450.00);
    v_package_desc := 'Pacote Apoio - Semana Inteira';
  ELSIF v_apoio_frequencia = 'avulso' THEN
    -- Sessão avulsa = R$ 50.00 per session
    SELECT COUNT(*)
    INTO v_session_count
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

    v_package_valor := v_session_count * COALESCE(v_apoio_valor_personalizado, 50.00);
    v_package_desc := 'Pacote Apoio - Sessões Avulsas (' || v_session_count || ' sessões)';
  ELSE
    -- Fallback to old dynamic count logic based on maximum weekly sessions (in case of undefined values)
    SELECT COALESCE(MAX(weekly_count), 0)
    INTO v_max_weekly_freq
    FROM (
      SELECT count(*) as weekly_count
      FROM public.agendamentos a
      WHERE a.paciente_id = p_paciente_id
        AND date_trunc('month', a.data_inicio)::date = p_competencia
        AND a.status IN ('realizado', 'pago', 'falta')
        AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
      GROUP BY date_trunc('week', a.data_inicio)
    ) sub;

    IF v_max_weekly_freq = 1 THEN
      v_package_valor := 120.00;
      v_package_desc := 'Pacote Apoio - 1x por semana';
    ELSIF v_max_weekly_freq = 2 THEN
      v_package_valor := 240.00;
      v_package_desc := 'Pacote Apoio - 2x por semana';
    ELSIF v_max_weekly_freq = 3 THEN
      v_package_valor := 360.00;
      v_package_desc := 'Pacote Apoio - 3x por semana';
    ELSIF v_max_weekly_freq >= 4 THEN
      v_package_valor := 450.00;
      v_package_desc := 'Pacote Apoio - Semana Inteira';
    ELSE
      v_package_valor := 0;
      v_package_desc := 'Pacote Apoio';
    END IF;
  END IF;

  -- 6. If no invoice exists, create one
  IF v_fatura_id IS NULL THEN
    -- Resolve status based on session statuses: if any session is 'pago', we make it 'paga', otherwise 'aberta'
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.paciente_id = p_paciente_id
        AND date_trunc('month', a.data_inicio)::date = p_competencia
        AND a.status = 'pago'
        AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
    ) THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END INTO v_target_status;

    -- Get patient's first professional
    SELECT profissional_id INTO v_target_prof_id
    FROM public.paciente_profissional
    WHERE paciente_id = p_paciente_id
    LIMIT 1;

    INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade, profissional_id, pago_em, metodo)
    VALUES (
      p_paciente_id, 
      p_competencia, 
      v_package_valor, 
      v_target_status, 
      'Apoio',
      v_target_prof_id,
      CASE WHEN v_target_status = 'paga' THEN p_competencia::timestamp ELSE NULL END,
      CASE WHEN v_target_status = 'paga' THEN 'pix'::public.metodo_pagamento ELSE NULL END
    )
    RETURNING id INTO v_fatura_id;
  END IF;

  -- 7. Update or insert the package fee item
  SELECT id INTO v_item_id
  FROM public.fatura_itens
  WHERE fatura_id = v_fatura_id
    AND agendamento_id IS NULL
    AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio')
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    UPDATE public.fatura_itens
    SET descricao = v_package_desc,
        valor_unitario = v_package_valor,
        total = v_package_valor
    WHERE id = v_item_id;
  ELSE
    INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
    VALUES (v_fatura_id, NULL, v_package_desc, 1, v_package_valor, v_package_valor);
  END IF;

  -- 8. Ensure all 'Apoio' session items for this patient and month are linked to this invoice and have value 0
  UPDATE public.fatura_itens fi
  SET fatura_id = v_fatura_id,
      valor_unitario = 0,
      total = 0
  FROM public.agendamentos a
  WHERE fi.agendamento_id = a.id
    AND a.paciente_id = p_paciente_id
    AND date_trunc('month', a.data_inicio)::date = p_competencia
    AND a.status IN ('realizado', 'pago', 'falta')
    AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

  -- 9. Recalculate fatura total
  UPDATE public.faturas
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = v_fatura_id
  ), 0)
  WHERE id = v_fatura_id;

END;
$$;


-- ==========================================
-- Migration: 20260702130000_fix_fatura_valor_trigger.sql
-- ==========================================
-- Migration to recreate tg_sync_fatura_valor and fix out-of-sync faturas totals

-- 1. Recreate the trigger function to update fatura valor when items change
CREATE OR REPLACE FUNCTION public.tg_sync_fatura_valor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fatura_id uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_fatura_id := NEW.fatura_id;
  ELSE
    v_fatura_id := OLD.fatura_id;
  END IF;

  -- Update invoice total with the sum of its items
  UPDATE public.faturas
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = v_fatura_id
  ), 0)
  WHERE id = v_fatura_id;

  -- Handle cleanup of old invoice if fatura_id changed during UPDATE
  IF TG_OP = 'UPDATE' AND OLD.fatura_id <> NEW.fatura_id THEN
    UPDATE public.faturas
    SET valor = COALESCE((
      SELECT SUM(total)
      FROM public.fatura_itens
      WHERE fatura_id = OLD.fatura_id
    ), 0)
    WHERE id = OLD.fatura_id;

    DELETE FROM public.faturas
    WHERE id = OLD.fatura_id
      AND status = 'aberta'
      AND NOT EXISTS (
        SELECT 1 FROM public.fatura_itens WHERE fatura_id = OLD.fatura_id
      );
  END IF;

  -- Delete target invoice if it became empty and is status 'aberta'
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    DELETE FROM public.faturas
    WHERE id = v_fatura_id
      AND status = 'aberta'
      AND NOT EXISTS (
        SELECT 1 FROM public.fatura_itens WHERE fatura_id = v_fatura_id
      );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 2. Ensure trigger exists on fatura_itens table
DROP TRIGGER IF EXISTS tr_sync_fatura_valor ON public.fatura_itens;
DROP TRIGGER IF EXISTS tr_sync_fatura_valor ON public.fatura_itens;
CREATE TRIGGER tr_sync_fatura_valor AFTER INSERT OR UPDATE OR DELETE ON public.fatura_itens
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_fatura_valor();

-- 3. Backfill/Recalculate all non-Apoio faturas totals to ensure everything is synchronized
UPDATE public.faturas f
SET valor = COALESCE((
  SELECT SUM(total)
  FROM public.fatura_itens
  WHERE fatura_id = f.id
), 0)
WHERE f.especialidade <> 'Apoio' OR f.especialidade IS NULL;


-- ==========================================
-- Migration: 20260702140000_auto_recognize_cash_payments.sql
-- ==========================================
-- Migration to automatically detect cash (dinheiro) payments from appointment observations

-- 1. Update fn_recalculate_apoio_package to check for cash keyword in sessions
CREATE OR REPLACE FUNCTION public.fn_recalculate_apoio_package(
  p_paciente_id uuid,
  p_competencia date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_weekly_freq integer;
  v_package_valor numeric;
  v_package_desc text;
  v_fatura_id uuid;
  v_item_id uuid;
  v_has_sessions boolean;
  v_target_status public.fatura_status;
  
  v_apoio_frequencia text;
  v_apoio_valor_personalizado numeric;
  v_session_count integer;
  v_is_apoio boolean;
  v_has_realized_sessions boolean;
  v_target_prof_id uuid;
  v_metodo public.metodo_pagamento;
BEGIN
  -- 1. Check if patient is configured as Apoio (has 'Apoio' or 'AP' in cids_secundarios)
  SELECT (
    cids_secundarios IS NOT NULL AND (
      'Apoio' = ANY(cids_secundarios) OR 'AP' = ANY(cids_secundarios)
    )
  ), apoio_frequencia, apoio_valor_personalizado
  INTO v_is_apoio, v_apoio_frequencia, v_apoio_valor_personalizado
  FROM public.pacientes
  WHERE id = p_paciente_id;

  -- Check if there are any billable 'Apoio' sessions in status realizado, pago, falta
  SELECT EXISTS (
    SELECT 1
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
  ) INTO v_has_realized_sessions;

  -- An Apoio patient gets a package invoice if they have completed/missed sessions, OR if they are on a fixed monthly package (not avulso)
  v_has_sessions := COALESCE(v_has_realized_sessions, false) 
    OR (COALESCE(v_is_apoio, false) AND COALESCE(v_apoio_frequencia, 'avulso') <> 'avulso');

  -- 2. Find the consolidated Apoio invoice for this patient and month
  SELECT id INTO v_fatura_id
  FROM public.faturas
  WHERE paciente_id = p_paciente_id
    AND competencia = p_competencia
    AND especialidade = 'Apoio'
  LIMIT 1;

  -- 3. If there are no sessions, we clean up the package item and the invoice
  IF NOT v_has_sessions THEN
    IF v_fatura_id IS NOT NULL THEN
      DELETE FROM public.fatura_itens 
      WHERE fatura_id = v_fatura_id 
        AND agendamento_id IS NULL 
        AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio');
      
      DELETE FROM public.faturas f
      WHERE f.id = v_fatura_id
        AND NOT EXISTS (
          SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
        );
    END IF;
    RETURN;
  END IF;

  -- 4. Get Apoio configuration
  v_apoio_frequencia := COALESCE(v_apoio_frequencia, 'avulso');

  -- 5. Calculate price based on selected frequency
  IF v_apoio_frequencia = '1x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 120.00);
    v_package_desc := 'Pacote Apoio - 1x por semana';
  ELSIF v_apoio_frequencia = '2x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 240.00);
    v_package_desc := 'Pacote Apoio - 2x por semana';
  ELSIF v_apoio_frequencia = '3x' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 360.00);
    v_package_desc := 'Pacote Apoio - 3x por semana';
  ELSIF v_apoio_frequencia = 'semana_toda' THEN
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 450.00);
    v_package_desc := 'Pacote Apoio - Semana Inteira';
  ELSIF v_apoio_frequencia = 'avulso' THEN
    SELECT COUNT(*)
    INTO v_session_count
    FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status IN ('realizado', 'pago', 'falta')
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

    v_package_valor := v_session_count * COALESCE(v_apoio_valor_personalizado, 50.00);
    v_package_desc := 'Pacote Apoio - Sessões Avulsas (' || v_session_count || ' sessões)';
  ELSE
    SELECT COALESCE(MAX(weekly_count), 0)
    INTO v_max_weekly_freq
    FROM (
      SELECT count(*) as weekly_count
      FROM public.agendamentos a
      WHERE a.paciente_id = p_paciente_id
        AND date_trunc('month', a.data_inicio)::date = p_competencia
        AND a.status IN ('realizado', 'pago', 'falta')
        AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
      GROUP BY date_trunc('week', a.data_inicio)
    ) sub;

    IF v_max_weekly_freq = 1 THEN
      v_package_valor := 120.00;
      v_package_desc := 'Pacote Apoio - 1x por semana';
    ELSIF v_max_weekly_freq = 2 THEN
      v_package_valor := 240.00;
      v_package_desc := 'Pacote Apoio - 2x por semana';
    ELSIF v_max_weekly_freq = 3 THEN
      v_package_valor := 360.00;
      v_package_desc := 'Pacote Apoio - 3x por semana';
    ELSIF v_max_weekly_freq >= 4 THEN
      v_package_valor := 450.00;
      v_package_desc := 'Pacote Apoio - Semana Inteira';
    ELSE
      v_package_valor := 0;
      v_package_desc := 'Pacote Apoio';
    END IF;
  END IF;

  -- Resolve status based on session statuses: if any session is 'pago', we make it 'paga', otherwise 'aberta'
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status = 'pago'
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
  ) THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END INTO v_target_status;

  -- Resolve payment method for Apoio based on session observations
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status = 'pago'
      AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
      AND a.observacoes IS NOT NULL
      AND (
        lower(a.observacoes) LIKE '%dinheiro%' OR 
        lower(a.observacoes) LIKE '%espécie%' OR 
        lower(a.observacoes) LIKE '%especie%' OR 
        lower(a.observacoes) LIKE '%espã©cie%'
      )
  ) THEN 'dinheiro'::public.metodo_pagamento ELSE 'pix'::public.metodo_pagamento END INTO v_metodo;

  -- 6. Insert or update invoice
  IF v_fatura_id IS NULL THEN
    SELECT profissional_id INTO v_target_prof_id
    FROM public.paciente_profissional
    WHERE paciente_id = p_paciente_id
    LIMIT 1;

    INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade, profissional_id, pago_em, metodo)
    VALUES (
      p_paciente_id, 
      p_competencia, 
      v_package_valor, 
      v_target_status, 
      'Apoio',
      v_target_prof_id,
      CASE WHEN v_target_status = 'paga' THEN p_competencia::timestamp ELSE NULL END,
      CASE WHEN v_target_status = 'paga' THEN v_metodo ELSE NULL END
    )
    RETURNING id INTO v_fatura_id;
  ELSE
    UPDATE public.faturas
    SET status = v_target_status,
        pago_em = CASE WHEN v_target_status = 'paga' THEN COALESCE(pago_em, p_competencia::timestamp) ELSE NULL END,
        metodo = CASE WHEN v_target_status = 'paga' THEN v_metodo ELSE NULL END
    WHERE id = v_fatura_id;
  END IF;

  -- 7. Update or insert the package fee item
  SELECT id INTO v_item_id
  FROM public.fatura_itens
  WHERE fatura_id = v_fatura_id
    AND agendamento_id IS NULL
    AND (descricao LIKE 'Pacote Apoio%' OR descricao = 'Pacote Apoio')
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    UPDATE public.fatura_itens
    SET descricao = v_package_desc,
        valor_unitario = v_package_valor,
        total = v_package_valor
    WHERE id = v_item_id;
  ELSE
    INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
    VALUES (v_fatura_id, NULL, v_package_desc, 1, v_package_valor, v_package_valor);
  END IF;

  -- 8. Ensure all 'Apoio' session items are linked
  UPDATE public.fatura_itens fi
  SET fatura_id = v_fatura_id,
      valor_unitario = 0,
      total = 0
  FROM public.agendamentos a
  WHERE fi.agendamento_id = a.id
    AND a.paciente_id = p_paciente_id
    AND date_trunc('month', a.data_inicio)::date = p_competencia
    AND a.status IN ('realizado', 'pago', 'falta')
    AND lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio';

  -- 9. Recalculate fatura total
  UPDATE public.faturas
  SET valor = COALESCE((
    SELECT SUM(total)
    FROM public.fatura_itens
    WHERE fatura_id = v_fatura_id
  ), 0)
  WHERE id = v_fatura_id;
END;
$$;


-- 2. Update tg_sync_agendamento_financeiro to parse payment method
CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_especialidade text;
  v_old_especialidade text;
  v_tipo_agendamento text;
  v_valor numeric;
  v_descricao text;
  v_competencia date;
  v_old_competencia date;
  v_fatura_id uuid;
  v_item_id uuid;
  v_old_fatura_id uuid;
  v_paciente_nome text;
  v_data_str text;
  v_target_status public.fatura_status;
  v_metodo public.metodo_pagamento;
BEGIN
  -- A. CLEANUP ONLY IF ACTION IS DELETE
  IF TG_OP = 'DELETE' THEN
    SELECT id, fatura_id INTO v_item_id, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = OLD.id;

    IF v_item_id IS NOT NULL THEN
      DELETE FROM public.fatura_itens WHERE id = v_item_id;
    END IF;

    v_old_especialidade := public.fn_get_especialidade(OLD.servico_id, OLD.paciente_id, OLD.profissional_id);
    v_old_competencia := date_trunc('month', OLD.data_inicio)::date;

    IF lower(v_old_especialidade) = 'apoio' THEN
      PERFORM public.fn_recalculate_apoio_package(OLD.paciente_id, v_old_competencia);
    ELSE
      IF v_old_fatura_id IS NOT NULL THEN
        DELETE FROM public.faturas f
        WHERE f.id = v_old_fatura_id
          AND NOT EXISTS (
            SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
          );
      END IF;
    END IF;
  END IF;

  -- B. INSERT OR UPDATE NEW ITEM IF ACTION IS INSERT OR UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_especialidade := public.fn_get_especialidade(NEW.servico_id, NEW.paciente_id, NEW.profissional_id);
    IF TG_OP = 'UPDATE' THEN
      v_old_especialidade := public.fn_get_especialidade(OLD.servico_id, OLD.paciente_id, OLD.profissional_id);
      v_old_competencia := date_trunc('month', OLD.data_inicio)::date;
    END IF;

    SELECT id, fatura_id INTO v_item_id, v_old_fatura_id
    FROM public.fatura_itens
    WHERE agendamento_id = NEW.id;

    IF NEW.status = 'realizado' OR NEW.status = 'pago' OR NEW.status = 'falta' THEN
      v_target_status := CASE WHEN NEW.status = 'pago' THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END;
      v_competencia := date_trunc('month', NEW.data_inicio)::date;

      SELECT nome INTO v_paciente_nome FROM public.pacientes WHERE id = NEW.paciente_id;
      v_data_str := to_char(timezone('America/Sao_Paulo', NEW.data_inicio), 'DD/MM/YYYY HH24:MI');
      
      IF NEW.observacoes LIKE '[Tipo: Anamnese]%' THEN
        v_tipo_agendamento := 'anamnese';
        v_descricao := COALESCE(v_especialidade, 'Avaliação') || ' (Avaliação) - ' || v_data_str;
      ELSE
        v_tipo_agendamento := 'sessao';
        v_descricao := COALESCE(v_especialidade, 'Sessão') || ' - ' || v_data_str;
      END IF;

      -- Resolve payment method
      v_metodo := 'pix'::public.metodo_pagamento;
      IF NEW.observacoes IS NOT NULL AND (
         lower(NEW.observacoes) LIKE '%dinheiro%' OR 
         lower(NEW.observacoes) LIKE '%espécie%' OR 
         lower(NEW.observacoes) LIKE '%especie%' OR 
         lower(NEW.observacoes) LIKE '%espã©cie%'
      ) THEN
        v_metodo := 'dinheiro'::public.metodo_pagamento;
      END IF;

      -- CASE 1: SPECIALTY IS APOIO
      IF lower(v_especialidade) = 'apoio' THEN
        SELECT id INTO v_fatura_id
        FROM public.faturas
        WHERE paciente_id = NEW.paciente_id
          AND competencia = v_competencia
          AND especialidade = 'Apoio'
        LIMIT 1;

        IF v_fatura_id IS NULL THEN
          INSERT INTO public.faturas (paciente_id, competencia, valor, status, especialidade)
          VALUES (NEW.paciente_id, v_competencia, 0, 'aberta', 'Apoio')
          RETURNING id INTO v_fatura_id;
        END IF;

        IF v_item_id IS NOT NULL THEN
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id,
              descricao = v_descricao,
              valor_unitario = 0,
              total = 0
          WHERE id = v_item_id;
        ELSE
          INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
          VALUES (v_fatura_id, NEW.id, v_descricao, 1, 0, 0);
        END IF;

        PERFORM public.fn_recalculate_apoio_package(NEW.paciente_id, v_competencia);

        IF TG_OP = 'UPDATE' AND (OLD.paciente_id <> NEW.paciente_id OR v_old_competencia <> v_competencia OR lower(v_old_especialidade) <> 'apoio') THEN
          IF lower(v_old_especialidade) = 'apoio' THEN
            PERFORM public.fn_recalculate_apoio_package(OLD.paciente_id, v_old_competencia);
          END IF;
        END IF;

      -- CASE 2: SPECIALTY IS NOT APOIO
      ELSE
        v_valor := public.fn_get_pricing(NEW.paciente_id, NEW.profissional_id, v_especialidade, v_tipo_agendamento);

        IF v_item_id IS NOT NULL THEN
          v_fatura_id := v_old_fatura_id;
          
          UPDATE public.faturas
          SET status = v_target_status,
              pago_em = CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
              metodo = CASE WHEN v_target_status = 'paga'::public.fatura_status THEN v_metodo ELSE NULL END,
              especialidade = v_especialidade,
              profissional_id = NEW.profissional_id
          WHERE id = v_fatura_id;
        ELSE
          INSERT INTO public.faturas (paciente_id, competencia, valor, status, pago_em, metodo, especialidade, profissional_id)
          -- Note: the original column spelling is profissional_id
          VALUES (
            NEW.paciente_id, 
            v_competencia, 
            0, 
            v_target_status,
            CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(NEW.data_inicio, now()) ELSE NULL END,
            CASE WHEN v_target_status = 'paga'::public.fatura_status THEN v_metodo ELSE NULL END,
            v_especialidade,
            NEW.profissional_id
          )
          RETURNING id INTO v_fatura_id;
        END IF;

        IF v_item_id IS NOT NULL THEN
          UPDATE public.fatura_itens
          SET fatura_id = v_fatura_id,
              descricao = v_descricao,
              valor_unitario = v_valor,
              total = v_valor
          WHERE id = v_item_id;
        ELSE
          INSERT INTO public.fatura_itens (fatura_id, agendamento_id, descricao, quantidade, valor_unitario, total)
          VALUES (v_fatura_id, NEW.id, v_descricao, 1, v_valor, v_valor);
        END IF;

        IF TG_OP = 'UPDATE' AND lower(v_old_especialidade) = 'apoio' THEN
          PERFORM public.fn_recalculate_apoio_package(OLD.paciente_id, v_old_competencia);
        END IF;
      END IF;

    ELSE
      IF v_item_id IS NOT NULL THEN
        DELETE FROM public.fatura_itens WHERE id = v_item_id;
        
        IF lower(v_especialidade) = 'apoio' THEN
          PERFORM public.fn_recalculate_apoio_package(NEW.paciente_id, date_trunc('month', NEW.data_inicio)::date);
        ELSE
          IF v_old_fatura_id IS NOT NULL THEN
            DELETE FROM public.faturas f
            WHERE f.id = v_old_fatura_id
              AND NOT EXISTS (
                SELECT 1 FROM public.fatura_itens WHERE fatura_id = f.id
              );
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- 3. Backfill/Scan and update all existing paid faturas to recognize cash payments
-- Update non-Apoio faturas
UPDATE public.faturas f
SET metodo = 'dinheiro'::public.metodo_pagamento
WHERE f.status = 'paga'
  AND f.metodo = 'pix'::public.metodo_pagamento
  AND EXISTS (
    SELECT 1 
    FROM public.fatura_itens fi
    JOIN public.agendamentos a ON fi.agendamento_id = a.id
    WHERE fi.fatura_id = f.id
      AND a.observacoes IS NOT NULL
      AND (
        lower(a.observacoes) LIKE '%dinheiro%' OR 
        lower(a.observacoes) LIKE '%espécie%' OR 
        lower(a.observacoes) LIKE '%especie%' OR 
        lower(a.observacoes) LIKE '%espã©cie%'
      )
  );

-- Update Apoio faturas
UPDATE public.faturas f
SET metodo = 'dinheiro'::public.metodo_pagamento
WHERE f.status = 'paga'
  AND f.metodo = 'pix'::public.metodo_pagamento
  AND f.especialidade = 'Apoio'
  AND EXISTS (
    SELECT 1 
    FROM public.agendamentos a
    WHERE a.paciente_id = f.paciente_id
      AND date_trunc('month', a.data_inicio)::date = f.competencia
      AND a.status = 'pago'
      AND a.observacoes IS NOT NULL
      AND (
        lower(a.observacoes) LIKE '%dinheiro%' OR 
        lower(a.observacoes) LIKE '%espécie%' OR 
        lower(a.observacoes) LIKE '%especie%' OR 
        lower(a.observacoes) LIKE '%espã©cie%'
      )
  );


-- ==========================================
-- Migration: 20260713180000_create_mural_recados.sql
-- ==========================================
-- Migration to create mural_recados table and enable realtime

CREATE TABLE IF NOT EXISTS public.mural_recados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  autor text NOT NULL,
  destinatario text,
  conteudo text NOT NULL
);

-- Enable RLS
ALTER TABLE public.mural_recados ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.mural_recados TO authenticated;
GRANT ALL ON public.mural_recados TO service_role;
GRANT ALL ON public.mural_recados TO anon;

-- Create policies for authenticated users
DROP POLICY IF EXISTS "Allow read for all authenticated users" ON public.mural_recados;
CREATE POLICY "Allow read for all authenticated users" ON public.mural_recados
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for all authenticated users" ON public.mural_recados;
CREATE POLICY "Allow insert for all authenticated users" ON public.mural_recados
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for all authenticated users" ON public.mural_recados;
CREATE POLICY "Allow delete for all authenticated users" ON public.mural_recados
  FOR DELETE TO authenticated USING (true);

-- Create policies for anon access (to make sure any anon client usage does not fail)
DROP POLICY IF EXISTS "Allow read for anon" ON public.mural_recados;
CREATE POLICY "Allow read for anon" ON public.mural_recados
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow insert for anon" ON public.mural_recados;
CREATE POLICY "Allow insert for anon" ON public.mural_recados
  FOR INSERT TO anon WITH CHECK (true);

-- Enable Supabase Realtime for mural_recados
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 
      from pg_publication_rel pr 
      join pg_class c on pr.prrelid = c.oid 
      join pg_namespace n on c.relnamespace = n.oid 
      join pg_publication p on pr.prpubid = p.oid
      where p.pubname = 'supabase_realtime' 
        and n.nspname = 'public' 
        and c.relname = 'mural_recados'
    ) then
      alter publication supabase_realtime add table public.mural_recados;
    end if;
  end if;
end
$$;


-- ==========================================
-- Migration: 20260713190000_add_anon_delete_update_mural_recados.sql
-- ==========================================
-- Migration to allow delete and update policies for anon users on mural_recados table

DROP POLICY IF EXISTS "Allow delete for anon" ON public.mural_recados;
CREATE POLICY "Allow delete for anon" ON public.mural_recados
  FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow update for anon" ON public.mural_recados;
CREATE POLICY "Allow update for anon" ON public.mural_recados
  FOR UPDATE TO anon USING (true);


-- ==========================================
-- Migration: 20260714120000_add_cobrar_dia_to_pacientes.sql
-- ==========================================
-- Migration to add cobrar_dia column to public.pacientes table

ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS cobrar_dia integer CHECK (cobrar_dia >= 1 AND cobrar_dia <= 31);


-- ==========================================
-- Migration: 20260714130000_add_feito_to_mural_recados.sql
-- ==========================================
-- Migration to add feito boolean column to mural_recados table

ALTER TABLE public.mural_recados ADD COLUMN IF NOT EXISTS feito boolean NOT NULL DEFAULT false;


-- ==========================================
-- Migration: 20260714140000_add_ferias_status_to_agendamentos.sql
-- ==========================================
-- Migration to add 'ferias' value to agendamento_status enum type

ALTER TYPE public.agendamento_status ADD VALUE IF NOT EXISTS 'ferias';


-- ==========================================
-- Migration: 20260715094000_add_resposta_to_mural_recados.sql
-- ==========================================
-- Migration to add resposta text column to mural_recados table

ALTER TABLE public.mural_recados ADD COLUMN IF NOT EXISTS resposta text;


-- ==========================================
-- Migration: 20260724180000_create_comprovantes_pagamento.sql
-- ==========================================
-- Migration to create comprovantes_pagamento table
CREATE TABLE IF NOT EXISTS public.comprovantes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid REFERENCES public.faturas(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  tipo_arquivo text NOT NULL,
  url_arquivo text NOT NULL,
  data_pagamento date NOT NULL,
  valor numeric(12,2) DEFAULT 0,
  metodo text DEFAULT 'pix',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comprovantes_pagamento TO authenticated;
GRANT ALL ON public.comprovantes_pagamento TO service_role;
ALTER TABLE public.comprovantes_pagamento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comprovantes_pagamento' AND policyname = 'auth all comprovantes_pagamento'
  ) THEN
    DROP POLICY IF EXISTS "auth all comprovantes_pagamento" ON public.comprovantes_pagamento;
CREATE POLICY "auth all comprovantes_pagamento" ON public.comprovantes_pagamento FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comprovantes_paciente ON public.comprovantes_pagamento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_fatura ON public.comprovantes_pagamento(fatura_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_data_pagamento ON public.comprovantes_pagamento(data_pagamento ASC);


