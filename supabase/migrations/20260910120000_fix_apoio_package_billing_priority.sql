-- Migration to fix Apoio package billing, custom values priority, and ensure per-session calculations are not applied to packages
-- 1. Update fn_recalculate_apoio_package
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
      OR array_to_string(cids_secundarios, ',') ILIKE '%apoio%'
      OR array_to_string(cids_secundarios, ',') ILIKE '%ap%'
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
      AND (
        lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
        OR lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'ap'
      )
  ) INTO v_has_realized_sessions;

  -- An Apoio patient gets a package invoice if they have completed/missed sessions, OR if they are on a fixed monthly package (not avulso)
  v_has_sessions := COALESCE(v_has_realized_sessions, false) 
    OR (COALESCE(v_is_apoio, false) AND COALESCE(v_apoio_frequencia, 'avulso') <> 'avulso');

  -- 2. Find the consolidated Apoio invoice for this patient and month
  SELECT id INTO v_fatura_id
  FROM public.faturas
  WHERE paciente_id = p_paciente_id
    AND competencia = p_competencia
    AND (especialidade = 'Apoio' OR especialidade = 'AP' OR especialidade ILIKE '%apoio%')
  LIMIT 1;

  -- 3. If there are no sessions and not on fixed package, clean up
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
  -- Priority: v_apoio_valor_personalizado ALWAYS takes priority if defined!
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
      AND (
        lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
        OR lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'ap'
      );

    v_package_valor := v_session_count * COALESCE(v_apoio_valor_personalizado, 50.00);
    v_package_desc := 'Pacote Apoio - Sessões Avulsas (' || v_session_count || ' sessões)';
  ELSE
    v_package_valor := COALESCE(v_apoio_valor_personalizado, 450.00);
    v_package_desc := 'Pacote Apoio';
  END IF;

  -- Resolve status based on session statuses: if any session is 'pago', we make it 'paga', otherwise 'aberta'
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status = 'pago'
      AND (
        lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
        OR lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'ap'
      )
  ) THEN 'paga'::public.fatura_status ELSE 'aberta'::public.fatura_status END INTO v_target_status;

  -- Resolve payment method for Apoio based on session observations
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.paciente_id = p_paciente_id
      AND date_trunc('month', a.data_inicio)::date = p_competencia
      AND a.status = 'pago'
      AND (
        lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
        OR lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'ap'
      )
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

    INSERT INTO public.faturas (paciente_id, competencia, vencimento, valor, status, especialidade, profissional_id, pago_em, metodo)
    VALUES (
      p_paciente_id, 
      p_competencia, 
      (date_trunc('month', p_competencia) + interval '1 month')::date,
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
        metodo = CASE WHEN v_target_status = 'paga' THEN v_metodo ELSE NULL END,
        vencimento = COALESCE(vencimento, (date_trunc('month', p_competencia) + interval '1 month')::date),
        valor = v_package_valor
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

  -- 8. Ensure ALL session items linked to this Apoio invoice have valor_unitario = 0 and total = 0
  UPDATE public.fatura_itens fi
  SET fatura_id = v_fatura_id,
      valor_unitario = 0,
      total = 0
  WHERE fi.fatura_id = v_fatura_id
    AND fi.agendamento_id IS NOT NULL;

  -- Also link any unlinked Apoio sessions for this patient and month
  UPDATE public.fatura_itens fi
  SET fatura_id = v_fatura_id,
      valor_unitario = 0,
      total = 0
  FROM public.agendamentos a
  WHERE fi.agendamento_id = a.id
    AND a.paciente_id = p_paciente_id
    AND date_trunc('month', a.data_inicio)::date = p_competencia
    AND a.status IN ('realizado', 'pago', 'falta')
    AND (
      lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'apoio'
      OR lower(public.fn_get_especialidade(a.servico_id, a.paciente_id, a.profissional_id)) = 'ap'
    );

  -- 9. Recalculate fatura total (equals the package valor!)
  UPDATE public.faturas
  SET valor = v_package_valor
  WHERE id = v_fatura_id;
END;
$$;


-- 2. Update tg_sync_paciente_apoio_recalc to recalculate ALL months for the patient
CREATE OR REPLACE FUNCTION public.tg_sync_paciente_apoio_recalc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp date;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.cids_secundarios IS NOT NULL AND (
      'Apoio' = ANY(NEW.cids_secundarios) OR 'AP' = ANY(NEW.cids_secundarios)
      OR array_to_string(NEW.cids_secundarios, ',') ILIKE '%apoio%'
    ) THEN
      PERFORM public.fn_recalculate_apoio_package(NEW.id, date_trunc('month', now())::date);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate across all months where patient has Apoio faturas or agendamentos
    FOR v_comp IN
      SELECT DISTINCT competencia FROM public.faturas 
      WHERE paciente_id = NEW.id AND (especialidade = 'Apoio' OR especialidade = 'AP' OR especialidade ILIKE '%apoio%')
      UNION
      SELECT DISTINCT date_trunc('month', data_inicio)::date FROM public.agendamentos 
      WHERE paciente_id = NEW.id
      UNION
      SELECT date_trunc('month', now())::date
    LOOP
      IF v_comp IS NOT NULL THEN
        PERFORM public.fn_recalculate_apoio_package(NEW.id, v_comp);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_paciente_apoio_recalc ON public.pacientes;
CREATE TRIGGER tr_sync_paciente_apoio_recalc
  AFTER INSERT OR UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.tg_sync_paciente_apoio_recalc();


-- 3. Backfill and recalculate all existing Apoio packages for all patients across all competencies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT p.id as pac_id, f.competencia as comp
    FROM public.pacientes p
    JOIN public.faturas f ON f.paciente_id = p.id
    WHERE (f.especialidade = 'Apoio' OR f.especialidade = 'AP' OR f.especialidade ILIKE '%apoio%'
           OR (p.cids_secundarios IS NOT NULL AND (
             'Apoio' = ANY(p.cids_secundarios) OR 'AP' = ANY(p.cids_secundarios)
             OR array_to_string(p.cids_secundarios, ',') ILIKE '%apoio%'
           )))
    UNION
    SELECT DISTINCT p.id as pac_id, date_trunc('month', a.data_inicio)::date as comp
    FROM public.pacientes p
    JOIN public.agendamentos a ON a.paciente_id = p.id
    WHERE (p.cids_secundarios IS NOT NULL AND (
      'Apoio' = ANY(p.cids_secundarios) OR 'AP' = ANY(p.cids_secundarios)
      OR array_to_string(p.cids_secundarios, ',') ILIKE '%apoio%'
    ))
  LOOP
    IF r.pac_id IS NOT NULL AND r.comp IS NOT NULL THEN
      PERFORM public.fn_recalculate_apoio_package(r.pac_id, r.comp);
    END IF;
  END LOOP;
END;
$$;
