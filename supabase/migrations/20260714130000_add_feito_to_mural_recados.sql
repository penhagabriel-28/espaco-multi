-- Migration to add feito boolean column to mural_recados table

ALTER TABLE public.mural_recados ADD COLUMN IF NOT EXISTS feito boolean NOT NULL DEFAULT false;
