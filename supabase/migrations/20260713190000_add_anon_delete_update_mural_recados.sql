-- Migration to allow delete and update policies for anon users on mural_recados table

CREATE POLICY "Allow delete for anon" ON public.mural_recados
  FOR DELETE TO anon USING (true);

CREATE POLICY "Allow update for anon" ON public.mural_recados
  FOR UPDATE TO anon USING (true);
