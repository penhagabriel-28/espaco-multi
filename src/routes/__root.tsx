import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Router error:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="text-sm text-muted-foreground">
          Algo deu errado ao processar a página.
        </p>
        {error?.message && (
          <div className="text-left bg-muted/70 p-3 rounded-lg border border-border text-xs font-mono text-destructive break-words max-h-40 overflow-auto">
            {error.message}
          </div>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a href="/pacientes" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
            Voltar a Pacientes
          </a>
          <a href="/dashboard" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Espaço Multi — Sistema de Agendamento" },
      {
        name: "description",
        content:
          "Sistema de agendamento para clínicas infantis especializadas em crianças neurodivergentes.",
      },
      { property: "og:title", content: "Espaço Multi — Sistema de Agendamento" },
      { name: "twitter:title", content: "Espaço Multi — Sistema de Agendamento" },
      {
        property: "og:description",
        content:
          "Sistema de agendamento para clínicas infantis especializadas em crianças neurodivergentes.",
      },
      {
        name: "twitter:description",
        content:
          "Sistema de agendamento para clínicas infantis especializadas em crianças neurodivergentes.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/nMdj4W20UNO8FGFZoy3nF7xJd572/social-images/social-1780087028450-capa_2026.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/nMdj4W20UNO8FGFZoy3nF7xJd572/social-images/social-1780087028450-capa_2026.webp",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      {
        name: "description",
        content: "Espaço Multi displays a preview of your GitHub repository.",
      },
      {
        property: "og:description",
        content: "Espaço Multi displays a preview of your GitHub repository.",
      },
      {
        name: "twitter:description",
        content: "Espaço Multi displays a preview of your GitHub repository.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/G7SKzAnWG7T78hTWrTtj8nnXpF53/social-images/social-1780583190067-CAPA_NOVA.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/G7SKzAnWG7T78hTWrTtj8nnXpF53/social-images/social-1780583190067-CAPA_NOVA.webp",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/logo-icon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
