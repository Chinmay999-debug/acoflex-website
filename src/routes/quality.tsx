import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { EnquiryBand, PageHero } from "@/components/site";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/site-data";
import { usePublishedPageContent } from "@/hooks/use-site-content";

export const Route = createFileRoute("/quality")({
  head: () => ({
    meta: [
      { title: "Quality — Acoflex" },
      {
        name: "description",
        content:
          "Quality checks and the in-house testing lab at the Acoflex plant in Ambala, Haryana.",
      },
      { property: "og:title", content: "Quality at Acoflex" },
      {
        property: "og:description",
        content: "Quality checks at the Acoflex plant, with documentation available on request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Quality,
});

const defaultStages = [
  {
    title: "Raw material",
    copy: "Raw material is stored in silos at the plant before processing.",
  },
  {
    title: "Production",
    copy: "Pipes are formed on extrusion lines with calibration and cooling stages.",
  },
  {
    title: "Testing",
    copy: "Products are checked at the in-house testing lab. Testing details are available on request.",
  },
];

function Quality() {
  const { data: pageData } = usePublishedPageContent("quality");
  const content = pageData?.content;
  const heroTitle = content?.hero?.title || "Quality";
  const heroIntro =
    content?.hero?.intro ||
    "Quality checks run alongside production at the Acoflex plant, supported by an in-house testing lab.";
  const stages =
    Array.isArray(content?.stages) && content.stages.length > 0 ? content.stages : defaultStages;
  const labSection = content?.lab_section || {
    kicker: "Testing lab",
    title: "Quality checks at the plant",
    copy: "Acoflex has an in-house testing lab at its Ambala plant. Details of the tests carried out for each product, and any applicable standards, are available on request.",
  };

  return (
    <>
      <PageHero
        title={heroTitle}
        intro={heroIntro}
        crumbs={[{ label: "Quality" }]}
        image={images.testing}
        imageAlt="Technician inspecting pipes in the testing lab"
      />

      <section className="section-y">
        <div className="site-container grid gap-6 md:grid-cols-3">
          {stages.map((stage, i) => (
            <div key={stage.title} className="rounded-md border border-border bg-card p-7">
              <span className="text-sm font-semibold text-gold">0{i + 1}</span>
              <h2 className="h-sub mt-3">{stage.title}</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {stage.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-y bg-secondary">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <img
            src={images.testingRig}
            alt="Testing equipment with pressure gauges at the plant"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-md object-cover"
          />
          <div>
            <p className="kicker">{labSection.kicker}</p>
            <h2 className="h-section mt-4">{labSection.title}</h2>
            <p className="body-copy mt-5 text-muted-foreground">{labSection.copy}</p>
            <Link to="/contact" search={{ product: "Testing details" }} className="text-link mt-7">
              Ask about testing <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="site-container">
          <div className="grid gap-8 rounded-md border border-border p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="h-sub">Need compliance or test documentation?</h2>
              <p className="body-copy mt-3 text-muted-foreground">
                Certifications and test reports are not yet published on this website. Request the
                current documentation for your project from the team.
              </p>
            </div>
            <Button asChild variant="forest" size="lg">
              <Link to="/contact" search={{ product: "Quality documentation" }}>
                Request documentation <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <EnquiryBand />
    </>
  );
}
