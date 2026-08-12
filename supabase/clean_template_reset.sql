-- ==============================================================================
-- SCRIPT DE LIMPEZA E RESET DE DADOS (TEMPLATE PARA NOVO PROJETO SUPABASE)
-- ==============================================================================
-- ATENÇÃO: Este script remove TODOS os registros de dados (pacientes, agendamentos,
-- faturas, profissionais, recados, etc.) mantendo intactas a estrutura do banco,
-- tabelas, funções, triggers, views e políticas de acesso (RLS).
--
-- RECOMENDAÇÃO: Execute no SQL Editor do seu novo projeto Supabase.
-- ==============================================================================

BEGIN;

-- Limpar todas as tabelas transacionais e operacionais com CASCADE (reiniciando IDs autoincremento se houver)

TRUNCATE TABLE 
    public.comprovantes_pagamento,
    public.mural_recados,
    public.controle_relatorios,
    public.anamneses,
    public.fatura_itens,
    public.faturas,
    public.despesas,
    public.agendamentos,
    public.bloqueios_agenda,
    public.paciente_profissional,
    public.pacientes,
    public.responsaveis,
    public.profissionais,
    public.salas,
    public.servicos,
    public.tipos_documento,
    public.user_roles,
    public.profiles
RESTART IDENTITY CASCADE;

-- Se for criar um projeto 100% zerado no Supabase Auth, também pode ser limpo o auth.users:
-- DELETE FROM auth.users;

COMMIT;

-- ==============================================================================
-- ESTRUTURA PRONTA E LIMPA PARA NOVO CLIENTE / INSTÂNCIA
-- ==============================================================================
