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
CREATE POLICY "Allow read for all authenticated users" ON public.mural_recados
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for all authenticated users" ON public.mural_recados
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow delete for all authenticated users" ON public.mural_recados
  FOR DELETE TO authenticated USING (true);

-- Create policies for anon access (to make sure any anon client usage does not fail)
CREATE POLICY "Allow read for anon" ON public.mural_recados
  FOR SELECT TO anon USING (true);

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
