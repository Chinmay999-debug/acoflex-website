import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Sprout, Wrench } from "lucide-react";
import { EnquiryBand, PageHero, RouteFrame, SectionHeading } from "@/components/site";
import { Button } from "@/components/ui/button";
import { categories, images, services, strengths } from "@/lib/site-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Acoflex" },
      {
        name: "description",
        content:
          "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Ambala, Haryana.",
      },
      { property: "og:title", content: "About Acoflex" },
      {
        property: "og:description",
        content: "Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const markets = [
  {
    icon: Building2,
    title: "Residential and commercial",
    copy: "Water supply and drainage pipe systems for homes, housing projects and commercial buildings.",
  },
  {
    icon: Sprout,
    title: "Agriculture",
    copy: "Column and pressure pipes for borewells, irrigation and rural water supply.",
  },
  {
    icon: Wrench,
    title: "Projects and infrastructure",
    copy: "Pipe systems for institutional projects and underground drainage works.",
  },
];

function About() {
  return (
    <RouteFrame>
      <PageHero
        title="About Acoflex"
        intro="Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, Haryana."
        crumbs={[{ label: "About" }]}
        image={images.pipeStock}
        imageAlt="Pipe stock on racks at the Acoflex plant"
      />

      <section className="section-y">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <img
            src={images.factoryWide}
            alt="Extrusion lines at the Acoflex plant"
            className="aspect-[4/3] w-full rounded-md object-cover"
          />
          <div>
            <p className="kicker">Who we are</p>
            <h2 className="h-section mt-4">
              Focused on the pipes that buildings and farms depend on
            </h2>
            <p className="body-copy mt-5 text-muted-foreground">
              Acoflex brings extrusion, testing and storage together at one plant. The range covers{" "}
              {categories
                .filter((c) => !c.comingSoon)
                .map((c) => c.name.toLowerCase())
                .join(", ")
                .replace(/, ([^,]*)$/, " and $1")}
              , with storage water tanks coming soon.
            </p>
            <p className="body-copy mt-4 text-muted-foreground">
              Technical information and quality documentation for each product are available on
              request.
            </p>
            <Button asChild variant="forest" size="lg" className="mt-8">
              <Link to="/products">
                View our products <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section-y bg-secondary">
        <div className="site-container">
          <SectionHeading
            kicker="Markets we serve"
            title="Pipe systems for every stage of water management"
            align="center"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {markets.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-md border border-border bg-card p-7">
                <span className="grid size-12 place-items-center rounded-md bg-forest text-gold">
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <h3 className="h-card mt-6">{title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="site-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="kicker">At the plant</p>
            <h2 className="h-section mt-4">How we work</h2>
          </div>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-7">
            {strengths.map((item) => (
              <div key={item.title} className="border-t-2 border-gold pt-5">
                <h3 className="h-card">{item.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest text-white">
        <div className="site-container grid gap-10 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-4">
            <h2 className="h-section text-white">What we supply</h2>
          </div>
          <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:col-span-8">
            {services.map((service) => (
              <li
                key={service}
                className="flex items-center gap-3 border-b border-white/10 pb-4 text-[1.0625rem]"
              >
                <span className="size-1.5 rounded-full bg-gold" />
                {service}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="pt-16 lg:pt-24">
        <EnquiryBand />
      </div>
    </RouteFrame>
  );
}
