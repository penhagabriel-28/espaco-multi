-- Migration to add resposta text column to mural_recados table

ALTER TABLE public.mural_recados ADD COLUMN IF NOT EXISTS resposta text;
