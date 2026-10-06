import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { EnquiryBand, PageHero, ProductCard, TankMark } from "@/components/site";
import { Button } from "@/components/ui/button";
import { type Category, categories, getCategory } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$category/")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    return category;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — Acoflex` : "Category not found — Acoflex" },
      { name: "description", content: loaderData?.description ?? "Acoflex product category." },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.name} — Acoflex` : "Acoflex products",
      },
      { property: "og:description", content: loaderData?.summary ?? "Acoflex product category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <>
      <div className="site-container section-y">
        <h1 className="h-page">Category not found</h1>
        <p className="body-copy mt-4 text-muted-foreground">
          The category you are looking for does not exist.
        </p>
        <Link to="/products" className="text-link mt-8">
          Browse all products <ArrowRight />
        </Link>
      </div>
    </>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const category = Route.useLoaderData() as Category;
  return (
    <>
      <PageHero
        title={category.name}
        intro={category.description}
        crumbs={[{ label: "Products", to: "/products" }, { label: category.name }]}
        image={category.banner}
      />

      <div className="site-container section-y grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-36 lg:self-start">
          <p className="text-sm font-semibold">Product categories</p>
          <ul className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-border lg:pb-0">
            {categories.map((item) => {
              const active = item.slug === category.slug;
              return (
                <li key={item.slug} className="shrink-0">
                  <Link
                    to="/products/$category"
                    params={{ category: item.slug }}
                    className={cn(
                      "block whitespace-nowrap rounded-sm border px-3.5 py-2 text-[0.9375rem] lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:px-4 lg:py-2.5",
                      active
                        ? "border-primary bg-primary text-white lg:border-gold lg:bg-transparent lg:font-semibold lg:text-foreground"
                        : "border-border text-muted-foreground hover:text-primary lg:border-transparent",
                    )}
                  >
                    {item.name}
                    <span className="ml-1.5 text-xs opacity-60">
                      {item.comingSoon ? "Soon" : item.products.length}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <div>
          {category.comingSoon ? (
            <div className="grid items-center gap-10 rounded-md bg-forest p-8 text-white sm:p-12 md:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-block rounded-sm bg-gold px-2.5 py-1 text-xs font-semibold text-forest-deep">
                  Coming soon
                </span>
                <h2 className="h-section mt-5 text-white">A new storage range is on the way</h2>
                <p className="body-copy mt-4 text-white/70">{category.description}</p>
                <Button asChild variant="gold" size="lg" className="mt-8">
                  <Link to="/contact" search={{ product: category.name }}>
                    Register interest <ArrowRight />
                  </Link>
                </Button>
              </div>
              <TankMark className="mx-auto size-40 text-white/25 md:size-48" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {category.products.length}{" "}
                {category.products.length === 1 ? "product" : "products"}
              </p>
              <div className="mt-5 grid auto-rows-fr gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {category.products.map((product) => (
                  <ProductCard key={product.slug} product={product} category={category} />
                ))}
              </div>
              <div className="mt-14 rounded-md border border-border bg-secondary p-7 sm:p-9">
                <h2 className="h-sub">Working on a project?</h2>
                <ul className="mt-5 grid gap-3 text-[0.9375rem] sm:grid-cols-3">
                  {[
                    "Product enquiries",
                    "Project and bulk enquiries",
                    "Technical information on request",
                  ].map((point) => (
                    <li key={point} className="flex items-center gap-2.5">
                      <Check className="size-4 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="forest" size="lg" className="mt-7">
                  <Link to="/contact" search={{ product: category.name }}>
                    Enquire about {category.name.toLowerCase()} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* The coming-soon panel is already a dark block, so use the light band below it. */}
      <EnquiryBand tone={category.comingSoon ? "light" : "dark"} />
    </>
  );
}
