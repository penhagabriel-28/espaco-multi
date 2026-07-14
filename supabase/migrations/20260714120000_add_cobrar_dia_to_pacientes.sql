-- Migration to add cobrar_dia column to public.pacientes table

ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS cobrar_dia integer CHECK (cobrar_dia >= 1 AND cobrar_dia <= 31);
