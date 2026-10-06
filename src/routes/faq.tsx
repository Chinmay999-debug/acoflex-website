import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EnquiryBand, PageHero } from "@/components/site";
import { faqs } from "@/lib/site-data";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Acoflex" },
      {
        name: "description",
        content: "Answers about Acoflex technical data, testing, delivery and upcoming products.",
      },
      { property: "og:title", content: "Acoflex FAQ" },
      {
        property: "og:description",
        content: "Common questions about Acoflex products and supply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Faq,
});

function Faq() {
  return (
    <>
      <PageHero
        title="Frequently asked questions"
        intro="Answers to common questions about our products, testing and supply."
        crumbs={[{ label: "FAQ" }]}
      />
      <section className="site-container section-y grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="h-sub">Can't find your answer?</h2>
          <p className="body-copy mt-3 text-muted-foreground">
            Our team is happy to help with product selection and supply questions.
          </p>
          <Link to="/contact" className="text-link mt-5">
            Contact us
          </Link>
        </div>
        <Accordion type="single" collapsible defaultValue="item-0" className="lg:col-span-8">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              value={`item-${i}`}
              className="mb-3 rounded-md border border-border bg-card px-6"
            >
              <AccordionTrigger className="py-5 text-left text-[1.0625rem] font-semibold hover:no-underline data-[state=open]:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="body-copy pb-6 text-[0.9375rem] text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <EnquiryBand />
    </>
  );
}
