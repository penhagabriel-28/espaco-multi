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
    CREATE POLICY "auth all comprovantes_pagamento" ON public.comprovantes_pagamento FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comprovantes_paciente ON public.comprovantes_pagamento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_fatura ON public.comprovantes_pagamento(fatura_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_data_pagamento ON public.comprovantes_pagamento(data_pagamento ASC);
