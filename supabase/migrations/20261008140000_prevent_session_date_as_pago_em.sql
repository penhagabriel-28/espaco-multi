-- Migration to ensure sessions settled or marked as paid use the settlement payment date, not the appointment date

CREATE OR REPLACE FUNCTION public.tg_sync_agendamento_financeiro()
RETURNS trigger
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

      -- Resolve payment method dynamically
      v_metodo := public.fn_parse_metodo_pagamento(NEW.observacoes);

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
              -- Preserve existing pago_em or set to current timestamp (never overwrite with past session date)
              pago_em = CASE 
                WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(public.faturas.pago_em, now()) 
                ELSE NULL 
              END,
              metodo = CASE 
                WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(public.faturas.metodo, v_metodo, 'pix'::public.metodo_pagamento) 
                ELSE NULL 
              END,
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
            CASE WHEN v_target_status = 'paga'::public.fatura_status THEN now() ELSE NULL END,
            CASE WHEN v_target_status = 'paga'::public.fatura_status THEN COALESCE(v_metodo, 'pix'::public.metodo_pagamento) ELSE NULL END,
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
