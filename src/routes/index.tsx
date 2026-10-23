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
import { HeroSlider } from "@/components/hero/HeroSlider";
import {
  allProducts as fallbackAllProducts,
  categories as fallbackCategories,
  dealerBenefits,
  images,
  processSteps,
  strengths,
} from "@/lib/site-data";
import {
  usePublishedCategories,
  usePublishedPageContent,
  usePublishedProducts,
} from "@/hooks/use-site-content";

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

const BLANK_GIF = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

const strengthIcons = [Factory, FlaskConical, Warehouse, FileText] as const;
const benefitIcons = [Tag, PackageCheck, Truck, Megaphone] as const;

function Index() {
  const { data: pageData } = usePublishedPageContent("home");
  const { data: dynamicCategories } = usePublishedCategories();
  const { products: dynamicProducts } = usePublishedProducts();

  const categories = dynamicCategories ?? fallbackCategories;
  const allProducts = dynamicProducts.length > 0 ? dynamicProducts : fallbackAllProducts;

  const content = pageData?.content;
  const heroKicker = content?.hero?.kicker || "Pipe manufacturer · Ambala, Haryana";
  const heroTitle = content?.hero?.title || "Pipe systems for plumbing, drainage and agriculture";
  const heroLede =
    content?.hero?.lede ||
    "Acoflex manufactures CPVC, UPVC, PPR-C, SWR, drainage and agricultural pipes at its plant in Ambala, Haryana.";
  const heroCtaPrimary = content?.hero?.cta_primary || {
    label: "Explore products",
    to: "/products",
  };
  const heroCtaSecondary = content?.hero?.cta_secondary || {
    label: "Contact sales",
    to: "/contact",
  };

  const homeStrengths =
    Array.isArray(content?.strengths) && content.strengths.length > 0
      ? content.strengths
      : strengths;

  const productsSection = content?.products_section || {
    kicker: "Our products",
    title: "Four product categories, one dependable supplier",
    copy: "Browse by category to find the right pipe system for your application.",
  };

  const aboutTeaser = content?.about_teaser || {
    kicker: "About Acoflex",
    title: "A pipe manufacturer based in Ambala, Haryana",
    copy: "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, with extrusion, testing and storage facilities on site.",
  };

  const manufacturingTeaser = content?.manufacturing_teaser || {
    kicker: "Manufacturing",
    title: "From raw material to finished pipe",
    copy: "Production, testing and storage stages at the Ambala plant.",
  };

  const qualityTeaser = content?.quality_teaser || {
    kicker: "Quality",
    title: "An in-house testing lab at the plant",
    copy: "Acoflex carries out quality checks at its own testing lab. Testing details and quality documentation for each product are available on request.",
  };

  const dealersTeaser = content?.dealers_teaser || {
    kicker: "Dealers and distributors",
    title: "Partner with Acoflex",
    copy: "Acoflex welcomes enquiries from wholesalers, distributors and project buyers.",
  };

  // Home shows the later stages: each has its own photo not used elsewhere on the page.
  const highlightSteps = processSteps.slice(3);
  return (
    <>
      {/* Hero: published slides when available, otherwise the CMS-driven static hero. */}
      <HeroSlider
        pageHeading={heroTitle}
        fallback={
          <section className="relative overflow-hidden bg-forest text-white">
            {/* Desktop and mobile heroes each use a 1px placeholder outside their breakpoint so only one photo downloads. */}
            <picture className="absolute bottom-1 right-0 top-0 hidden w-[58%] lg:block">
              <source media="(min-width: 1024px)" srcSet={images.factoryWide} />
              <img
                src={BLANK_GIF}
                alt="Acoflex pipe extrusion lines on the factory floor"
                fetchPriority="high"
                className="photo opacity-90 [mask-image:linear-gradient(to_right,transparent,black_50%)]"
              />
            </picture>
            {/* Below lg: the factory fills the hero behind the copy, under a left-to-right forest overlay. */}
            <picture className="absolute inset-x-0 bottom-1 top-0 lg:hidden">
              <source media="(min-width: 1024px)" srcSet={BLANK_GIF} />
              <img
                src={images.factoryHeroMobile}
                alt=""
                width={780}
                height={975}
                fetchPriority="high"
                className="photo object-[60%_60%]"
              />
            </picture>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 top-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--forest)_92%,transparent)_0%,color-mix(in_oklab,var(--forest)_78%,transparent)_60%,color-mix(in_oklab,var(--forest)_35%,transparent)_100%)] lg:hidden"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 top-0 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--forest)_55%,transparent)_0%,color-mix(in_oklab,var(--forest)_40%,transparent)_55%,transparent_80%)] lg:hidden"
            />
            <div className="site-container relative grid items-center pb-32 pt-12 sm:pb-40 sm:pt-16 lg:min-h-[38rem] lg:grid-cols-12 lg:py-24">
              <div className="lg:col-span-6">
                <p className="kicker !text-white/80">{heroKicker}</p>
                <h1 className="h-hero mt-6">{heroTitle}</h1>
                <p className="lede mt-6 text-white/90 lg:text-white/75">{heroLede}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild variant="gold" size="lg">
                    <Link to={heroCtaPrimary.to || "/products"}>
                      {heroCtaPrimary.label || "Explore products"} <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="outlineLight" size="lg">
                    <Link to={heroCtaSecondary.to || "/contact"}>
                      {heroCtaSecondary.label || "Contact sales"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative h-1 bg-gold" />
          </section>
        }
      />

      {/* Strengths */}
      <section className="bg-forest-deep text-white">
        <div className="site-container grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {homeStrengths.map((item, i) => {
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
            kicker={productsSection.kicker}
            title={productsSection.title}
            copy={productsSection.copy}
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
            <p className="kicker">{aboutTeaser.kicker}</p>
            <h2 className="h-section mt-4">{aboutTeaser.title}</h2>
            <p className="body-copy mt-5 text-muted-foreground">{aboutTeaser.copy}</p>
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
            kicker={manufacturingTeaser.kicker}
            title={manufacturingTeaser.title}
            copy={manufacturingTeaser.copy}
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
                      src={step.mobileImage ?? step.image ?? images.factoryWideMobile}
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
            <p className="kicker !text-white/80">{qualityTeaser.kicker}</p>
            <h2 className="h-section mt-4">{qualityTeaser.title}</h2>
            <p className="body-copy mt-5 text-white/70">{qualityTeaser.copy}</p>
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
            <p className="kicker">{dealersTeaser.kicker}</p>
            <h2 className="h-section mt-4">{dealersTeaser.title}</h2>
            <p className="body-copy mt-5 text-muted-foreground">{dealersTeaser.copy}</p>
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
