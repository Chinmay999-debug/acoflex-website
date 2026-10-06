import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Factory, FlaskConical, Package, Warehouse } from "lucide-react";
import { EnquiryBand, PageHero, RouteFrame, SectionHeading } from "@/components/site";
import { Button } from "@/components/ui/button";
import { images, processSteps } from "@/lib/site-data";

export const Route = createFileRoute("/manufacturing")({
  head: () => ({
    meta: [
      { title: "Manufacturing — Acoflex" },
      {
        name: "description",
        content:
          "How Acoflex pipes are made: extrusion, calibration, marking, socketing, testing and storage at the Ambala plant.",
      },
      { property: "og:title", content: "Manufacturing at Acoflex" },
      {
        property: "og:description",
        content: "Production stages at the Acoflex plant in Ambala, Haryana.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Manufacturing,
});

const plantAreas = [
  { icon: Warehouse, title: "Raw material storage" },
  { icon: Factory, title: "Extrusion lines" },
  { icon: FlaskConical, title: "Testing lab" },
  { icon: Package, title: "Finished goods storage" },
];

/**
 * Line diagrams for stages without a suitable photo. They sit in the same
 * frame as the photo cards so the grid reads as one set of process cards.
 */
function ProcessDiagram({ kind }: { kind: "calibration" | "marking" }) {
  return (
    <div className="relative grid size-full place-items-center bg-secondary">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[78%] text-forest transition-transform duration-500 group-hover:scale-[1.04]"
        aria-hidden="true"
      >
        {/* Pipe, shown in side view with an open end */}
        <path d="M24 88h152M24 120h152" stroke="currentColor" strokeWidth="3" />
        <ellipse cx="24" cy="104" rx="7" ry="16" stroke="currentColor" strokeWidth="3" />
        <path d="M176 88c4 0 7 7 7 16s-3 16-7 16" stroke="currentColor" strokeWidth="3" />
        {kind === "calibration" ? (
          <>
            {/* Sizing sleeve around the pipe */}
            <rect
              x="58"
              y="76"
              width="34"
              height="56"
              rx="4"
              className="stroke-gold"
              strokeWidth="3"
            />
            <path d="M66 76v56M84 76v56" className="stroke-gold" strokeWidth="1.5" opacity="0.6" />
            {/* Cooling sprays */}
            {[118, 138, 158].map((x) => (
              <path
                key={x}
                d={`M${x} 52v6M${x - 6} 62l-3 12M${x + 6} 62l3 12M${x} 64v12`}
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.55"
              />
            ))}
            {/* Water bath */}
            <path
              d="M104 146c8 -5 14 -5 22 0s14 5 22 0 14 -5 22 0M104 158c8 -5 14 -5 22 0s14 5 22 0 14 -5 22 0"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.4"
            />
          </>
        ) : (
          <>
            {/* Print head on a fixed mounting rail above the pipe */}
            <path d="M78 30h76M116 30v8" stroke="currentColor" strokeWidth="2.5" opacity="0.55" />
            <rect
              x="100"
              y="38"
              width="32"
              height="24"
              rx="3"
              className="stroke-gold"
              strokeWidth="3"
            />
            <rect
              x="111"
              y="62"
              width="10"
              height="8"
              rx="1"
              className="stroke-gold"
              strokeWidth="2.5"
            />
            <path d="M116 74v8" className="stroke-gold" strokeWidth="2" strokeDasharray="2 3" />
            {/* Printed line along the pipe, left behind as the pipe moves */}
            <path d="M40 104h70" className="stroke-gold" strokeWidth="3" strokeDasharray="8 6" />
          </>
        )}
        {/* Direction of travel */}
        <path d="M70 176h60m-8 -6 8 6 -8 6" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      </svg>
      <span className="absolute bottom-4 right-4 text-xs font-medium text-muted-foreground">
        Process diagram
      </span>
    </div>
  );
}

function Manufacturing() {
  return (
    <RouteFrame>
      <PageHero
        title="Manufacturing"
        intro="Production at the Acoflex plant — from raw material storage through extrusion, calibration, marking and testing to finished goods storage."
        crumbs={[{ label: "Manufacturing" }]}
        image={images.testingLine}
        imageAlt="Pipes on a roller line at the plant"
      />

      <section className="section-y">
        <div className="site-container">
          <SectionHeading
            kicker="Production process"
            title="How an Acoflex pipe is made"
            copy="The main production stages at the Ambala plant."
          />
          <ol className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <li key={step.name} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                  {step.image ? (
                    <picture>
                      <source media="(min-width: 1024px)" srcSet={step.image} />
                      <img
                        src={(step as any).mobileImage ?? step.image}
                        alt={step.name}
                        loading="lazy"
                        className="photo transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </picture>
                  ) : (
                    step.diagram && <ProcessDiagram kind={step.diagram} />
                  )}
                  <span className="absolute left-4 top-4 grid size-9 place-items-center rounded-sm bg-forest text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="h-card mt-5">{step.name}</h3>
                <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">{step.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-y bg-secondary">
        <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-white/10">
            {plantAreas.map(({ icon: Icon, title }) => (
              <li
                key={title}
                className="flex aspect-[4/3] flex-col justify-between bg-forest p-6 text-white sm:p-7"
              >
                <Icon className="size-7 text-gold" strokeWidth={1.5} />
                <span className="h-card text-white">{title}</span>
              </li>
            ))}
          </ul>
          <div>
            <p className="kicker">Under one roof</p>
            <h2 className="h-section mt-4">Production, testing and storage at one plant</h2>
            <p className="body-copy mt-5 text-muted-foreground">
              Raw material storage, processing lines, the testing lab and finished goods storage sit
              together at the Ambala plant.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="forest" size="lg">
                <Link to="/infrastructure">
                  Our infrastructure <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold">
                <Link to="/quality">Quality</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-16 lg:pt-24">
        <EnquiryBand />
      </div>
    </RouteFrame>
  );
}
