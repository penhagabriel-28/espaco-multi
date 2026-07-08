-- Billing Migration Script --
BEGIN;

-- Disable USER triggers temporarily to avoid double triggers/logic (keeps system triggers enabled)
ALTER TABLE public.faturas DISABLE TRIGGER USER;
ALTER TABLE public.fatura_itens DISABLE TRIGGER USER;

-- 1. Insert faturas --
INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '95b2fa49-e504-4a81-b310-03cc696c8952', '2026-06-01', '2026-06-15T21:22:09.809084+00:00', NULL, NULL, NULL, 'a2fb99ac-16ee-431f-a653-bfd51730e86d', NULL, NULL, 'aberta', '2026-06-17T13:44:51.597063+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '763f4cfa-93f1-4d18-875b-49511ae2d1c0', '2026-06-01', '2026-06-15T21:22:11.460346+00:00', NULL, NULL, NULL, '1c953d93-5fd4-43b3-bb91-93a547a3640e', NULL, NULL, 'aberta', '2026-06-16T17:19:51.934363+00:00', 510, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '473bb866-caec-4291-ab46-2d850c884e85', '2026-06-01', '2026-06-15T21:22:05.561033+00:00', NULL, NULL, NULL, '68cea200-65c3-43d8-ba82-f6eb266300a9', NULL, NULL, 'aberta', '2026-06-17T18:26:55.601184+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '06609b39-2c85-4afb-9614-0ce95f361e00', '2026-06-01', '2026-06-15T21:22:25.562039+00:00', NULL, NULL, NULL, '46170eb3-0f03-4b7e-8a29-eefc18742ea4', NULL, NULL, 'aberta', '2026-06-15T21:23:35.622576+00:00', 220, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '79fbe2c4-5bb5-4542-95de-e39ac264ab83', '2026-06-01', '2026-06-17T13:20:47.544264+00:00', NULL, 'pix', NULL, '672eb7f7-bb8f-4ec9-b2c1-d5bc46dc8840', '2026-06-17T14:00:00+00:00', NULL, 'paga', '2026-06-17T13:20:48.745828+00:00', 150, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '2a65b28d-74ea-47a1-81ba-3aa6ec8f462c', '2026-06-01', '2026-06-15T21:22:26.379207+00:00', NULL, NULL, NULL, 'e11a5f4e-aac1-4da3-a84d-e6fe6286f96a', NULL, NULL, 'aberta', '2026-06-15T21:23:36.158834+00:00', 170, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'd8f319cc-854b-4b6d-b652-98929af8387c', '2026-06-01', '2026-06-15T19:48:40.191864+00:00', NULL, 'dinheiro', NULL, '278b86fa-1ac6-421e-bda5-e54143e36a5d', '2026-06-05T19:00:00+00:00', NULL, 'paga', '2026-06-15T19:48:40.842254+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '6d072a28-dcc4-494d-8a2a-a389e28c9da2', '2026-06-01', '2026-06-15T19:50:11.099661+00:00', NULL, 'pix', NULL, 'd0180f85-cb7c-4b3b-8a7c-0ba09b1f57e4', '2026-06-08T17:00:00+00:00', NULL, 'paga', '2026-06-15T19:50:43.440293+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '8d063b19-e412-4b54-8748-ef71585cd521', '2026-06-01', '2026-06-10T11:27:03.197571+00:00', NULL, NULL, NULL, 'd447d4a0-b524-41a3-a244-83e01ff2d600', NULL, NULL, 'aberta', '2026-06-15T17:58:52.153055+00:00', 270, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '5cdd38ff-3671-480d-b1d9-cc263593da57', '2026-06-01', '2026-06-15T19:51:49.344606+00:00', NULL, 'dinheiro', NULL, '5b7f59a4-c16f-402c-8e5c-5b901a4d9766', '2026-06-13T18:00:00+00:00', NULL, 'paga', '2026-06-15T19:51:50.454449+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '7edd53ab-f8da-4710-bc0d-df9563729671', '2026-06-01', '2026-06-15T19:53:24.201485+00:00', NULL, 'pix', NULL, '8c674f37-97c2-46bc-be32-a2be87701c3a', '2026-06-13T19:00:00+00:00', NULL, 'paga', '2026-06-15T19:53:24.923144+00:00', 100, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '4304ae20-ea13-489a-81ad-5485f668bb08', '2026-06-01', '2026-06-15T19:54:38.593404+00:00', NULL, 'pix', NULL, 'eb8cf140-e130-49a6-902c-b9d785d3f722', '2026-06-13T11:00:00+00:00', NULL, 'paga', '2026-06-15T20:09:54.116485+00:00', 100, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '660c6fdb-7ed1-4631-9702-b377e2605ca2', '2026-06-01', '2026-06-15T20:32:45.206432+00:00', NULL, 'pix', NULL, 'b55cc706-eadd-4d1b-9ade-12e3df166334', '2026-06-05T21:00:00+00:00', NULL, 'paga', '2026-06-15T20:32:45.910927+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '5fcd0973-8086-4976-afb3-c4602dd2634f', '2026-06-01', '2026-06-15T19:39:57.368644+00:00', NULL, 'pix', NULL, '2713d9de-41c5-4a43-997c-8d06cb65e78a', '2026-06-06T11:00:00+00:00', NULL, 'paga', '2026-06-15T20:56:09.083394+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'f3b08623-f0be-46eb-932c-2a8519f13082', '2026-06-01', '2026-06-12T13:24:12.389901+00:00', NULL, NULL, NULL, 'bc705e16-d358-488f-90d0-cbd23e0fdb86', NULL, NULL, 'aberta', '2026-06-15T21:23:44.26666+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '03b3f308-5739-402b-a3be-262fd86301d5', '2026-06-01', '2026-06-15T19:12:14.335467+00:00', NULL, 'pix', NULL, '716150b5-4f4e-485d-ad9b-fcf7fb963711', '2026-06-02T19:30:00+00:00', NULL, 'paga', '2026-06-17T12:37:31.790979+00:00', 340, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'c286a3a7-80ae-4529-9f3b-6b49f55faea8', '2026-06-01', '2026-06-15T21:21:58.260722+00:00', NULL, NULL, NULL, '6f839b2c-df54-4a1c-9d3a-b20cf71225d1', NULL, NULL, 'aberta', '2026-06-15T21:23:22.282433+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '6093c2f2-fef9-4d42-9761-99299dafc0a0', '2026-06-01', '2026-06-15T21:22:41.404576+00:00', NULL, NULL, NULL, '6719a1dd-3850-4dc7-8541-d69968b797cd', NULL, NULL, 'aberta', '2026-06-16T12:13:53.967788+00:00', 0, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'a0ea4064-4a99-4712-a75f-59bc47419cfb', '2026-06-01', '2026-06-15T21:21:59.96048+00:00', NULL, NULL, NULL, 'd0180f85-cb7c-4b3b-8a7c-0ba09b1f57e4', NULL, NULL, 'aberta', '2026-06-15T21:23:23.418303+00:00', 150, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'ff55cb5d-1e78-4785-aa11-268b3a123d0f', '2026-06-01', '2026-06-15T19:10:26.537084+00:00', NULL, 'pix', NULL, '470cd984-65be-494a-8802-9405c16d20fc', '2026-06-01T21:00:00+00:00', NULL, 'paga', '2026-06-15T21:11:44.747564+00:00', 200, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'ee3fff60-e179-4104-abe5-527c4849b6db', '2026-06-01', '2026-06-09T17:30:43.486256+00:00', NULL, NULL, NULL, '0b732b0e-2a91-4124-94de-ea0ccee89bb4', NULL, NULL, 'aberta', '2026-06-15T21:23:23.948584+00:00', 1140, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'a7b58ab2-45b6-4225-bf85-a63e3f122881', '2026-06-01', '2026-06-11T11:47:12.388491+00:00', NULL, NULL, NULL, 'be16dcdf-966c-4db5-81a6-8bd12fa785e4', NULL, NULL, 'aberta', '2026-06-17T18:56:48.116182+00:00', 1220, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '8361d629-f5e9-4e2f-9a68-d353434ef21c', '2026-06-01', '2026-06-15T21:22:07.722226+00:00', NULL, NULL, NULL, 'f4b30b53-d5e7-4ad7-bac3-1307ceb75361', NULL, NULL, 'aberta', '2026-06-16T12:21:11.146647+00:00', 650, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '06778701-5dcb-4058-b143-193c6bc38e3c', '2026-06-01', '2026-06-15T21:22:04.733915+00:00', NULL, NULL, NULL, 'a821a621-342a-4def-9bb7-85e59c0ff1fb', NULL, NULL, 'aberta', '2026-06-15T21:23:25.623525+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '470ca84a-56d7-4a8b-8591-59db1b7284d1', '2026-06-01', '2026-06-15T21:22:01.335027+00:00', NULL, NULL, NULL, '7d9384aa-c51e-4ee2-9a22-d56bdbf3e973', NULL, NULL, 'aberta', '2026-06-16T21:16:18.876604+00:00', 520, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'ae81bd08-2d78-4938-a05d-0107caa64e30', '2026-06-01', '2026-06-15T21:22:06.899271+00:00', NULL, NULL, NULL, '277dea18-5b24-419d-8b0d-6ca6e4e908b4', NULL, NULL, 'aberta', '2026-06-15T21:23:26.716456+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'c1ec8dac-09b1-46b9-a6c2-92aa57b0e586', '2026-06-01', '2026-06-15T21:22:33.32598+00:00', NULL, NULL, NULL, '5459bfa4-5387-4178-adb6-2f93b364cd1f', NULL, NULL, 'aberta', '2026-06-16T19:16:15.784351+00:00', 300, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '2a09b278-dd0d-4d61-aa94-082dd01c9585', '2026-06-01', '2026-06-15T21:22:10.650315+00:00', NULL, NULL, NULL, 'fe5f1c29-9b2c-41de-9dbc-27b0d9ec4072', NULL, NULL, 'aberta', '2026-06-15T21:23:28.953961+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '8e6063b9-a424-4f94-b80c-1042e4a41132', '2026-06-01', '2026-06-15T21:22:34.715964+00:00', NULL, NULL, NULL, '7dc21019-5042-4714-befb-6fcf369e523e', NULL, NULL, 'aberta', '2026-06-17T19:10:19.216787+00:00', 360, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '108ab074-3199-4d99-b57b-4a3a56222084', '2026-06-01', '2026-06-15T21:22:02.778949+00:00', NULL, NULL, NULL, '29b1b6c6-6411-4f35-9d11-bfea7147585c', NULL, NULL, 'aberta', '2026-06-17T11:54:28.172471+00:00', 640, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '1e584f12-16da-4c4b-9148-18e569ee499a', '2026-06-01', '2026-06-15T21:22:13.116941+00:00', NULL, NULL, NULL, '58b633f9-55ab-4791-876d-5472113d8a23', NULL, NULL, 'aberta', '2026-06-15T21:23:30.646099+00:00', 380, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '08ca0c11-2b14-425a-a65c-652c291e28f5', '2026-06-01', '2026-06-15T21:22:13.952916+00:00', NULL, NULL, NULL, '264e57bf-1763-4837-839b-ff379aaca6fc', NULL, NULL, 'aberta', '2026-06-15T21:23:31.190994+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '4a7a5e20-54ef-434a-af46-e33c7a38a5c1', '2026-06-01', '2026-06-12T12:55:56.742498+00:00', NULL, NULL, NULL, '0be5987c-a64a-4631-95ee-c66d3d5aef20', NULL, NULL, 'aberta', '2026-06-12T12:55:57.459332+00:00', 100, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '6975d511-9f1f-4232-9d19-8b3733f0bc35', '2026-06-01', '2026-06-15T21:22:14.771962+00:00', NULL, NULL, NULL, 'f021ef83-1f74-40b8-a49f-3946fb9be34a', NULL, NULL, 'aberta', '2026-06-15T21:23:31.752086+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'e97e3b3f-83fc-48c9-bfeb-2515b88344ed', '2026-06-01', '2026-06-12T12:56:10.175566+00:00', NULL, NULL, NULL, '6bc0b2d4-4d13-42ab-9136-701aa0462f6a', NULL, NULL, 'aberta', '2026-06-12T12:56:10.86763+00:00', 100, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'e9a0e882-99f6-4181-8738-36c811e1276e', '2026-06-01', '2026-06-11T12:09:33.898534+00:00', NULL, NULL, NULL, '5c6951c1-1297-4beb-ae27-369c89fee23c', NULL, NULL, 'aberta', '2026-06-16T21:16:30.549624+00:00', 520, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '6693ea32-c18e-4f13-ad1b-4995bea2a2cd', '2026-06-01', '2026-06-15T21:22:18.043455+00:00', NULL, NULL, NULL, '9122edca-9c63-4e87-ad84-0c2366fbb9a3', NULL, NULL, 'aberta', '2026-06-15T21:23:32.851829+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'b32566ac-bdac-4cc9-8d03-ece65f488f60', '2026-06-01', '2026-06-15T21:22:19.402643+00:00', NULL, NULL, NULL, 'e464043b-c13a-45c9-be59-44482286ad00', NULL, NULL, 'aberta', '2026-06-15T21:23:33.935877+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'cf99953f-86d9-43bd-b17e-39d873039636', '2026-06-01', '2026-06-17T11:41:26.576281+00:00', NULL, NULL, NULL, '26c3a868-2202-4704-bebe-43ad9ce30b43', NULL, NULL, 'aberta', '2026-06-17T19:11:38.796452+00:00', 0, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'bc2ee1ec-6324-4c96-a0a0-ea2d2bad0ce9', '2026-06-01', '2026-06-12T12:56:27.150773+00:00', NULL, NULL, NULL, 'de37e8b3-fb6a-4b28-bea6-e8558d5c3574', NULL, NULL, 'aberta', '2026-06-12T12:56:27.953844+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'baf7c874-a062-4e58-8050-3d9263cddbf9', '2026-06-01', '2026-06-15T21:21:57.406202+00:00', NULL, NULL, NULL, '0b5da9b5-b99d-4ee3-b10d-b21af17f4602', NULL, NULL, 'aberta', '2026-06-16T17:19:21.375544+00:00', 780, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'e10be2af-63ec-4239-a250-414070c6fc1b', '2026-06-01', '2026-06-15T21:23:02.369671+00:00', NULL, NULL, NULL, 'e8eb86d3-be72-4b84-8b88-d9a9780a2f52', NULL, NULL, 'aberta', '2026-06-15T21:23:46.453489+00:00', 130, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '6d8a2a36-1156-4f79-9952-ee7181b01837', '2026-06-01', '2026-06-15T21:22:28.34015+00:00', NULL, NULL, NULL, '8dc6275a-c72a-4f36-a7af-320d78b58889', NULL, NULL, 'aberta', '2026-06-15T21:23:36.698706+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '754c7506-5c98-492a-8bf9-4f81b0e1554d', '2026-06-01', '2026-06-15T21:22:29.984394+00:00', NULL, NULL, NULL, '2b2870c1-0a25-4e5d-ac80-ae4b3b487dfe', NULL, NULL, 'aberta', '2026-06-15T21:23:37.256294+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '272ae597-3966-4728-a2b3-ddd8ab72bf6a', '2026-06-01', '2026-06-15T21:22:32.477852+00:00', NULL, 'pix', NULL, '7d9384aa-c51e-4ee2-9a22-d56bdbf3e973', '2026-06-12T17:00:00+00:00', NULL, 'paga', '2026-06-15T21:23:37.817142+00:00', 260, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '0b7dc40a-5289-401f-9673-a10db0937d02', '2026-06-01', '2026-06-15T19:34:04.486556+00:00', NULL, 'pix', NULL, '3f1e8167-64c6-4730-bc21-283d79a446db', '2026-06-04T12:00:00+00:00', NULL, 'paga', '2026-06-17T12:09:06.814336+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '2026-06-01', '2026-06-15T21:22:36.654473+00:00', NULL, NULL, NULL, 'f8977015-5e18-47f6-b71e-fcb9686ddcc6', NULL, NULL, 'aberta', '2026-06-17T19:11:56.895623+00:00', 1290, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '5b69f595-7208-4870-90cb-c8f76586c316', '2026-06-01', '2026-06-15T21:22:52.696523+00:00', NULL, 'pix', NULL, 'f8977015-5e18-47f6-b71e-fcb9686ddcc6', '2026-06-09T17:00:00+00:00', NULL, 'paga', '2026-06-16T17:46:27.56169+00:00', 130, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '8ed83056-38dc-452e-80b2-b164b5603559', '2026-06-01', '2026-06-15T21:22:44.421474+00:00', NULL, NULL, NULL, '3877e7d4-943e-4085-8a34-1a0f853ea2c5', NULL, NULL, 'aberta', '2026-06-15T21:23:40.596201+00:00', 170, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'c9e933cb-7198-4703-b715-bdf28abd4649', '2026-06-01', '2026-06-15T21:22:45.238087+00:00', NULL, NULL, NULL, '5093c338-eb83-4442-8a58-69584e1f02fd', NULL, NULL, 'aberta', '2026-06-15T21:23:41.478796+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'fae7107f-e936-4191-a584-a822f64b7a47', '2026-06-01', '2026-06-15T21:22:46.632796+00:00', NULL, NULL, NULL, 'eb8cf140-e130-49a6-902c-b9d785d3f722', NULL, NULL, 'aberta', '2026-06-15T21:23:41.997732+00:00', 100, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '1ec3018b-da83-4d28-9193-e25a442d4fef', '2026-06-01', '2026-06-15T21:22:47.445236+00:00', NULL, NULL, NULL, '897ac6b3-87a8-4f5c-81e4-fd8d66bdbbf4', NULL, NULL, 'aberta', '2026-06-15T21:23:42.553726+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'b5de5f0d-d865-4bf9-80dd-6209d9cf7d48', '2026-06-01', '2026-06-11T12:37:58.781001+00:00', NULL, NULL, NULL, 'c714bcf3-1641-4789-aea1-a9a5d0788d1a', NULL, NULL, 'aberta', '2026-06-15T21:23:43.140229+00:00', 360, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '154de33d-989d-4adb-9803-c6b5cbafbc93', '2026-06-01', '2026-06-15T21:22:49.367625+00:00', NULL, NULL, NULL, '5b7f59a4-c16f-402c-8e5c-5b901a4d9766', NULL, NULL, 'aberta', '2026-06-15T21:23:43.686829+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '8a99ec97-386a-477c-84fd-063bcfb2c283', '2026-06-01', '2026-06-15T21:22:50.772405+00:00', NULL, NULL, NULL, '26f9f04a-52eb-42d0-96a5-90da2cf9a806', NULL, NULL, 'aberta', '2026-06-15T21:23:44.834289+00:00', 360, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '310be018-d75d-4518-b59b-d99077261d54', '2026-06-01', '2026-06-15T21:22:12.307531+00:00', NULL, NULL, NULL, 'f98874ec-51f6-4e00-afc2-f28c9808fd97', NULL, NULL, 'aberta', '2026-06-17T11:17:58.430764+00:00', 120, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'f3ad973f-b204-4aa0-b452-3d1d8cb1f0b0', '2026-06-01', '2026-06-15T21:23:00.369522+00:00', NULL, NULL, NULL, 'bb116003-116d-4d46-ac09-eef6c08e4118', NULL, NULL, 'aberta', '2026-06-15T21:23:45.905934+00:00', 130, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '921f4797-4a78-4481-bf21-7940f19688d1', '2026-06-01', '2026-06-15T21:23:09.425151+00:00', NULL, NULL, NULL, 'f647163b-5751-44f5-b5a7-8c11c9467b89', NULL, NULL, 'aberta', '2026-06-15T21:23:47.018841+00:00', 260, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '35db611b-6171-46f5-a142-cc6753bf5933', '2026-06-01', '2026-06-15T21:23:15.981417+00:00', NULL, NULL, NULL, 'b52e2cc0-bfc9-415a-b60e-4ae1862c4d1a', NULL, NULL, 'aberta', '2026-06-15T21:23:47.577493+00:00', 0, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'df0f7247-1127-4ecf-92c2-20566da79b17', '2026-06-01', '2026-06-15T21:23:20.573598+00:00', NULL, NULL, NULL, '470cd984-65be-494a-8802-9405c16d20fc', NULL, NULL, 'aberta', '2026-06-15T21:23:48.117834+00:00', 100, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'f3d9bc68-5ef4-41c0-857e-8e7ebcac340b', '2026-06-01', '2026-06-15T19:11:45.194943+00:00', NULL, 'pix', NULL, 'bebeec32-6469-4121-8179-85757a380531', '2026-06-02T18:30:00+00:00', NULL, 'paga', '2026-06-15T21:25:19.863504+00:00', 150, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '5e2a2231-df49-4e19-b52c-e2f115c7c49d', '2026-06-01', '2026-06-15T21:22:21.413339+00:00', NULL, NULL, NULL, '278b86fa-1ac6-421e-bda5-e54143e36a5d', NULL, NULL, 'aberta', '2026-06-16T11:32:26.432911+00:00', 240, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '53e5599d-cfcc-42bc-b535-1be981d4a42e', '2026-06-01', '2026-06-15T21:21:59.113233+00:00', NULL, NULL, NULL, 'ed0658a7-9336-4f55-aa52-fe96ac778ff8', NULL, NULL, 'aberta', '2026-06-16T11:37:53.254895+00:00', 680, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'a26acf81-e0af-45c1-9baf-08a9dea358a0', '2026-06-01', '2026-06-15T21:22:08.969641+00:00', NULL, NULL, NULL, 'f623c1dc-70b2-409f-913f-c21fb7456342', NULL, NULL, 'aberta', '2026-06-17T12:32:27.103145+00:00', 360, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  'a82a98dc-7274-4b9d-9407-114e6b76599e', '2026-06-01', '2026-06-15T20:09:06.049728+00:00', NULL, 'pix', NULL, '13b82ceb-3519-4739-8e61-a4eeccf4bd73', '2026-06-02T20:30:00+00:00', NULL, 'paga', '2026-06-16T18:46:30.427022+00:00', 420, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (
  '57373410-8731-4c0c-bee3-e7512008ef61', '2026-06-01', '2026-06-15T21:22:15.605207+00:00', NULL, NULL, NULL, 'e078abc0-8159-4231-8751-a6ea01a4707e', NULL, NULL, 'aberta', '2026-06-17T17:05:44.571336+00:00', 650, NULL
) ON CONFLICT (id) DO UPDATE SET
  competencia = EXCLUDED.competencia,
  especialidade = EXCLUDED.especialidade,
  metodo = EXCLUDED.metodo,
  observacoes = EXCLUDED.observacoes,
  paciente_id = EXCLUDED.paciente_id,
  pago_em = EXCLUDED.pago_em,
  profissional_id = EXCLUDED.profissional_id,
  status = EXCLUDED.status,
  valor = EXCLUDED.valor,
  vencimento = EXCLUDED.vencimento;

-- 2. Insert fatura_itens --
INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '3e7bb75c-883b-4dc7-835f-c642de6fe38c', 'b5de5f0d-d865-4bf9-80dd-6209d9cf7d48', 'a082b96c-3c44-4a55-86d4-30082691c652', 120, 1, 120, 'Psicopedagogia - 11/06/2026 10:00', '2026-06-11T12:37:59.170513+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '65a263af-0319-4688-8605-8ebedc47aa44', 'd8f319cc-854b-4b6d-b652-98929af8387c', '5125f7d7-4f04-4736-912e-84d5e3914d89', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 16:00', '2026-06-15T19:48:40.465897+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f02b265e-1289-41f9-a723-2643f9996775', 'ff55cb5d-1e78-4785-aa11-268b3a123d0f', 'ced39acd-14eb-4ef4-8a0a-510a29631ea5', 100, 1, 100, 'Psicopedagogia - Test Sync', '2026-06-15T21:11:44.477392+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f6f25050-4834-4db7-bca5-8a13e5bd8840', '95b2fa49-e504-4a81-b310-03cc696c8952', 'b5e4bb12-9d41-404d-bc0a-bb141eb525f2', 120, 1, 120, 'Fonoaudiologia - 08/06/2026 16:00', '2026-06-15T21:22:10.091969+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4177edb9-1b01-4ae3-a610-8a1ddc0dc4f9', '1e584f12-16da-4c4b-9148-18e569ee499a', '6cb3af70-dd7f-4ec3-8de6-57468366cc1e', 130, 1, 130, 'AT ABA - 05/06/2026 17:00', '2026-06-15T21:22:13.393032+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '80b1daad-f91f-4eb7-882b-8cd830ec212c', 'e9a0e882-99f6-4181-8738-36c811e1276e', '3bb00b88-399f-494d-b7df-8aac820ffc89', 130, 1, 130, 'AT ABA - 09/06/2026 17:00', '2026-06-15T21:22:18.875058+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'd27756a4-77ec-4322-89fe-8fff4c39ef43', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '9703534e-5771-4411-bb35-80e260b78344', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 15:00', '2026-06-15T21:22:22.255171+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '7f212ffa-c39b-4f30-9e7a-a1bec83e2179', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '38904458-b690-4b07-bcd7-3f2bef5784e6', 100, 1, 100, 'Psicopedagogia - 10/06/2026 17:00', '2026-06-15T21:22:23.364569+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5fbbf191-f050-4e06-9c72-b053afaa1173', '8d063b19-e412-4b54-8748-ef71585cd521', '94bc77ab-c12d-4015-a377-30a8ea4e74bf', 100, 1, 100, 'Psicopedagogia - 11/06/2026 15:00', '2026-06-11T17:45:45.88083+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8552f68f-dbba-4180-b544-c3a37fc32de6', '4a7a5e20-54ef-434a-af46-e33c7a38a5c1', 'b43a8d3c-d0f8-4908-9b2b-7cd762028cb4', 100, 1, 100, 'Psicopedagogia - 13/06/2026 09:00', '2026-06-12T12:55:57.077079+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '08e0c261-e72c-440c-aeda-fb8afaadda57', '57373410-8731-4c0c-bee3-e7512008ef61', '2db88aa4-ef2d-4247-9cd8-5f16fdb54bb6', 0, 1, 0, 'AT ABA - 15/06/2026 14:00', '2026-06-15T21:22:24.439284+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0c9b94ee-6683-44b0-b13f-c6ccbe52871e', '2a65b28d-74ea-47a1-81ba-3aa6ec8f462c', '1b6fd160-a413-4561-a872-f34f11ce10c1', 170, 1, 170, 'Psicologia - 11/06/2026 16:00', '2026-06-15T21:22:26.670733+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'd68aa680-64aa-4aba-8feb-bdf148f73e28', 'ae81bd08-2d78-4938-a05d-0107caa64e30', 'd0d4fb0c-5695-49f9-94da-0b7d08b51bde', 120, 1, 120, 'Fonoaudiologia - 01/06/2026 16:00', '2026-06-15T21:22:27.788086+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '98618dbe-b774-4d96-8bd2-df721ce2e221', '754c7506-5c98-492a-8bf9-4f81b0e1554d', '2a3b5e97-7753-4497-bd28-db047e1c1272', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 17:00', '2026-06-15T21:22:30.263489+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e553d61b-92ee-4030-af0e-6240e6e2ac4a', '57373410-8731-4c0c-bee3-e7512008ef61', 'f410873b-bc46-4f31-ba08-2062308f92f2', 130, 1, 130, 'AT ABA - 02/06/2026 15:30', '2026-06-15T21:22:31.341513+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b4dc2a53-ba55-4f19-8570-0b307437fabf', 'c1ec8dac-09b1-46b9-a6c2-92aa57b0e586', 'daf69f3b-d645-4fc5-9ed4-28e15049be1e', 100, 1, 100, 'Psicopedagogia - 02/06/2026 16:00', '2026-06-15T21:22:33.584586+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0743edc1-8cbf-4852-8cca-b238a079bd61', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', 'bbb48c60-bc5a-4356-a17d-45873a5cb57c', 130, 1, 130, 'AT ABA - 02/06/2026 14:00', '2026-06-15T21:22:36.934725+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '9b1da183-7b39-4529-8696-3dd8cd91da6d', '53e5599d-cfcc-42bc-b535-1be981d4a42e', '146e6f75-dd35-4003-8c6e-4149474717fb', 170, 1, 170, 'Psicologia - 09/06/2026 08:30', '2026-06-15T21:22:38.064837+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '21a93dcb-c898-4f02-aa4a-ab12a90ef6b9', '08ca0c11-2b14-425a-a65c-652c291e28f5', 'bf4c77d5-784a-489d-af47-270af13a9ec0', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 10:00', '2026-06-15T21:22:39.128486+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5424904d-22bf-4699-ae2c-bbb0f81d5565', 'baf7c874-a062-4e58-8050-3d9263cddbf9', '90ac9505-1aa4-4ee1-aca4-635298d3b5f3', 130, 1, 130, 'AT ABA - 02/06/2026 14:00', '2026-06-15T21:22:40.217895+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'de9de668-5c5e-4c52-9aad-1262d711f298', '8ed83056-38dc-452e-80b2-b164b5603559', '88cb1d24-07f4-4abe-b357-695b30f33598', 170, 1, 170, 'Psicologia - 03/06/2026 16:00', '2026-06-15T21:22:44.697373+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '67999008-257e-4784-9f1e-a73990a685b5', 'fae7107f-e936-4191-a584-a822f64b7a47', '12cc6add-ce1f-4282-976f-260336da4925', 100, 1, 100, 'Psicopedagogia - 04/06/2026 08:00', '2026-06-15T21:22:46.91224+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '9b2ae7f8-0e38-4fc3-8d45-253c713e458f', 'f3b08623-f0be-46eb-932c-2a8519f13082', 'c7927199-ce81-4a59-a032-92201c9c7f0b', 120, 1, 120, 'Psicopedagogia - 04/06/2026 16:00', '2026-06-15T21:22:50.218003+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '02817343-a38f-48ab-aa3b-679dfbcdec98', 'b32566ac-bdac-4cc9-8d03-ece65f488f60', 'd0da4201-a9e4-4b40-a2c1-6a1b9eab56d3', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 09:30', '2026-06-15T21:22:53.611581+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0a4657f2-1139-43cf-8b6e-6514dbdb2d4b', 'ee3fff60-e179-4104-abe5-527c4849b6db', '7c802e79-8f33-4306-80b5-c5d69f400cd1', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 11:30', '2026-06-15T21:22:54.700492+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'ebcff5ba-9cf9-4562-ba41-f28e48ee159b', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'fd9219bd-2938-4363-922d-a5d41ccfa526', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 15:00', '2026-06-15T21:22:55.77882+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '98c22989-088c-4b01-987d-42c0b5eb5bf2', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '96662c12-cc2d-4a07-af20-a6ab611971f6', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 17:00', '2026-06-15T21:22:57.223734+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '82425cb7-4b90-45da-8872-5479768da69e', '310be018-d75d-4518-b59b-d99077261d54', 'e5bdfc2f-300e-4c01-9558-0f3d9220e0d2', 0, 1, 0, 'Apoio - 11/06/2026 08:00', '2026-06-15T21:22:59.805825+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '022633c4-72d6-4a32-9ed3-77f14505c019', '310be018-d75d-4518-b59b-d99077261d54', 'fbebe1bb-846f-4a9f-bb5f-d576c2971e7f', 0, 1, 0, 'Apoio - 10/06/2026 08:00', '2026-06-15T21:23:03.232914+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '670dbf5b-bcd1-4f00-bcd9-2847b66561a8', '310be018-d75d-4518-b59b-d99077261d54', '1a9f1802-ceb6-489b-ae30-b4f41e85d870', 0, 1, 0, 'Apoio - 12/06/2026 08:00', '2026-06-15T21:23:04.316319+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'bb484f16-0793-4885-93cd-c1752b8f1f66', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', '92c878ea-92f9-425f-8761-b1bec0ade994', 0, 1, 0, 'Apoio - 11/06/2026 09:00', '2026-06-15T21:23:05.409915+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e5197bef-0c81-49c9-881e-7b88024c3014', '763f4cfa-93f1-4d18-875b-49511ae2d1c0', '104395ec-1b97-4ce4-9a21-72c900c4552d', 130, 1, 130, 'AT ABA - 11/06/2026 14:00', '2026-06-15T21:23:06.527279+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c3b13c88-7944-4eae-9d9a-212208e55251', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'f543d94d-e976-4b58-8e11-1da6eb54f9ed', 0, 1, 0, 'Apoio - 11/06/2026 16:00', '2026-06-15T21:23:07.647318+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f065263c-e1b3-4452-ba09-d07442a9c5da', '35db611b-6171-46f5-a142-cc6753bf5933', '6b95b16c-c52a-491a-a01c-c6464f5a0758', 0, 1, 0, 'AT ABA - 08/06/2026 17:00', '2026-06-15T21:23:16.243692+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8d99d9e6-9bf8-4701-9cac-6127d078448f', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'cbe40ee6-4faa-43b8-b4c5-1adb14422e63', 0, 1, 0, 'Apoio - 09/06/2026 16:00', '2026-06-15T21:23:17.330673+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4b8c98d0-7a5e-45e6-8a1c-034a6424dc44', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'bfa14cd5-e759-4c60-b1c6-db32eb07bb5f', 0, 1, 0, 'Apoio - 10/06/2026 16:00', '2026-06-15T21:23:18.39167+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '62c09033-d47a-4a79-8cbf-838d7d08fe64', '2a09b278-dd0d-4d61-aa94-082dd01c9585', '77b7e35c-8631-4166-8974-369f1d5958a1', 0, 1, 0, 'Apoio - 08/06/2026 17:00', '2026-06-15T21:23:19.460339+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '70a76137-6cdf-4c1f-83e0-f993623f0fe3', 'baf7c874-a062-4e58-8050-3d9263cddbf9', '46e50651-8e0b-4e3f-848b-a43bd57811a4', 130, 1, 130, 'AT ABA - 16/06/2026 14:00', '2026-06-16T17:19:21.040947+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '70f73c7c-a467-4c71-8b2a-cd1b124f83b6', '8d063b19-e412-4b54-8748-ef71585cd521', '18c53fcd-c0e8-4d42-866d-675446de82e9', 170, 1, 170, 'Psicologia - 10/06/2026 14:00', '2026-06-10T11:27:03.472331+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '3bd0161b-20d1-4b32-acc1-1fab7d0962ec', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '35ab95f6-3624-4e24-837c-831823fb6596', 130, 1, 130, 'AT ABA - 10/06/2026 14:00', '2026-06-15T21:22:58.383303+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '6db3ff61-5d8d-45f4-a110-fc2039c92cde', 'c1ec8dac-09b1-46b9-a6c2-92aa57b0e586', '6462d2f5-2046-4d11-bc97-90d6c0a459fc', 100, 1, 100, 'Psicopedagogia - 16/06/2026 16:00', '2026-06-16T19:16:15.429372+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f14e372d-9b69-4600-8fbb-e7980775a561', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', 'c9f0dd95-2b2f-4ea8-b923-59f24d4ac5ab', 0, 1, 0, 'Apoio - 01/06/2026 09:00', '2026-06-17T11:36:31.982569+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'a73f5abc-8724-4844-a578-7f7920423568', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '5e3d8b09-6143-4fa8-b250-37baafa43967', 0, 1, 0, 'Apoio - 03/06/2026 15:00', '2026-06-17T11:40:03.545604+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '44d872f4-631b-4b60-b3db-27f4bdd0aefb', '0b7dc40a-5289-401f-9673-a10db0937d02', 'f9fc2353-368c-4477-9024-092991bef7c4', 120, 1, 120, 'Fonoaudiologia - 17/06/2026 09:00', '2026-06-17T12:09:06.46225+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '23c8b5ca-8eb7-4aab-8bf9-251c34ed0fc0', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '1f97801a-9815-4569-92bf-1f65cfcd7cd7', 130, 1, 130, 'AT ABA - 05/06/2026 14:00', '2026-06-17T18:39:23.270634+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '04f220e9-6172-4123-a382-02029783e163', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '2def2c4b-8e0f-43e8-8115-d8d61b5bd8ef', 130, 1, 130, 'AT ABA - 12/06/2026 17:00', '2026-06-11T11:48:05.899774+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '99450dac-5fce-4d41-9a89-a748cd3f4523', '6d072a28-dcc4-494d-8a2a-a389e28c9da2', '3c069808-8e59-4d8d-8561-6f574034a524', 120, 1, 120, 'Fonoaudiologia - 08/06/2026 14:00', '2026-06-15T19:50:11.401539+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5ddc7fa6-6c73-4fa7-9b26-b7af16e6185c', 'baf7c874-a062-4e58-8050-3d9263cddbf9', '0a5402e4-2465-4f68-8782-65d76db2aa8f', 130, 1, 130, 'AT ABA - 09/06/2026 14:00', '2026-06-15T21:21:57.688557+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '073cf606-7ac7-41b0-909c-4bff428f26a0', '470ca84a-56d7-4a8b-8591-59db1b7284d1', '7009880c-f4af-4a5d-a60f-f92d61def811', 130, 1, 130, 'AT ABA - 08/06/2026 14:00', '2026-06-15T21:22:02.218869+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'dc7231c5-bc0a-4bf7-a86d-9ee8fe4309b6', '2a09b278-dd0d-4d61-aa94-082dd01c9585', '74e95376-e329-4c9a-a8c6-45ec734c0f4d', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 09:00', '2026-06-15T21:22:10.910364+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '2e2339fa-f069-482c-9816-a84340b92d2c', '08ca0c11-2b14-425a-a65c-652c291e28f5', 'a48e8f95-4bd4-4013-ac05-1a8fcf338046', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 10:00', '2026-06-15T21:22:14.212736+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '1cc5fb51-ce5f-4adf-a741-5d0e16bcf877', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', '540d6d66-0bfa-43e7-961d-817c038be436', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 08:00', '2026-06-15T21:22:16.43239+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '34342b03-24e0-41d7-98c6-fcc3317dc69a', 'ee3fff60-e179-4104-abe5-527c4849b6db', '3e19914c-f2fe-40e8-97cc-eb79396c6aaa', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 11:00', '2026-06-15T21:22:17.505652+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'd2ce3ae0-d562-48fa-a19a-0680c7ae8925', 'b32566ac-bdac-4cc9-8d03-ece65f488f60', 'de30b748-f8c4-4b37-baab-a7f842ce0a0a', 120, 1, 120, 'Fonoaudiologia - 10/06/2026 10:00', '2026-06-15T21:22:19.698446+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5f5d0d09-95e6-4158-bacb-f582c47be67e', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'ea72c7e0-504f-4d8a-bcf7-fcb569f3f59b', 130, 1, 130, 'AT ABA - 09/06/2026 17:00', '2026-06-15T21:22:20.822391+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '813f5257-383a-4305-b371-c34237e7f874', 'e97e3b3f-83fc-48c9-bfeb-2515b88344ed', '53091a27-e42c-40ea-9f33-3e3f83ec6eab', 100, 1, 100, 'Psicopedagogia - 13/06/2026 10:00', '2026-06-12T12:56:10.47263+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '2845d19b-3742-4419-b5d7-41197995b81c', 'bc2ee1ec-6324-4c96-a0a0-ea2d2bad0ce9', 'bc05b0d4-6e5b-4859-b2ed-52336f693bdf', 120, 1, 120, 'Psicopedagogia - 13/06/2026 14:00', '2026-06-12T12:56:27.455122+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '1d572949-1e42-41ea-878a-a35d8b6868ae', '6d8a2a36-1156-4f79-9952-ee7181b01837', 'b5f835d2-eccc-4206-9fd2-3e58c9585dd6', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 18:00', '2026-06-15T21:22:28.916988+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'd4c11752-b3ad-48b4-bd81-81afc1282b29', '8e6063b9-a424-4f94-b80c-1042e4a41132', '1f45e189-ec52-4771-9d92-5734abe7b2ab', 120, 1, 120, 'Psicopedagogia - 10/06/2026 16:00', '2026-06-15T21:22:35.552585+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '10567494-6146-424d-9ad2-56224913aa02', '8361d629-f5e9-4e2f-9a68-d353434ef21c', '11092bff-56b5-4ebb-9819-61140c0ba838', 130, 1, 130, 'AT ABA - 03/06/2026 09:30', '2026-06-15T21:22:42.247532+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'a1c0a9fa-36ae-47a2-a9bc-2c2ccfb4ea55', 'baf7c874-a062-4e58-8050-3d9263cddbf9', 'd3549fbd-183a-4aac-99ae-0375d45571e8', 130, 1, 130, 'AT ABA - 03/06/2026 15:00', '2026-06-15T21:22:43.312487+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '06a9e8f2-a869-43f9-990f-18a8ef8e379f', 'c9e933cb-7198-4703-b715-bdf28abd4649', '5cad2073-99c0-4eb4-adac-eb772279caa3', 120, 1, 120, 'Psicopedagogia - 03/06/2026 18:00', '2026-06-15T21:22:45.53276+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8334ebd7-838c-416b-a166-90831c6d40a9', '1ec3018b-da83-4d28-9193-e25a442d4fef', '458be8a0-2036-485b-a2a3-7f3b4ee8cb90', 120, 1, 120, 'Psicopedagogia - 04/06/2026 09:00', '2026-06-15T21:22:47.734387+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '603940b2-45d1-4c83-9047-639cd14004b1', 'b5de5f0d-d865-4bf9-80dd-6209d9cf7d48', '0e48c3f4-cf7a-4a38-a14f-189e88b24a89', 120, 1, 120, 'Psicopedagogia - 04/06/2026 10:00', '2026-06-15T21:22:48.823007+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'd9da033f-f54c-4f8e-a88e-316be6b0eac2', '8a99ec97-386a-477c-84fd-063bcfb2c283', '28593fca-698c-4560-8aab-e152c9d46532', 120, 1, 120, 'Psicopedagogia - 03/06/2026 18:00', '2026-06-15T21:22:51.044638+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5621d5a7-31af-4a30-afd7-28831a608352', 'c286a3a7-80ae-4529-9f3b-6b49f55faea8', '9484177d-a360-47a4-be64-f94e223a6c0d', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 08:30', '2026-06-15T21:22:52.116493+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '60ff28e1-355c-41f8-bcd0-cd0929962ca6', 'f3ad973f-b204-4aa0-b452-3d1d8cb1f0b0', 'ce4013da-2fdd-47c2-9560-816377ae3f5b', 130, 1, 130, 'Apoio - 15/06/2026 09:00', '2026-06-15T21:23:00.651965+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'bfc841cd-ac9a-4c2a-96c6-df03f1a2481d', '5e2a2231-df49-4e19-b52c-e2f115c7c49d', '2d64008a-faa2-4cb7-8da7-b4c6b5c7b69c', 120, 1, 120, 'Fonoaudiologia - 19/06/2026 14:00', '2026-06-16T11:32:26.097653+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '06fc921a-5799-4ab1-b413-15714a41ad35', '763f4cfa-93f1-4d18-875b-49511ae2d1c0', 'ebdf46ca-7172-473b-ab76-4b5edb6f22e6', 130, 1, 130, 'AT ABA - 16/06/2026 14:00', '2026-06-16T17:19:51.594072+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '52d7bb6b-2467-4657-afa0-2857567cac56', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '9db11854-9b2f-4853-a6df-e0e8c2c2909e', 130, 1, 130, 'AT ABA - 16/06/2026 14:00', '2026-06-16T17:20:17.080011+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f605f26a-82a8-4d10-974e-3596aebddf99', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '41dd5eae-1f21-4e0e-ad24-731b075e05e7', 130, 1, 130, 'AT ABA - 11/06/2026 14:00', '2026-06-15T21:23:01.755361+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '771a3e81-b63d-485c-ae21-47a9462f9215', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', '04cd1de8-100f-4ac1-9f23-7ec2227c450c', 0, 1, 0, 'Apoio - 02/06/2026 09:00', '2026-06-17T11:36:57.9897+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '70380327-7620-4830-acd0-6ce763e41bdf', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '9ebace93-1f4e-4a40-82a5-f6cc8acff275', 0, 1, 0, 'Apoio - 05/06/2026 15:00', '2026-06-17T11:40:38.664059+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c096d51b-fc57-43e2-a6db-bb67b5ce819a', 'cf99953f-86d9-43bd-b17e-39d873039636', '7d5e41c5-bfe9-4a64-bf16-b7183f956377', 0, 1, 0, 'Apoio - 10/06/2026 16:00', '2026-06-17T11:42:07.448051+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b41a4942-e5fb-401e-b681-520b2576a507', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', 'ba80e0e5-6c1e-4130-bbad-da07bab09c62', 0, 1, 0, 'Apoio - 17/06/2026 09:00', '2026-06-17T12:32:26.735452+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '62ff1c43-39a3-4de9-95ca-7efaed8ce79f', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'c81a7ccd-53f5-4f04-9d69-9158c98783a7', 0, 1, 0, 'Apoio - 17/06/2026 16:00', '2026-06-17T18:56:47.784315+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '2d23d040-3622-470d-8daf-d4d41cfdcd47', 'ff55cb5d-1e78-4785-aa11-268b3a123d0f', 'cec84b8e-725c-41aa-9523-5f5ce8dd4e7e', 100, 1, 100, 'Psicopedagogia - 08/06/2026 18:00', '2026-06-15T19:51:12.167041+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b5e3bdae-a908-4384-991b-d7cd7495a081', '5cdd38ff-3671-480d-b1d9-cc263593da57', '776441a9-225f-4353-8602-eb33a3c7e73f', 120, 1, 120, 'Psicopedagogia - 13/06/2026 15:00', '2026-06-12T12:38:34.727685+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c83808ba-98d0-49c7-b6ad-d9500f559ef2', 'f3d9bc68-5ef4-41c0-857e-8e7ebcac340b', 'f757b769-10a5-492d-a309-62a308be965f', 150, 1, 150, 'Psicologia - 02/06/2026 15:30', '2026-06-15T19:11:45.469825+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'bb3bb673-54e3-4561-92b8-70563e6d69f9', 'c286a3a7-80ae-4529-9f3b-6b49f55faea8', '3d6edc3d-2026-438a-b0c7-fdc6e9d61c04', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 08:00', '2026-06-15T21:21:58.552608+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4bbc757e-c685-45a8-b260-f9577d4d01a3', 'ee3fff60-e179-4104-abe5-527c4849b6db', 'd3831aa5-7a51-486c-b728-797e34ec937f', 130, 1, 130, 'AT ABA - 03/06/2026 15:30', '2026-06-15T21:22:00.783218+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '949fe101-e5af-4e16-b50c-dfc2634edcca', '108ab074-3199-4d99-b57b-4a3a56222084', '256e699c-45e7-49fc-a59c-9cdd2867c2bc', 120, 1, 120, 'Fonoaudiologia - 08/06/2026 09:00', '2026-06-15T21:22:03.050092+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'd4c19b71-75ce-4bec-82c4-8486a1e3a44b', 'ee3fff60-e179-4104-abe5-527c4849b6db', '048ed033-0664-48a1-948d-2a38de086552', 130, 1, 130, 'AT ABA - 08/06/2026 15:30', '2026-06-15T21:22:04.188178+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'cc5b68a2-5fab-4b9d-9897-b440e49731db', 'ee3fff60-e179-4104-abe5-527c4849b6db', '9bd44e05-59dc-47d6-a976-a7247e8a5692', 130, 1, 130, 'AT ABA - 05/06/2026 15:30', '2026-06-15T21:22:06.386419+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'eda0dc48-a780-43bd-8508-10c45716ec17', '763f4cfa-93f1-4d18-875b-49511ae2d1c0', 'bf444fc6-53d2-4cd3-a95d-6244576c47bb', 130, 1, 130, 'AT ABA - 09/06/2026 14:00', '2026-06-15T21:22:11.755056+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'dd03c39d-d60f-4da7-acb8-64b223fa39ca', '6975d511-9f1f-4232-9d19-8b3733f0bc35', 'd8836b09-fd57-413d-b87e-31ea0d2ffe93', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 10:00', '2026-06-15T21:22:15.059748+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0a2b6891-aeb6-4e1f-a76f-8a85a948c713', '6693ea32-c18e-4f13-ad1b-4995bea2a2cd', '5785fc1e-9521-4e6c-98db-65038f570866', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 15:00', '2026-06-15T21:22:18.312604+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8ee2593e-5c1c-4a9e-b87e-3dfb3e1e2919', '5e2a2231-df49-4e19-b52c-e2f115c7c49d', 'be9c6456-b57d-44a2-bf4e-29f4e297215e', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 14:00', '2026-06-15T21:22:21.702273+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '874a2402-c026-4aee-aec6-e5ff4e9c0495', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'ee418d94-2395-41d7-9ca8-3beeadc1a6c5', 100, 1, 100, 'Psicopedagogia - 03/06/2026 17:00', '2026-06-15T21:22:22.801375+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '249e7de4-fb75-49e5-9c46-0c126201fb14', '470ca84a-56d7-4a8b-8591-59db1b7284d1', 'a6b06813-a896-4da0-826d-cb66c7f3be79', 130, 1, 130, 'AT ABA - 05/06/2026 14:00', '2026-06-15T21:22:23.897866+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4f528578-68ea-4fb7-adce-09fc4223efd4', '95b2fa49-e504-4a81-b310-03cc696c8952', '68894bee-5630-43a1-b5cb-46009a982d69', 120, 1, 120, 'Fonoaudiologia - 01/06/2026 15:00', '2026-06-15T21:22:24.976763+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '29a302f1-0e93-4650-b50b-c04f47d7decc', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '512ffff6-324c-46b9-a17b-e0aa6ee75980', 130, 1, 130, 'AT ABA - 05/06/2026 17:00', '2026-06-15T21:22:27.229007+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '6c609f0c-3be9-405f-a5f7-29a964d9ae03', '763f4cfa-93f1-4d18-875b-49511ae2d1c0', 'c784ff87-b225-4e38-a5ac-aaad91844463', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 16:00', '2026-06-15T21:22:30.813071+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4634a9a0-57ad-4fb3-9aa0-b1b132dd897d', '57373410-8731-4c0c-bee3-e7512008ef61', '30a55525-5ef9-49b2-9015-12091d31482b', 130, 1, 130, 'AT ABA - 09/06/2026 15:30', '2026-06-15T21:22:31.909453+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '987fbb6a-8b44-43ff-a0ff-67798e628c04', 'c1ec8dac-09b1-46b9-a6c2-92aa57b0e586', '0489e160-63f2-4e8a-ac63-828e29a9a242', 100, 1, 100, 'Psicopedagogia - 09/06/2026 16:00', '2026-06-15T21:22:34.132689+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f8d47943-8323-43a4-b880-76ee7d5454e6', 'f3b08623-f0be-46eb-932c-2a8519f13082', 'b0365e28-b0de-4752-8535-2f7b756d7d85', 120, 1, 120, 'Psicopedagogia - 13/06/2026 09:00', '2026-06-12T13:24:13.216804+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '11df4ea4-3a42-4867-9887-4c3609b2f86f', '53e5599d-cfcc-42bc-b535-1be981d4a42e', 'c24dab06-8908-49c5-b3d6-c26cbc3f4780', 170, 1, 170, 'Psicologia - 02/06/2026 08:30', '2026-06-15T21:22:37.503154+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'ad212be3-8df9-4543-bfcb-b435ad552f50', '8361d629-f5e9-4e2f-9a68-d353434ef21c', '1888d60f-a22f-42e4-9aaf-41415630f214', 130, 1, 130, 'AT ABA - 02/06/2026 09:30', '2026-06-15T21:22:38.599892+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4f760228-c454-4219-b9bc-0f38a38211ca', '108ab074-3199-4d99-b57b-4a3a56222084', 'c6e2a528-6937-447d-8a13-a16f9c6d624d', 130, 1, 130, 'AT ABA - 12/06/2026 09:00', '2026-06-15T21:22:39.670129+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '02aee3fe-fb82-4f2f-9e4f-4caf1cd8a0c3', 'baf7c874-a062-4e58-8050-3d9263cddbf9', '3dfe1f7d-eaf6-47f3-8515-22d9d8e461ca', 130, 1, 130, 'AT ABA - 09/06/2026 14:00', '2026-06-15T21:22:40.813403+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c6cc5c1d-c1bf-4c23-b6ef-cff709103113', '154de33d-989d-4adb-9803-c6b5cbafbc93', '1496c185-a003-4030-b30d-340bfb46481a', 120, 1, 120, 'Psicopedagogia - 04/06/2026 15:00', '2026-06-15T21:22:49.671824+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '9fbf2878-f89e-4033-9260-bbe4da5f826c', '6975d511-9f1f-4232-9d19-8b3733f0bc35', '583aa04e-d434-42b9-9a62-cc6a238f8e54', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 10:30', '2026-06-15T21:22:54.167054+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b8bb2cd9-52cc-4453-953c-c622ed65a83f', '8a99ec97-386a-477c-84fd-063bcfb2c283', '847d3f69-90c7-4f27-a388-20c42c2c7542', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 14:00', '2026-06-15T21:22:55.230525+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '81addde1-263b-4826-afc9-ce7fbaece1cd', '1e584f12-16da-4c4b-9148-18e569ee499a', '985e6e8d-1f70-4299-85fb-a33a65f73239', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 16:00', '2026-06-15T21:22:56.65671+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'aea4f7d3-9ea2-4b51-bae9-a86cb4aedc8e', '5b69f595-7208-4870-90cb-c8f76586c316', '1350e31a-91d4-45c0-8819-b85712bf4c81', 130, 1, 130, 'AT ABA - 03/06/2026 14:00', '2026-06-15T21:22:57.781872+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '1054e7d3-1acf-4684-8183-0ba68799ceec', '57373410-8731-4c0c-bee3-e7512008ef61', '00a3c5fc-b3cc-4209-bfd9-62434fde4498', 0, 1, 0, 'AT ABA - 12/06/2026 14:00', '2026-06-15T21:22:59.242172+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e62b1d99-4f8b-4244-b085-cd07866cf59c', 'e10be2af-63ec-4239-a250-414070c6fc1b', 'f1d72961-054d-4234-9050-9889b95c7df3', 130, 1, 130, 'AT ABA - 11/06/2026 16:00', '2026-06-15T21:23:02.698074+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '88712b7d-fcef-4e78-92d9-38f1a8655765', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', 'b507cf66-f73b-4e31-83ae-6955e5163abe', 0, 1, 0, 'Apoio - 10/06/2026 09:00', '2026-06-15T21:23:03.790044+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '48cf3fe2-8728-40c2-ab71-d159a3c06782', '2a09b278-dd0d-4d61-aa94-082dd01c9585', '6297c29e-15b8-4d14-92a7-a20dfb971287', 0, 1, 0, 'Apoio - 15/06/2026 17:00', '2026-06-15T21:23:04.867226+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b703b5bf-eea5-4a92-93f5-7f52e51b580d', 'e9a0e882-99f6-4181-8738-36c811e1276e', 'ad3e936d-0c82-44d4-8fc4-c543158f61d5', 130, 1, 130, 'AT ABA - 10/06/2026 17:00', '2026-06-15T21:23:05.984146+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '303305f4-bb07-4343-a6ee-683d70ffedf6', '57373410-8731-4c0c-bee3-e7512008ef61', '232ae52a-f449-4316-9688-9fecf8d392c0', 130, 1, 130, 'AT ABA - 11/06/2026 15:00', '2026-06-15T21:23:07.076576+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8a0f5ad5-a78d-49a0-ad33-76dad1e607c7', '272ae597-3966-4728-a2b3-ddd8ab72bf6a', '42de25b7-35e4-46ad-99a4-7279eb6b7e93', 130, 1, 130, 'AT ABA - 10/06/2026 14:00', '2026-06-15T21:23:08.313454+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f0ae7d8a-2166-4c45-9901-d538dcd043f5', '53e5599d-cfcc-42bc-b535-1be981d4a42e', 'e061af22-3630-4ab9-9d5d-aa44a2d51f21', 170, 1, 170, 'Psicologia - 16/06/2026 08:30', '2026-06-16T11:37:52.881576+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5fbcdb0f-c8a6-46a2-bcae-1ecc0c25e36f', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', 'b63b2b65-fe99-4fe8-9f61-27a2f0ff3272', 130, 1, 130, 'AT ABA - 09/06/2026 14:00', '2026-06-15T21:22:52.976459+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'ef34de90-5f2a-4d24-be39-24bd6802ec66', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '3fd58671-6190-4c92-94f6-fc738411134c', 130, 1, 130, 'AT ABA - 12/06/2026 14:00', '2026-06-16T17:46:39.815155+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '6f5005dd-1926-4658-8743-a78f79bb1adc', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', '234ac896-6c77-4e6d-9305-e770df294f73', 0, 1, 0, 'Apoio - 03/06/2026 09:00', '2026-06-17T11:37:19.29004+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'fcb09081-ba5b-4f2b-9d3a-5857359fe195', 'cf99953f-86d9-43bd-b17e-39d873039636', '6fdffdd5-7f76-44a0-bd27-f2743da9bcdc', 0, 1, 0, 'Apoio - 03/06/2026 16:00', '2026-06-17T11:41:26.908746+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '64c6a845-7ac6-47b0-ada4-1cd3abf74352', 'cf99953f-86d9-43bd-b17e-39d873039636', 'f452d719-70e6-41ad-9e48-d1534c885c6d', 0, 1, 0, 'Apoio - 11/06/2026 16:00', '2026-06-17T11:42:30.787181+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4911420e-5a93-41bc-a1c1-c817340aaeb9', '03b3f308-5739-402b-a3be-262fd86301d5', '9499c02d-4272-4964-961f-c23774d7a395', 170, 1, 170, 'Psicologia - 17/06/2026 08:30', '2026-06-17T12:37:31.484584+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'a74a3d5e-85e8-4f4d-b7bc-88e74511dd36', '470ca84a-56d7-4a8b-8591-59db1b7284d1', '11b9e848-f149-4a14-a032-fb621db6daba', 130, 1, 130, 'AT ABA - 17/06/2026 14:00', '2026-06-16T21:16:18.493539+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '7326b753-e057-4171-829e-36af405883d5', '8e6063b9-a424-4f94-b80c-1042e4a41132', '9dc4c7d4-5aeb-4184-8c27-6d699cdbae2c', 120, 1, 120, 'Psicopedagogia - 17/06/2026 16:00', '2026-06-17T19:10:18.596598+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8403fc6d-4527-4cd3-b2ff-ae6993013866', '03b3f308-5739-402b-a3be-262fd86301d5', '3e797555-bd7d-47d4-8904-19f92050f7d5', 170, 1, 170, 'Psicologia - 02/06/2026 16:30', '2026-06-15T19:12:14.619359+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e4dcbdc7-9373-40f2-b5ff-6fcd470f905e', '7edd53ab-f8da-4710-bc0d-df9563729671', 'a3a88c4e-de40-4631-b8d9-c70daf3ab0a3', 100, 1, 100, 'Psicopedagogia - 13/06/2026 16:00', '2026-06-15T19:53:24.531762+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'fff2006b-1fbc-4f4f-8ffb-767a55a6903c', '53e5599d-cfcc-42bc-b535-1be981d4a42e', '5f6f249a-2735-466e-bec2-9cd6dd2f572a', 170, 1, 170, 'Psicologia - 09/06/2026 08:30', '2026-06-15T21:21:59.402872+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'ce20e755-e830-4caf-919e-a177088669b4', '470ca84a-56d7-4a8b-8591-59db1b7284d1', '853d25bb-504a-41d1-a590-125131048f24', 130, 1, 130, 'AT ABA - 01/06/2026 14:00', '2026-06-15T21:22:01.637673+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '66b5b629-a5c7-4774-bca2-69df06bf250d', '06778701-5dcb-4058-b143-193c6bc38e3c', '8ff28b52-8f78-489c-96b7-87d8943c4dc7', 120, 1, 120, 'Fonoaudiologia - 04/06/2026 10:00', '2026-06-15T21:22:05.017063+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '24054a26-4cff-44c2-9b53-bcec00d12c3e', 'ae81bd08-2d78-4938-a05d-0107caa64e30', 'c7bb69b8-7ed2-43ff-8df3-70a92071f694', 120, 1, 120, 'Fonoaudiologia - 08/06/2026 15:00', '2026-06-15T21:22:07.162068+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4a31ed16-ab95-420b-901b-3f3a4205a1ce', 'ee3fff60-e179-4104-abe5-527c4849b6db', '835b5d86-d734-41a6-b547-e7c7fce3d6ec', 130, 1, 130, 'AT ABA - 10/06/2026 15:00', '2026-06-15T21:23:08.903859+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4e2e2793-0751-4baf-bbfd-095519247d37', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '4742f937-0f6b-43f6-b9d0-fa1cee7afc98', 0, 1, 0, 'Apoio - 15/06/2026 16:00', '2026-06-15T21:23:16.80494+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4c750bc0-09d1-4418-9b99-2e5cb4613dcb', '57373410-8731-4c0c-bee3-e7512008ef61', 'efaaaaf9-f425-4ae4-a179-cd5f5e8ab779', 0, 1, 0, 'AT ABA - 10/06/2026 14:00', '2026-06-15T21:23:17.856085+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '3bf4ae64-054b-44bf-b153-ed4b40aae40c', '35db611b-6171-46f5-a142-cc6753bf5933', 'e3f9e5bf-d974-4c89-aab9-6c15bc3f14a5', 0, 1, 0, 'AT ABA - 10/06/2026 17:00', '2026-06-15T21:23:18.914348+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4ae27349-a7ff-4d34-9969-0cdc5180fb5c', '2a09b278-dd0d-4d61-aa94-082dd01c9585', '6fcec2b7-e32a-48c2-8e68-0d6765226d1b', 0, 1, 0, 'Apoio - 10/06/2026 17:00', '2026-06-15T21:23:20.000728+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0f6c060a-6e60-44fd-803c-a06a57ff6ebe', '108ab074-3199-4d99-b57b-4a3a56222084', 'bd853eb5-95aa-42bb-8b01-9198a9624fe2', 130, 1, 130, 'AT ABA - 16/06/2026 09:00', '2026-06-16T12:06:18.837479+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'eb7fc2de-c089-45c8-94af-d94c17ebbf82', 'a82a98dc-7274-4b9d-9407-114e6b76599e', '02942b07-b2b5-46a8-a23d-592e54b982c8', 170, 1, 170, 'Neuropsicologia - 16/06/2026 15:30', '2026-06-16T18:20:45.388626+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '52977a25-0e2d-46f8-a829-eb8de048235e', 'e9a0e882-99f6-4181-8738-36c811e1276e', '35f10e73-c34c-40ab-a048-84329a0fb63c', 130, 1, 130, 'AT ABA - 17/06/2026 17:00', '2026-06-16T21:16:29.839774+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'fc9d466e-3e4d-4ec7-87cc-aaddc3df6307', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', '2c6e0a45-0fce-430d-b248-ac1baeae0225', 0, 1, 0, 'Apoio - 05/06/2026 09:00', '2026-06-17T11:37:45.515962+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '667eacca-1c5a-41d9-84b0-5dbb32ef07a6', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '9440cc07-b188-4054-a996-52bb3e45192d', 0, 1, 0, 'Apoio - 11/06/2026 15:00', '2026-06-17T11:43:07.967221+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c8583e51-6825-40e2-8664-f6d132875dae', 'b5de5f0d-d865-4bf9-80dd-6209d9cf7d48', '49db6510-a7e0-4ca8-a93f-a2e472566d63', 120, 1, 120, 'Psicopedagogia - 13/06/2026 10:00', '2026-06-12T12:39:06.864542+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '8c1bfaa0-50b2-4816-a553-60864cba7721', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '5b374947-1184-4a26-a11c-d5766aeac01a', 0, 1, 0, 'Apoio - 16/06/2026 16:00', '2026-06-15T12:44:45.867545+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'bcae45ec-08b8-4f0e-8e16-21021b2c6c85', '79fbe2c4-5bb5-4542-95de-e39ac264ab83', '5e94dd7a-9bee-47ae-9712-1895b5754875', 150, 1, 150, 'Fonoaudiologia (Avaliação) - 17/06/2026 11:00', '2026-06-15T17:49:07.273336+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c8126ca5-c517-4614-8428-5f20843dfdc2', '57373410-8731-4c0c-bee3-e7512008ef61', '678ff5c2-9d10-4a08-a725-da96634d3b71', 0, 1, 0, 'AT ABA - 17/06/2026 14:00', '2026-06-17T17:05:44.184142+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '2b8ad653-2f78-405f-8f10-3e3c00a9102c', 'cf99953f-86d9-43bd-b17e-39d873039636', '708d50e3-02d7-4384-8542-3481d69b7b4b', 0, 1, 0, 'Apoio - 17/06/2026 16:00', '2026-06-17T19:11:38.434634+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '58eba56e-d114-47e5-9bb4-03812d1f7ff6', '0b7dc40a-5289-401f-9673-a10db0937d02', 'ffd72465-ff4a-4202-9d9c-7c9f6fedf220', 120, 1, 120, 'Fonoaudiologia - 04/06/2026 09:00', '2026-06-15T19:34:04.83003+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '55bef6eb-daff-46e3-be48-2863c186fca7', 'ee3fff60-e179-4104-abe5-527c4849b6db', 'b06f4c33-60ac-4e5f-b15a-f3bc2e4291f6', 130, 1, 130, 'AT ABA - 12/06/2026 15:30', '2026-06-11T12:06:43.128023+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '93412bf4-fbdf-47f0-8a89-bca2c99341cd', 'a82a98dc-7274-4b9d-9407-114e6b76599e', '212a49d1-11a1-4e9e-a692-a9b889608cea', 250, 1, 250, 'Neuropsicologia (Avaliação) - 02/06/2026 17:30', '2026-06-15T20:09:06.403321+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '9c450bcd-ded0-4d3e-a6e6-132472398995', '5fcd0973-8086-4976-afb3-c4602dd2634f', 'ae0d33b1-3403-4557-b374-5e0e15d36365', 120, 1, 120, 'Psicopedagogia - 13/06/2026 08:00', '2026-06-12T12:45:02.602625+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '83cf3c2a-ac07-40da-92e2-084ff4b19e17', 'a0ea4064-4a99-4712-a75f-59bc47419cfb', 'a81360c0-a789-4fb4-91f5-5789138cc7b6', 150, 1, 150, 'Fonoaudiologia (Avaliação) - 04/06/2026 08:00', '2026-06-15T21:22:00.244239+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'a0c04e1d-99ed-4a35-9ee6-5c8231511522', 'ee3fff60-e179-4104-abe5-527c4849b6db', 'af40a220-be56-4d44-96d1-a48e21ba3d57', 130, 1, 130, 'AT ABA - 01/06/2026 15:30', '2026-06-15T21:22:03.589866+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '3022872b-8c45-4c39-8331-f3f5a9b39773', '473bb866-caec-4291-ab46-2d850c884e85', 'a3189572-285b-41ae-95ca-74af484b9a69', 120, 1, 120, 'Fonoaudiologia - 09/06/2026 16:00', '2026-06-15T21:22:05.82005+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e826cdc9-c723-4274-9779-1a415c7cfcb8', '8361d629-f5e9-4e2f-9a68-d353434ef21c', 'ec07c3ab-1573-4210-874a-8c7ad7b5a927', 130, 1, 130, 'AT ABA - 09/06/2026 09:30', '2026-06-15T21:22:08.418232+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'dfd6fb3d-4662-4c47-951e-7e01251b74fe', '921f4797-4a78-4481-bf21-7940f19688d1', 'b2b62c03-5ea3-416a-9078-cfa2a0d27d56', 130, 1, 130, 'Apoio - 11/06/2026 08:00', '2026-06-15T21:23:09.68491+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '524508f0-43a5-4f50-9970-bfe7a666c1ee', '108ab074-3199-4d99-b57b-4a3a56222084', '3c2fd782-d38e-4dbb-a69c-a0c2f4904d60', 130, 1, 130, 'AT ABA - 09/06/2026 09:00', '2026-06-15T21:23:10.784981+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'ec2f2185-545e-49bf-8974-ded021ebf5c1', '08ca0c11-2b14-425a-a65c-652c291e28f5', '167c4405-a7a8-451f-bae5-4c876d2202da', 0, 1, 0, 'Apoio - 10/06/2026 17:00', '2026-06-15T21:23:12.142789+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f4a05b82-9f8a-4a11-a23b-b1af2d4f3cc1', '1e584f12-16da-4c4b-9148-18e569ee499a', 'de18d454-1e8b-4638-8951-86e454f383d9', 130, 1, 130, 'AT ABA - 12/06/2026 17:00', '2026-06-15T21:23:13.19622+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '01e99784-96ef-4974-bd7b-7c22c71e526e', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '17eb875d-32e9-4001-b3fc-ac17fcfa5033', 130, 1, 130, 'AT ABA - 11/06/2026 17:00', '2026-06-15T21:23:14.333924+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '228ee26a-6088-4e59-a100-4ebb2f69874a', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '520c5b48-220b-4257-96ad-f7ffb735f603', 0, 1, 0, 'Apoio - 08/06/2026 16:00', '2026-06-15T21:23:15.41368+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '253e6832-a918-4276-a9d7-93de43aa4da7', 'df0f7247-1127-4ecf-92c2-20566da79b17', 'cd1f3a28-c3c4-428c-a0c4-5fe557f845b4', 100, 1, 100, 'Psicopedagogia - 11/06/2026 18:00', '2026-06-15T21:23:20.842034+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0ba80c63-cd99-4f5f-95be-a0cc8ccc3e7c', '6093c2f2-fef9-4d42-9761-99299dafc0a0', '495e7d46-ea8f-462d-be85-db53eb2f1b80', 0, 1, 0, 'Apoio - 15/06/2026 16:00', '2026-06-16T12:13:46.406024+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0a2509c5-ceb6-4abc-9b82-6239e2b0e8cd', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', 'ac723fc2-9572-4db5-bafb-c988ba148c9e', 120, 1, 120, 'Fonoaudiologia - 17/06/2026 08:00', '2026-06-17T11:01:11.6777+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e6bf6f49-854b-45b0-8e04-6a944e79a2df', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', 'b929e8a7-0eed-4160-b6b0-393a790de2aa', 0, 1, 0, 'Apoio - 01/06/2026 15:00', '2026-06-17T11:39:14.412168+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '43b6827c-008f-4728-b556-64da61a2fcfe', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '65328458-6dda-4b60-803e-44ccde514538', 0, 1, 0, 'Apoio - 12/06/2026 15:00', '2026-06-17T11:43:32.857367+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '1a5d96db-3055-43d5-a579-12d3ec92e2e8', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', 'b3d05c05-bbc9-4c17-be76-9495a2ec79be', 130, 1, 130, 'AT ABA - 17/06/2026 14:00', '2026-06-17T18:30:20.841921+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '670d46ad-5ec9-488d-a39b-1bebe1f6ca97', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', 'e7936430-ddd9-4efe-aa00-f2bf491b9392', 0, 1, 0, 'Apoio - 17/06/2026 15:00', '2026-06-17T19:11:56.620535+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e0d6081f-aa12-4da9-b93d-703aad631d70', '5fcd0973-8086-4976-afb3-c4602dd2634f', 'bab59e0c-d8d4-4769-be4e-0f9713e34bcf', 120, 1, 120, 'Psicopedagogia - 06/06/2026 08:00', '2026-06-15T19:39:57.675385+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4b5b5791-6a08-45f9-8a87-5be9096468b2', '4304ae20-ea13-489a-81ad-5485f668bb08', 'c9255661-1c88-4bd0-86c5-2b3995cf53d7', 100, 1, 100, 'Psicopedagogia - 13/06/2026 08:00', '2026-06-12T12:55:44.570464+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '084b9e98-3efe-4107-97a4-1cb14eaf088f', '660c6fdb-7ed1-4631-9702-b377e2605ca2', '528226c7-a84f-4973-bf11-b259549d3029', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 18:00', '2026-06-15T20:32:45.562197+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '680b1e9e-53eb-42e4-8669-bfa464ee6c9a', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', '5d64e635-1d26-466c-944d-17d6d9044639', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 08:00', '2026-06-15T21:22:09.25782+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '56370d25-071e-4b9b-b6ae-bfc94f7c1f32', '310be018-d75d-4518-b59b-d99077261d54', '2c1c6874-1628-4c74-958a-fef7da585a3d', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 09:00', '2026-06-15T21:22:12.592839+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '2c635fae-253e-451e-9b99-f9ddd0030cab', 'e9a0e882-99f6-4181-8738-36c811e1276e', 'f4c477f5-ef48-42c8-94de-d868aa1d8972', 130, 1, 130, 'AT ABA - 11/06/2026 17:00', '2026-06-11T12:09:34.170845+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'cac3685c-6101-4979-a5df-5709ff2e9986', '57373410-8731-4c0c-bee3-e7512008ef61', '21b8d894-4f26-486c-853a-2fa765d9cc7d', 130, 1, 130, 'AT ABA - 09/06/2026 15:30', '2026-06-15T21:22:15.87823+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '6dd31b39-b8f4-4930-8bd4-f1f4c826499a', '06778701-5dcb-4058-b143-193c6bc38e3c', '92b04350-e3d1-44b2-b7d8-afb35701be6f', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 09:00', '2026-06-15T21:22:16.977642+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '21f984db-35e9-4cdf-b46d-7833cb36e205', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', 'b8d8b3a8-e9b4-475f-a7e9-816362a8ed98', 0, 1, 0, 'Apoio - 12/06/2026 16:00', '2026-06-11T13:07:39.672767+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'c44a1ccb-e0c8-4350-9664-19899c62b2be', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '38704121-c45d-45c4-bd51-c046625499f0', 130, 1, 130, 'AT ABA - 02/06/2026 17:00', '2026-06-15T21:22:20.259025+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '3d71c8c4-2bda-449f-88e8-0adf5e00f7fe', '06609b39-2c85-4afb-9614-0ce95f361e00', '8735942d-b771-4a58-8345-ccb97bbf2e1f', 120, 1, 120, 'Fonoaudiologia - 05/06/2026 17:00', '2026-06-15T21:22:25.842798+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '176890fb-b452-4c28-91a9-068d4461d9b2', 'a26acf81-e0af-45c1-9baf-08a9dea358a0', 'ad20df41-5af1-4352-be96-c8c9c4b169df', 0, 1, 0, 'Apoio - 12/06/2026 09:00', '2026-06-15T21:22:29.447655+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '70e65476-6ca0-47b6-82be-b42cedf12e23', '272ae597-3966-4728-a2b3-ddd8ab72bf6a', 'b03c4e7c-ad25-4b21-9ad7-316b58837f35', 130, 1, 130, 'AT ABA - 12/06/2026 14:00', '2026-06-15T21:22:32.78616+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '2476ad85-ed9b-4c23-96e9-a29e6978e345', '8e6063b9-a424-4f94-b80c-1042e4a41132', '2f8b7af8-848f-4262-974f-14a07e4499ed', 120, 1, 120, 'Psicopedagogia - 03/06/2026 16:00', '2026-06-15T21:22:35.007007+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b0b47b4e-7921-46c1-9481-a7a0ce85cd73', '06609b39-2c85-4afb-9614-0ce95f361e00', '9664eb5a-9eb9-4ade-a436-439b9439dab5', 100, 1, 100, 'Psicopedagogia - 05/06/2026 16:00', '2026-06-15T21:22:36.09679+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '5d4bced8-61aa-4d71-9904-e982efb97efa', 'a7b58ab2-45b6-4225-bf85-a63e3f122881', '5d57fab7-6eb0-4dea-bc5d-b5aa713fc4ab', 130, 1, 130, 'AT ABA - 16/06/2026 17:00', '2026-06-15T12:49:05.9582+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'a1f45289-580a-4d6f-9657-d162885101d0', '8361d629-f5e9-4e2f-9a68-d353434ef21c', 'c2d2d810-b2c1-46a3-bbfa-2cbbf0bfe1fb', 130, 1, 130, 'AT ABA - 10/06/2026 09:30', '2026-06-15T21:22:42.77208+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e25cd5c3-4314-4b1d-8a93-c3bfd631f253', 'baf7c874-a062-4e58-8050-3d9263cddbf9', 'de53c4fd-1a16-46e5-8d08-67b8567de8f1', 130, 1, 130, 'AT ABA - 10/06/2026 15:00', '2026-06-15T21:22:43.864833+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'de00fadf-6fd3-4003-a916-1c9838dead61', 'c9e933cb-7198-4703-b715-bdf28abd4649', '2392d655-b417-429a-b4b0-b89730a7eb8c', 120, 1, 120, 'Psicopedagogia - 10/06/2026 18:00', '2026-06-15T21:22:46.081986+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'f2faeada-34bf-4914-9e42-9effe432c978', 'ee3fff60-e179-4104-abe5-527c4849b6db', '7f4cdc53-d393-40f1-9502-8fd88ff09021', 120, 1, 120, 'Fonoaudiologia - 10/06/2026 11:00', '2026-06-15T21:22:48.284156+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '3345675a-d585-406a-8c8c-ff044300a599', '8a99ec97-386a-477c-84fd-063bcfb2c283', '11f590dc-a70e-4dd8-b937-213d7c60d878', 120, 1, 120, 'Psicopedagogia - 10/06/2026 18:00', '2026-06-15T21:22:51.599749+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0a523586-24d1-4abd-8d2f-88780a16a275', '6693ea32-c18e-4f13-ad1b-4995bea2a2cd', 'fba9bdb0-659a-4320-bb90-7b3daa84a310', 120, 1, 120, 'Fonoaudiologia - 11/06/2026 15:00', '2026-06-15T21:23:01.194026+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '0aa06240-eb2e-4981-bc68-acd11026f158', '921f4797-4a78-4481-bf21-7940f19688d1', 'fa6d47d1-631e-40e5-a271-37a39e0f6933', 130, 1, 130, 'Apoio - 09/06/2026 08:00', '2026-06-15T21:23:10.240491+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '852c0054-e52f-4720-95f9-1f1b86418813', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', 'de59c116-1fb3-46c8-9762-361d1002823d', 0, 1, 0, 'Apoio - 08/06/2026 17:00', '2026-06-15T21:23:11.317425+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '4600a178-751b-4029-9db6-c0a92e165e88', '2a09b278-dd0d-4d61-aa94-082dd01c9585', 'fe08fa8e-9b2b-4618-8aca-5dabf34553f6', 0, 1, 0, 'Apoio - 11/06/2026 16:00', '2026-06-15T21:23:12.668694+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '69c51038-dd6c-414b-9f3f-934ec532d2bc', '08ca0c11-2b14-425a-a65c-652c291e28f5', '2226ce75-b9b8-47be-8eff-d7bd5c458ce5', 0, 1, 0, 'Apoio - 12/06/2026 17:00', '2026-06-15T21:23:13.76809+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '9e2e0b83-e562-46d0-9222-1bb091b9ab57', '57373410-8731-4c0c-bee3-e7512008ef61', 'f8c00a17-d53d-4701-9a42-44079bfa625e', 0, 1, 0, 'AT ABA - 08/06/2026 14:00', '2026-06-15T21:23:14.86668+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '731af77e-84f8-4e4b-b0e0-ea9c8372cf8a', '8361d629-f5e9-4e2f-9a68-d353434ef21c', '93751c83-0ae8-4d9a-9927-c56fef65a54c', 130, 1, 130, 'AT ABA - 16/06/2026 09:30', '2026-06-16T12:21:10.782277+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b2b2ddae-3b02-4034-a82a-33982384b6a4', '57373410-8731-4c0c-bee3-e7512008ef61', '54f20635-1fbe-4f40-b856-d2c1130c2f7c', 130, 1, 130, 'AT ABA - 16/06/2026 15:30', '2026-06-16T19:13:38.576598+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'b7a015c0-10a4-4730-a153-f593a63028a0', '310be018-d75d-4518-b59b-d99077261d54', '011270cd-78b7-4db6-ac13-b62738a7825f', 0, 1, 0, 'Apoio - 17/06/2026 08:00', '2026-06-17T11:17:58.041026+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '06bf2c7e-af4c-487c-8965-095e1730770a', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '094c7590-8235-4845-af0b-d8496c6f8517', 0, 1, 0, 'Apoio - 02/06/2026 15:00', '2026-06-17T11:39:33.740675+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  '6ea5a945-754b-4607-8027-8676aeaf3fdb', '108ab074-3199-4d99-b57b-4a3a56222084', '88a151df-d2c2-41ac-b65b-05966dfab939', 130, 1, 130, 'AT ABA - 17/06/2026 09:00', '2026-06-17T11:54:27.800892+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (
  'e96acd4f-c22a-4595-8590-92cfbf90934e', 'b384cdb5-7f64-4495-a81d-1e31f3d8b104', '11016632-c450-4f19-8974-945e7e3571c3', 130, 1, 130, 'AT ABA - 04/06/2026 14:00', '2026-06-17T18:39:03.298554+00:00'
) ON CONFLICT (id) DO UPDATE SET
  fatura_id = EXCLUDED.fatura_id,
  agendamento_id = EXCLUDED.agendamento_id,
  valor_unitario = EXCLUDED.valor_unitario,
  quantidade = EXCLUDED.quantidade,
  total = EXCLUDED.total,
  descricao = EXCLUDED.descricao;

-- Re-enable USER triggers
ALTER TABLE public.faturas ENABLE TRIGGER USER;
ALTER TABLE public.fatura_itens ENABLE TRIGGER USER;

COMMIT;
