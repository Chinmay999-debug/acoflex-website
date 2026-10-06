import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { RouteFrame } from "../components/site";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-4 text-white">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-gold">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-white/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-md bg-gold px-5 text-sm font-semibold text-forest-deep"
          >
            Go home
          </Link>
          <Link
            to="/products"
            className="inline-flex h-11 items-center rounded-md border border-white/30 px-5 text-sm font-semibold"
          >
            View products
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
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
      { title: "Acoflex — Pipe systems" },
      {
        name: "description",
        content:
          "Plumbing, drainage and agriculture pipe systems manufactured by Acoflex in Ambala, Haryana.",
      },
      { name: "author", content: "Acoflex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    // Stylesheet, favicon and fonts are linked from index.html so they load before the JS bundle.
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* SPA build: no <html> shell (rendering one inside #root freezes React's event dispatch). */}
      <HeadContent />
      <RouteFrame>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </RouteFrame>
    </QueryClientProvider>
  );
}
