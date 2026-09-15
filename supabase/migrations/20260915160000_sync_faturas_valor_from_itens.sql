-- Sincronizar o valor de faturas que estavam zeradas ou nulas com o somatório dos seus itens de atendimento
UPDATE public.faturas f
SET valor = sub.total_itens
FROM (
  SELECT fatura_id, SUM(total) AS total_itens
  FROM public.fatura_itens
  GROUP BY fatura_id
  HAVING SUM(total) > 0
) sub
WHERE f.id = sub.fatura_id
  AND (f.valor = 0 OR f.valor IS NULL);
