-- Migration: Split compound responsaveis records joined by ' e ' into separate individual rows
DO $$
DECLARE
  r RECORD;
  part1 TEXT;
  part2 TEXT;
BEGIN
  FOR r IN 
    SELECT id, paciente_id, nome, telefone, parentesco, email, endereco 
    FROM public.responsaveis 
    WHERE nome ~* '\s+(e|/|&|\+|e/ou)\s+'
  LOOP
    part1 := trim(regexp_replace(r.nome, '\s+(e|/|&|\+|e/ou)\s+.*$', '', 'i'));
    part2 := trim(regexp_replace(r.nome, '^.*?\s+(e|/|&|\+|e/ou)\s+', '', 'i'));
    
    IF length(part1) > 0 AND length(part2) > 0 THEN
      UPDATE public.responsaveis
      SET nome = part1
      WHERE id = r.id;

      INSERT INTO public.responsaveis (paciente_id, nome, telefone, parentesco, email, endereco)
      VALUES (r.paciente_id, part2, r.telefone, r.parentesco, r.email, r.endereco);
    END IF;
  END LOOP;
END $$;
