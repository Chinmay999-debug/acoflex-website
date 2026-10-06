import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Factory,
  FileText,
  FlaskConical,
  Megaphone,
  PackageCheck,
  Tag,
  Truck,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCard, EnquiryBand, SectionHeading } from "@/components/site";
import {
  allProducts,
  categories,
  dealerBenefits,
  images,
  processSteps,
  strengths,
} from "@/lib/site-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acoflex — Plumbing, drainage and agriculture pipes" },
      {
        name: "description",
        content:
          "Acoflex manufactures CPVC, UPVC, PPR-C, multilayer composite, SWR, foamcore, DWC and agricultural pipes in Ambala, Haryana.",
      },
      { property: "og:title", content: "Acoflex — Plumbing, drainage and agriculture pipes" },
      {
        property: "og:description",
        content: "Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const strengthIcons = [Factory, FlaskConical, Warehouse, FileText] as const;
const benefitIcons = [Tag, PackageCheck, Truck, Megaphone] as const;

function Index() {
  // Home shows the later stages: each has its own photo not used elsewhere on the page.
  const highlightSteps = processSteps.slice(3);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="absolute bottom-1 right-0 top-0 hidden w-[58%] lg:block">
          <img
            srcSet={`${images.factoryWide} 1024w`}
            sizes="(min-width: 1024px) 58vw, 1px"
            src={images.factoryWide}
            alt="Acoflex pipe extrusion lines on the factory floor"
            className="photo opacity-90 [mask-image:linear-gradient(to_right,transparent,black_50%)]"
          />
        </div>
        <div className="site-container relative grid items-center py-10 sm:py-14 lg:min-h-[38rem] lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-6">
            <p className="kicker !text-white/80">Pipe manufacturer · Ambala, Haryana</p>
            <h1 className="h-hero mt-6">Pipe systems for plumbing, drainage and agriculture</h1>
            <p className="lede mt-6 text-white/75">
              Acoflex manufactures CPVC, UPVC, PPR-C, SWR, drainage and agricultural pipes at its
              plant in Ambala, Haryana.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/products">
                  Explore products <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outlineLight" size="lg">
                <Link to="/contact">Contact sales</Link>
              </Button>
            </div>
          </div>
        </div>
        <img
          src={images.factoryWideMobile}
          alt=""
          fetchPriority="high"
          className="aspect-[16/9] w-full object-cover lg:hidden"
        />
        <div className="h-1 bg-gold" />
      </section>

      {/* Strengths */}
      <section className="bg-forest-deep text-white">
        <div className="site-container grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {strengths.map((item, i) => {
            const Icon = strengthIcons[i % strengthIcons.length] ?? Factory;
            return (
              <div key={item.title} className="flex gap-4 py-7 lg:px-6 lg:first:pl-0">
                <Icon className="mt-0.5 size-6 shrink-0 text-gold" strokeWidth={1.6} />
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Product range */}
      <section className="section-y">
        <div className="site-container">
          <SectionHeading
            kicker="Our products"
            title="Four product categories, one dependable supplier"
            copy="Browse by category to find the right pipe system for your application."
            action={
              <Link to="/products" className="text-link">
                View all products <ArrowRight />
              </Link>
            }
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section-y bg-secondary">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="kicker">About Acoflex</p>
            <h2 className="h-section mt-4">A pipe manufacturer based in Ambala, Haryana</h2>
            <p className="body-copy mt-5 text-muted-foreground">
              Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in
              Barara, Ambala, with extrusion, testing and storage facilities on site.
            </p>
            <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-border pt-7">
              {[
                { value: categories.length, label: "Product categories" },
                { value: allProducts.length, label: "Pipe systems" },
                { value: 1, label: "Manufacturing plant" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-3xl font-semibold text-forest">{stat.value}</dd>
                  <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="forest" size="lg" className="mt-9">
              <Link to="/about">
                More about us <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <picture>
              <source media="(min-width: 1024px)" srcSet={images.testingLine} />
              <img
                src={images.testingLineMobile}
                alt="Pipes on a roller line inside the Acoflex plant"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-md object-cover"
              />
            </picture>
            <div
              className="absolute -bottom-4 -left-4 hidden h-24 w-24 rounded-md border-b-4 border-l-4 border-gold lg:block"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* Manufacturing */}
      <section className="section-y">
        <div className="site-container">
          <SectionHeading
            kicker="Manufacturing"
            title="From raw material to finished pipe"
            copy="Production, testing and storage stages at the Ambala plant."
            action={
              <Link to="/manufacturing" className="text-link">
                See the full process <ArrowRight />
              </Link>
            }
          />
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {highlightSteps.map((step) => (
              <figure key={step.name} className="group">
                <div className="aspect-[4/5] overflow-hidden rounded-md bg-muted">
                  <picture>
                    <source media="(min-width: 1024px)" srcSet={step.image ?? images.factoryWide} />
                    <img
                      src={(step as any).mobileImage ?? step.image ?? images.factoryWideMobile}
                      alt={step.name}
                      loading="lazy"
                      className="photo transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </picture>
                </div>
                <figcaption className="mt-4">
                  <p className="h-card text-base">{step.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.note}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section className="section-y bg-forest text-white">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <picture className="lg:order-2">
            <source media="(min-width: 1024px)" srcSet={images.testing} />
            <img
              src={images.testingMobile}
              alt="Technician inspecting pipes in the testing lab"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-md object-cover"
            />
          </picture>
          <div>
            <p className="kicker !text-white/80">Quality</p>
            <h2 className="h-section mt-4">An in-house testing lab at the plant</h2>
            <p className="body-copy mt-5 text-white/70">
              Acoflex carries out quality checks at its own testing lab. Testing details and quality
              documentation for each product are available on request.
            </p>
            <Link to="/quality" className="text-link mt-9 !text-gold">
              Our approach to quality <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Dealers */}
      <section className="section-y">
        <div className="site-container grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <p className="kicker">Dealers and distributors</p>
            <h2 className="h-section mt-4">Partner with Acoflex</h2>
            <p className="body-copy mt-5 text-muted-foreground">
              Acoflex welcomes enquiries from wholesalers, distributors and project buyers.
            </p>
            <Link to="/dealers" className="text-link mt-7">
              Dealer enquiries <ArrowRight />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 lg:col-span-6 lg:col-start-7">
            {dealerBenefits.map((benefit, i) => {
              const Icon = benefitIcons[i % benefitIcons.length] ?? Tag;
              return (
                <li
                  key={benefit.title}
                  className="rounded-md border border-border bg-card px-5 py-6"
                >
                  <Icon className="size-5 text-gold" strokeWidth={1.8} />
                  <span className="h-card mt-4 block">{benefit.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <EnquiryBand />
    </>
  );
}
