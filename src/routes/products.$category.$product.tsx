import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, FileText, MessageSquare } from "lucide-react";
import { Breadcrumbs, EnquiryBand, ProductCard, RouteFrame } from "@/components/site";
import { Button } from "@/components/ui/button";
import { type Category, type Product, categories, getCategory, getProduct } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$category/$product")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    const product = getProduct(params.category, params.product);
    if (!category || !product) throw notFound();
    return { category, product };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.product.fullName} — Acoflex`
          : "Product not found — Acoflex",
      },
      {
        name: "description",
        content: loaderData?.product.overview ?? "Acoflex product information.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.product.fullName} — Acoflex` : "Acoflex product",
      },
      {
        property: "og:description",
        content: loaderData?.product.summary ?? "Acoflex product information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <RouteFrame>
      <div className="site-container section-y">
        <h1 className="h-page">Product not found</h1>
        <p className="body-copy mt-4 text-muted-foreground">
          This product is not part of the current Acoflex range.
        </p>
        <Link to="/products" className="text-link mt-8">
          Browse all products <ArrowRight />
        </Link>
      </div>
    </RouteFrame>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { category, product } = Route.useLoaderData() as { category: Category, product: Product };
  const siblings = category.products.filter((item: any) => item.slug !== product.slug);
  const otherCategories = categories.filter((item) => item.slug !== category.slug);

  return (
    <RouteFrame>
      <div className="border-b border-border bg-secondary">
        <div className="site-container py-4">
          <Breadcrumbs
            items={[
              { label: "Products", to: "/products" },
              {
                label: category.name,
                to: "/products/$category",
                params: { category: category.slug },
              },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      {/* Sibling products in this category */}
      <nav aria-label={`${category.name} products`} className="border-b border-border bg-card">
        <div className="site-container flex items-center gap-6">
          <span className="hidden shrink-0 text-sm font-semibold md:block">{category.name}</span>
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {category.products.map((item) => {
              const active = item.slug === product.slug;
              return (
                <li key={item.slug} className="shrink-0">
                  <Link
                    to="/products/$category/$product"
                    params={{ category: category.slug, product: item.slug }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[0.9375rem]",
                      active
                        ? "border-gold font-semibold text-foreground"
                        : "border-transparent text-muted-foreground hover:text-primary",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Summary */}
      <section className="site-container grid gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <figure>
          <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
            <img src={product.image} alt={product.imageAlt} className="photo" />
          </div>
          <figcaption className="mt-2.5 text-xs text-muted-foreground">
            {product.imageType === "manufacturing"
              ? "Manufacturing image from the Acoflex plant. Product photography to follow."
              : "Representative image of this product type. Acoflex product photography to follow."}
          </figcaption>
        </figure>

        <div className="lg:py-4">
          <p className="kicker">{product.system}</p>
          <h1 className="h-page mt-4">{product.fullName}</h1>
          <p className="lede mt-4 text-muted-foreground">{product.summary}</p>

          <dl className="mt-8 divide-y divide-border rounded-md border border-border bg-card text-[0.9375rem]">
            {[
              { label: "Category", value: category.name },
              ...product.facts,
              { label: "Technical data", value: "Available on request" },
            ].map((fact) => (
              <div key={fact.label} className="grid grid-cols-[8.5rem_1fr] gap-4 px-5 py-3">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="forest" size="lg">
              <Link to="/contact" search={{ product: product.fullName }}>
                <MessageSquare /> Enquire about this product
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-forest/30 font-semibold text-forest hover:bg-secondary hover:text-forest"
            >
              <Link to="/contact" search={{ product: `${product.fullName} — technical data` }}>
                <FileText /> Request technical data
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Overview and applications */}
      <section className="border-t border-border bg-secondary">
        <div className="site-container grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-6">
            <h2 className="h-sub">Product overview</h2>
            <p className="body-copy mt-4 text-muted-foreground">{product.overview}</p>
            <h3 className="h-card mt-8">Key features</h3>
            <ul className="mt-4 space-y-3">
              {product.highlights.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.9375rem]">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10">
                    <Check className="size-3.5 text-primary" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <h2 className="h-sub">Applications</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {product.applications.map((application) => (
                <li
                  key={application}
                  className="rounded-md border border-border bg-card px-4 py-3.5 text-[0.9375rem] font-medium"
                >
                  <span className="mb-2 block h-0.5 w-5 bg-gold" />
                  {application}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Product range */}
      <section className="site-container py-14 lg:py-20">
        <div className="border-b border-border pb-5">
          <h2 className="h-section">Product range</h2>
          <p className="body-copy mt-2 text-muted-foreground">{product.system}</p>
        </div>

        {product.range && product.range.length > 0 ? (
          <div className="mt-10 space-y-12">
            {product.range.map((group) => (
              <div key={group.title}>
                <h3 className="h-sub">{group.title}</h3>
                {group.note && (
                  <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">{group.note}</p>
                )}
                <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="overflow-hidden rounded-md border border-border bg-card"
                    >
                      {item.image && (
                        <div className="aspect-square bg-white p-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="size-full object-contain"
                          />
                        </div>
                      )}
                      <p className="border-t-2 border-gold px-4 py-3 text-[0.9375rem] font-semibold">
                        {item.name}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-8 rounded-md border border-border p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex gap-5">
              <span className="hidden size-12 shrink-0 place-items-center rounded-md bg-gold-soft text-forest sm:grid">
                <FileText className="size-6" />
              </span>
              <div>
                <h3 className="h-sub">Sizes, fittings and specifications</h3>
                <p className="body-copy mt-3 text-muted-foreground">
                  The detailed {product.fullName} range — sizes, lengths, pressure classes, matching
                  fittings and applicable standards — is shared on request while the catalogue and
                  data sheets are prepared for publication.
                </p>
              </div>
            </div>
            <Button asChild variant="gold" size="lg">
              <Link to="/contact" search={{ product: `${product.fullName} — technical data` }}>
                Request range details <ArrowRight />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Related */}
      {siblings.length > 0 && (
        <section className="site-container pb-16 lg:pb-20">
          <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
            <h2 className="h-section">More in {category.name}</h2>
            <Link
              to="/products/$category"
              params={{ category: category.slug }}
              className="text-link hidden shrink-0 sm:inline-flex"
            >
              View all <ArrowRight />
            </Link>
          </div>
          <div className="mt-8 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((item) => (
              <ProductCard key={item.slug} product={item} category={category} />
            ))}
          </div>
        </section>
      )}

      <section className="site-container pb-16 lg:pb-24">
        <h2 className="h-sub">Other product categories</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {otherCategories.map((item) => (
            <Link
              key={item.slug}
              to="/products/$category"
              params={{ category: item.slug }}
              className="group flex items-center justify-between rounded-md border border-border bg-card px-5 py-4 font-medium hover:border-primary"
            >
              <span>
                {item.name}
                {item.comingSoon && (
                  <span className="ml-2 text-xs text-muted-foreground">Coming soon</span>
                )}
              </span>
              <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <EnquiryBand />
    </RouteFrame>
  );
}
