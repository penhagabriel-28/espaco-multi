-- Migration: Garantir sincronização de salários e repasses dos profissionais em valores_config
-- Alinhado com os dados exibidos no computador da diretoria (Setembro/2026)

-- 1. Adriana: Salário R$ 500,00
UPDATE public.profissionais
SET valores_config = jsonb_set(
  jsonb_set(
    COALESCE(valores_config, '{}'::jsonb),
    '{salario_fixo}',
    '500'::jsonb
  ),
  '{salarios_por_mes}',
  COALESCE(valores_config->'salarios_por_mes', '{}'::jsonb) || '{"2026-09-01_2026-09-30": 500}'::jsonb
)
WHERE nome ILIKE '%Adriana%';

-- 2. Bruna Lorrane Soares: Salário R$ 1.600,00
UPDATE public.profissionais
SET valores_config = jsonb_set(
  jsonb_set(
    COALESCE(valores_config, '{}'::jsonb),
    '{salario_fixo}',
    '1600'::jsonb
  ),
  '{salarios_por_mes}',
  COALESCE(valores_config->'salarios_por_mes', '{}'::jsonb) || '{"2026-09-01_2026-09-30": 1600}'::jsonb
)
WHERE nome ILIKE '%Bruna%Lorrane%';

-- 3. Gabriel Oliveira: Salário R$ 1.250,00
UPDATE public.profissionais
SET valores_config = jsonb_set(
  jsonb_set(
    COALESCE(valores_config, '{}'::jsonb),
    '{salario_fixo}',
    '1250'::jsonb
  ),
  '{salarios_por_mes}',
  COALESCE(valores_config->'salarios_por_mes', '{}'::jsonb) || '{"2026-09-01_2026-09-30": 1250}'::jsonb
)
WHERE nome ILIKE '%Gabriel%Oliveira%';

-- 4. Limpar qualquer salário fixo acidental de Gabriela Martins (atendimento clínico apenas)
UPDATE public.profissionais
SET valores_config = (valores_config - 'salario_fixo') - 'salarios_por_mes'
WHERE nome ILIKE '%Gabriela%Martins%';
