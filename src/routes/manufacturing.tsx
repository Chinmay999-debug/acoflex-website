import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Factory, FlaskConical, Package, Warehouse } from "lucide-react";
import { EnquiryBand, PageHero, SectionHeading } from "@/components/site";
import { Button } from "@/components/ui/button";
import { images, processSteps } from "@/lib/site-data";
import { cn } from "@/lib/utils";

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
    <div className="relative grid size-full place-items-center bg-forest">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[72%] text-white/85"
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
      <span className="absolute right-4 top-4 text-xs font-medium text-white/45">
        Process diagram
      </span>
    </div>
  );
}

const lastStep = processSteps.length - 1;
const pad = (n: number) => String(n).padStart(2, "0");
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const WIPE_MS = 900;

/**
 * Scroll-driven walk through the production stages. The panel is sticky while
 * the visitor scrolls past one invisible sentinel per stage; an
 * IntersectionObserver marks the sentinel crossing the middle of the viewport
 * as active. State only changes when the stage changes, and all motion is CSS
 * opacity/transform transitions, so nothing runs per scroll frame.
 *
 * Expects --hdr (sticky header height) and --step (scroll length per stage)
 * on an ancestor.
 */
function ProcessJourney() {
  const [active, setActive] = useState(0);
  const sentinels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset["step"]));
        }
      },
      { rootMargin: "-50% 0px -49% 0px" },
    );
    sentinels.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goTo(i: number) {
    const el = sentinels.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + r.top + r.height / 2 - window.innerHeight / 2,
      behavior: "smooth",
    });
  }

  return (
    <div
      className="relative mt-10 lg:mt-14"
      style={{ height: `calc(100svh - var(--hdr) + ${processSteps.length} * var(--step))` }}
    >
      {processSteps.map((step, i) => (
        <div
          key={step.name}
          ref={(el) => {
            sentinels.current[i] = el;
          }}
          data-step={i}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0"
          style={{ top: `calc(50svh - var(--hdr) + ${i} * var(--step))`, height: "var(--step)" }}
        />
      ))}

      <div className="sticky top-[var(--hdr)] flex h-[calc(100svh-var(--hdr))] items-center py-4 [--row:2.25rem] [--tl:calc(7*var(--row))] lg:py-8 lg:[--row:min(4.25rem,calc((100svh-var(--hdr)-4rem)/7))] [@media(max-height:560px)]:[--tl:0px]">
        <div className="site-container grid gap-5 lg:grid-cols-12 lg:items-center lg:gap-x-16 lg:gap-y-6">
          {/* Timeline */}
          <ol
            className="relative order-3 lg:order-none lg:col-span-5 lg:row-span-2 [@media(max-height:560px)]:hidden lg:[@media(max-height:560px)]:block"
            aria-label="Production stages"
          >
            <span
              aria-hidden="true"
              className="absolute left-[0.4375rem] top-[calc(var(--row)/2)] bottom-[calc(var(--row)/2)] w-px -translate-x-1/2 bg-border"
            />
            <span
              aria-hidden="true"
              className="absolute left-[0.4375rem] top-[calc(var(--row)/2)] bottom-[calc(var(--row)/2)] w-0.5 origin-top bg-gradient-to-b from-gold/35 to-gold"
              style={{
                transform: `translateX(-50%) scaleY(${active / lastStep})`,
                transition: `transform 700ms ${EASE}`,
              }}
            />
            {/* Soft glow that travels with the active marker */}
            <span
              aria-hidden="true"
              className="absolute left-[0.4375rem] top-[calc(var(--row)/2)] size-9 rounded-full bg-gold/30 blur-md"
              style={{
                transform: `translate(-50%, -50%) translateY(calc(var(--row) * ${active}))`,
                transition: `transform 700ms ${EASE}`,
              }}
            />
            {processSteps.map((step, i) => {
              const isActive = i === active;
              const done = i < active;
              return (
                <li key={step.name} className="h-[var(--row)]">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={isActive ? "step" : undefined}
                    className="group flex h-full w-full items-center gap-4 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative size-3.5 shrink-0 rounded-full border-2 transition-[background-color,border-color,box-shadow] duration-500",
                        isActive
                          ? "border-gold bg-gold shadow-[0_0_0_5px_color-mix(in_oklab,var(--gold)_22%,transparent)]"
                          : done
                            ? "border-gold bg-gold"
                            : "border-input bg-background group-hover:border-muted-foreground/50",
                      )}
                    />
                    <span
                      className="flex min-w-0 items-center gap-4 transition-transform duration-500"
                      style={{
                        transform: isActive ? "translateX(6px)" : "none",
                        transitionTimingFunction: EASE,
                      }}
                    >
                      <span
                        className={cn(
                          "w-6 shrink-0 text-sm font-semibold tabular-nums transition-colors duration-500",
                          isActive
                            ? "text-primary"
                            : done
                              ? "text-foreground/55"
                              : "text-muted-foreground/60",
                        )}
                      >
                        {pad(i + 1)}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate text-[0.9375rem] transition-colors duration-500 lg:font-display lg:text-lg",
                            isActive
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground group-hover:text-foreground/80",
                          )}
                        >
                          {step.name}
                        </span>
                        <span
                          className={cn(
                            "hidden truncate text-sm text-muted-foreground transition-opacity duration-500 lg:block [@media(max-height:720px)]:hidden",
                            isActive ? "opacity-100" : "opacity-0",
                          )}
                        >
                          {step.note}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Active stage visual: each new stage is wiped in left-to-right over the previous one */}
          <div className="relative order-1 aspect-[4/3] max-h-[calc(100svh-var(--hdr)-var(--tl)-9.5rem)] w-full overflow-hidden rounded-md bg-forest shadow-[0_28px_60px_-28px_rgb(0_0_0/0.45)] ring-1 ring-black/5 lg:order-none lg:col-span-7 lg:max-h-[calc(100svh-var(--hdr)-12rem)]">
            {processSteps.map((step, i) => {
              const isActive = i === active;
              return (
                <div key={step.name} aria-hidden={!isActive}>
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      zIndex: isActive ? 2 : 1,
                      clipPath: isActive ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                      // The outgoing stage stays visible underneath until the wipe has finished.
                      transition: isActive
                        ? `clip-path ${WIPE_MS}ms ${EASE}`
                        : `clip-path 0s linear ${WIPE_MS}ms`,
                    }}
                  >
                    <div
                      className="size-full"
                      style={{
                        transform: isActive ? "scale(1)" : "scale(1.08)",
                        transition: isActive
                          ? `transform 1400ms ${EASE}`
                          : `transform 0s linear ${WIPE_MS}ms`,
                      }}
                    >
                      {step.image ? (
                        <picture>
                          <source media="(min-width: 1024px)" srcSet={step.image} />
                          <img
                            src={step.mobileImage ?? step.image}
                            alt={step.name}
                            loading="lazy"
                            decoding="async"
                            className="photo"
                          />
                        </picture>
                      ) : (
                        step.diagram && <ProcessDiagram kind={step.diagram} />
                      )}
                    </div>
                  </div>
                  {/* Gold leading edge that rides the wipe once, then fades (keyframes in styles.css) */}
                  {isActive && (
                    <div
                      className="pointer-events-none absolute inset-0 z-[3]"
                      style={{ animation: `journey-sweep ${WIPE_MS}ms ${EASE} both` }}
                    >
                      <span className="absolute inset-y-0 right-0 w-0.5 bg-gold shadow-[0_0_18px_4px_color-mix(in_oklab,var(--gold)_45%,transparent)]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overlay chrome */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-24 bg-gradient-to-t from-black/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[4] flex gap-1.5 sm:inset-x-5 sm:bottom-5">
              {processSteps.map((step, i) => (
                <span
                  key={step.name}
                  className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <span
                    className="block size-full origin-left bg-gold"
                    style={{
                      transform: i <= active ? "scaleX(1)" : "scaleX(0)",
                      transition: `transform 600ms ${EASE}`,
                    }}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Active stage caption */}
          <div className="order-2 flex items-center gap-5 lg:order-none lg:col-span-7 lg:col-start-6 lg:gap-7">
            {/* Outlined numeral that rolls between stages */}
            <div
              aria-hidden="true"
              className="flex shrink-0 font-display text-[3.25rem] font-semibold leading-none tracking-tight text-transparent [-webkit-text-stroke:1.25px_var(--primary)] lg:text-[5rem]"
            >
              <span>0</span>
              <span className="relative block h-[1em] overflow-hidden">
                <span
                  className="flex flex-col"
                  style={{
                    transform: `translateY(-${active}em)`,
                    transition: `transform 800ms ${EASE}`,
                  }}
                >
                  {processSteps.map((step, i) => (
                    <span key={step.name} className="block h-[1em]">
                      {i + 1}
                    </span>
                  ))}
                </span>
              </span>
            </div>
            <div className="grid min-w-0 flex-1" aria-live="polite">
              {processSteps.map((step, i) => {
                const isActive = i === active;
                const reveal = (delay: number) => ({
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "none" : "translateY(10px)",
                  transition: isActive
                    ? `opacity 500ms ease ${delay}ms, transform 700ms ${EASE} ${delay}ms`
                    : "opacity 200ms ease, transform 200ms ease",
                });
                return (
                  <div key={step.name} aria-hidden={!isActive} className="[grid-area:1/1]">
                    <p className="text-[0.8125rem] font-semibold text-primary" style={reveal(60)}>
                      Stage {pad(i + 1)} of {pad(processSteps.length)}
                    </p>
                    <h3 className="h-sub mt-1" style={reveal(120)}>
                      {step.name}
                    </h3>
                    <p
                      className="mt-0.5 text-[0.9375rem] text-muted-foreground"
                      style={reveal(180)}
                    >
                      {step.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Manufacturing() {
  return (
    <>
      <PageHero
        title="Manufacturing"
        intro="Production at the Acoflex plant — from raw material storage through extrusion, calibration, marking and testing to finished goods storage."
        crumbs={[{ label: "Manufacturing" }]}
        image={images.testingLine}
        imageAlt="Pipes on a roller line at the plant"
      />

      <section className="section-y [--hdr:5rem] [--step:34svh] md:[--hdr:7.25rem] lg:[--step:45svh]">
        <div className="site-container">
          <SectionHeading
            kicker="Production process"
            title="How an Acoflex pipe is made"
            copy="The main production stages at the Ambala plant."
          />
        </div>
        <ProcessJourney />
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
    </>
  );
}
