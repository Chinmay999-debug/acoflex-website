import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { EnquiryBand, PageHero, ProductCard, TankMark } from "@/components/site";
import { Button } from "@/components/ui/button";
import { categories, images } from "@/lib/site-data";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products — Acoflex pipe systems" },
      {
        name: "description",
        content:
          "Browse Acoflex plumbing, drainage and agriculture pipe systems: CPVC, UPVC, PPR-C, multilayer composite, SWR, foamcore, DWC, column and pressure pipes.",
      },
      { property: "og:title", content: "Acoflex product range" },
      {
        property: "og:description",
        content: "Plumbing, drainage and agriculture pipe systems from Acoflex.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Products,
});

function Products() {
  return (
    <>
      <PageHero
        title="Our products"
        intro="Pipe systems for plumbing, drainage and agriculture, organised by application. Choose a category to see the full range."
        crumbs={[{ label: "Products" }]}
        image={images.pipeStock}
        imageAlt="Finished pipe stock on racks at the Acoflex plant"
      >
        <nav aria-label="Product categories" className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.slug}
              href={`#${category.slug}`}
              className="rounded-sm border border-white/25 px-3.5 py-2 text-sm font-medium text-white/85 hover:border-gold hover:text-white"
            >
              {category.name}
            </a>
          ))}
        </nav>
      </PageHero>

      <div className="site-container section-y space-y-20 lg:space-y-24">
        {categories.map((category) => (
          <section key={category.slug} id={category.slug} className="scroll-mt-32">
            <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="h-section">{category.name}</h2>
                <p className="body-copy mt-2 text-muted-foreground">{category.summary}</p>
              </div>
              {!category.comingSoon && (
                <Link
                  to="/products/$category"
                  params={{ category: category.slug }}
                  className="text-link shrink-0"
                >
                  View category <ArrowRight />
                </Link>
              )}
            </div>
            {category.comingSoon ? (
              <div className="relative mt-8 overflow-hidden rounded-md border border-dashed border-gold/60 bg-gold-soft/50 p-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
                <div className="flex items-start gap-5">
                  <TankMark className="size-14 shrink-0 text-forest" />
                  <div>
                    <p className="h-card">Coming soon</p>
                    <p className="mt-1 max-w-xl text-[0.9375rem] text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                <Button asChild variant="forest" size="lg" className="mt-6 sm:mt-0">
                  <Link to="/contact" search={{ product: category.name }}>
                    Register interest
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-8 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {category.products.map((product) => (
                  <ProductCard key={product.slug} product={product} category={category} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <EnquiryBand
        title="Not sure which pipe you need?"
        copy="Share your application and the team will recommend the right product and specification."
      />
    </>
  );
}
