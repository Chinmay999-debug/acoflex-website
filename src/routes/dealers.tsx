import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Megaphone, PackageCheck, Tag, Truck } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/site";
import { Button } from "@/components/ui/button";
import { dealerBenefits, images } from "@/lib/site-data";

export const Route = createFileRoute("/dealers")({
  head: () => ({
    meta: [
      { title: "Dealers and distributors — Acoflex" },
      {
        name: "description",
        content:
          "Become an Acoflex dealer or distributor: factory pricing, ready inventory, logistics support and marketing collateral.",
      },
      { property: "og:title", content: "Partner with Acoflex" },
      {
        property: "og:description",
        content: "Dealer and distributor enquiries for Acoflex pipe systems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dealers,
});

const benefitIcons = [Tag, PackageCheck, Truck, Megaphone] as const;

function Dealers() {
  return (
    <>
      <PageHero
        title="Dealers and distributors"
        intro="Acoflex welcomes enquiries from wholesalers, distributors and project buyers interested in supplying its pipe systems."
        crumbs={[{ label: "Dealers" }]}
        image={images.pipeStock}
        imageAlt="Pipe stock on racks at the Acoflex plant"
      >
        <Button asChild variant="gold" size="lg" className="mt-8">
          <Link to="/contact" search={{ product: "Dealership" }}>
            Apply for dealership <ArrowRight />
          </Link>
        </Button>
      </PageHero>

      <section className="section-y">
        <div className="site-container">
          <SectionHeading
            kicker="Why partner with us"
            title="What dealers can expect"
            align="center"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dealerBenefits.map(({ title, copy }, i) => {
              const Icon = benefitIcons[i % benefitIcons.length] ?? Tag;
              return (
                <div key={title} className="rounded-md border border-border bg-card p-7">
                  <span className="grid size-12 place-items-center rounded-md bg-forest text-gold">
                    <Icon className="size-6" strokeWidth={1.6} />
                  </span>
                  <h3 className="h-card mt-6">{title}</h3>
                  <p className="mt-2 text-[0.9375rem] text-muted-foreground">{copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="site-container">
          <div className="relative overflow-hidden rounded-md bg-forest px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
            <div>
              <h2 className="h-section text-white">Interested in becoming a dealer?</h2>
              <p className="body-copy mt-3 text-white/70">
                Tell us about your business and location, and our team will be in touch.
              </p>
            </div>
            <Button asChild variant="gold" size="lg" className="mt-8 lg:mt-0">
              <Link to="/contact" search={{ product: "Dealership" }}>
                Send dealer enquiry <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
