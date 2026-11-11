-- Migration to enable Realtime for responsaveis, paciente_profissional and related clinical records

DO $$
DECLARE
  v_table text;
  v_tables text[] := array['responsaveis', 'paciente_profissional', 'anamneses', 'agendamentos', 'pacientes'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_rel pr 
      JOIN pg_class c ON pr.prrelid = c.oid 
      JOIN pg_namespace n ON c.relnamespace = n.oid 
      JOIN pg_publication p ON pr.prpubid = p.oid
      WHERE p.pubname = 'supabase_realtime' 
        AND n.nspname = 'public' 
        AND c.relname = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
    END IF;
  END LOOP;
END
$$;

