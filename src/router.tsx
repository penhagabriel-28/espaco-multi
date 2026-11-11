import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 15, // 15 seconds fresh
        gcTime: 1000 * 60 * 30, // 30 minutes in cache
        refetchOnWindowFocus: true, // Sincroniza automaticamente ao alternar abas ou desbloquear tela
        refetchOnReconnect: true, // Sincroniza ao recuperar conexão de rede
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 1000 * 60 * 5,
  });

  return router;
};

