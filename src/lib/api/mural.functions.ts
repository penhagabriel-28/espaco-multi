import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createMuralMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ autor: z.string(), conteudo: z.string() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("mural_recados")
      .insert({
        autor: data.autor,
        conteudo: data.conteudo,
      });
    if (error) throw new Error("Erro ao criar mensagem: " + error.message);
    return { success: true };
  });

export const updateMuralMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), conteudo: z.string() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("mural_recados")
      .update({ conteudo: data.conteudo })
      .eq("id", data.id);
    if (error) throw new Error("Erro ao atualizar mensagem: " + error.message);
    return { success: true };
  });

export const deleteMuralMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("mural_recados")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error("Erro ao deletar mensagem: " + error.message);
    return { success: true };
  });
