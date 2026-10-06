import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileText, HelpCircle } from "lucide-react";
import { PageHero } from "@/components/site";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Acoflex" },
      {
        name: "description",
        content: "Acoflex product catalogue, FAQs and technical data requests.",
      },
      { property: "og:title", content: "Acoflex resources" },
      {
        property: "og:description",
        content: "Product information and technical document requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Resources,
});

function Resources() {
  const items = [
    {
      icon: BookOpen,
      title: "Product catalogue",
      copy: "Browse every Acoflex product by category.",
      link: (
        <Link to="/products" className="text-link mt-auto pt-6">
          Browse products <ArrowRight />
        </Link>
      ),
    },
    {
      icon: HelpCircle,
      title: "Frequently asked questions",
      copy: "Technical data, testing, delivery and upcoming products.",
      link: (
        <Link to="/faq" className="text-link mt-auto pt-6">
          Read the FAQ <ArrowRight />
        </Link>
      ),
    },
    {
      icon: FileText,
      title: "Technical data sheets",
      copy: "Data sheets and brochures are being prepared. Request current specifications from the team.",
      link: (
        <Link
          to="/contact"
          search={{ product: "Technical data sheets" }}
          className="text-link mt-auto pt-6"
        >
          Request documents <ArrowRight />
        </Link>
      ),
    },
  ];
  return (
    <>
      <PageHero
        title="Resources"
        intro="Product information and the right way to request technical documents for your project."
        crumbs={[{ label: "Resources" }]}
      />
      <section className="site-container section-y grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, copy, link }) => (
          <div key={title} className="flex flex-col rounded-md border border-border bg-card p-7">
            <span className="grid size-12 place-items-center rounded-md bg-gold-soft text-forest">
              <Icon className="size-6" strokeWidth={1.6} />
            </span>
            <h2 className="h-card mt-6">{title}</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{copy}</p>
            {link}
          </div>
        ))}
      </section>
    </>
  );
}
