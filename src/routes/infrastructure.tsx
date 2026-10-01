import { createFileRoute } from "@tanstack/react-router";
import { EnquiryBand, PageHero, RouteFrame } from "@/components/site";
import { images } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/infrastructure")({
  head: () => ({
    meta: [
      { title: "Infrastructure — Acoflex" },
      {
        name: "description",
        content:
          "The Acoflex extrusion plant, quality testing lab, and storage and logistics facilities in Ambala, Haryana.",
      },
      { property: "og:title", content: "Acoflex infrastructure" },
      {
        property: "og:description",
        content: "Production, testing, storage and logistics brought together for reliable supply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Infrastructure,
});

const facilities = [
  {
    title: "Extrusion plant",
    copy: "Automated extrusion lines producing the Acoflex pipe range.",
    image: images.factoryWide,
    alt: "Automated extrusion lines",
  },
  {
    title: "Quality testing lab",
    copy: "An in-house lab for product quality checks. Testing details are available on request.",
    image: images.testing,
    alt: "Technician inspecting pipes in the testing lab",
  },
  {
    title: "Storage and logistics",
    copy: "Raw material silos and finished goods storage at the plant.",
    image: images.pipeStock,
    alt: "Pipe stock on racks at the plant",
  },
];

function Infrastructure() {
  return (
    <RouteFrame>
      <PageHero
        title="Infrastructure"
        intro="The Acoflex plant brings extrusion, testing and storage facilities together at one site in Ambala, Haryana."
        crumbs={[{ label: "Infrastructure" }]}
        image={images.silos}
        imageAlt="Raw material silos at the Acoflex plant"
      />
      <section className="section-y">
        <div className="site-container space-y-16 lg:space-y-24">
          {facilities.map((facility, i) => (
            <article
              key={facility.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <img
                src={facility.image}
                alt={facility.alt}
                loading="lazy"
                className={cn(
                  "aspect-[16/10] w-full rounded-md object-cover",
                  i % 2 === 1 && "lg:order-2",
                )}
              />
              <div>
                <span className="text-sm font-semibold text-gold">0{i + 1}</span>
                <h2 className="h-section mt-3">{facility.title}</h2>
                <p className="body-copy mt-4 text-muted-foreground">{facility.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <EnquiryBand />
    </RouteFrame>
  );
}
