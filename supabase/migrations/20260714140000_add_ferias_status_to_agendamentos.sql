-- Migration to add 'ferias' value to agendamento_status enum type

ALTER TYPE public.agendamento_status ADD VALUE IF NOT EXISTS 'ferias';
