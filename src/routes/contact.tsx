import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHero, RouteFrame } from "@/components/site";
import { contact } from "@/lib/site-data";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { product?: string } => {
    const product = search["product"];
    return typeof product === "string" && product.length > 0
      ? { product: product.slice(0, 120) }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Contact — Acoflex" },
      {
        name: "description",
        content: "Contact Acoflex for product, project, bulk supply and dealer enquiries.",
      },
      { property: "og:title", content: "Contact Acoflex" },
      {
        property: "og:description",
        content: "Product, project and dealer enquiries for Acoflex pipe systems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { product } = Route.useSearch();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const field = (key: string) => String(d.get(key) ?? "");
    const subject = encodeURIComponent(
      `Acoflex enquiry: ${field("type") || "General"}${field("product") ? ` — ${field("product")}` : ""}`,
    );
    const body = encodeURIComponent(
      `Name: ${field("name")}\nCompany: ${field("company")}\nPhone: ${field("phone")}\nEmail: ${field("email")}\nProduct: ${field("product")}\n\n${field("message")}`,
    );
    window.location.href = `mailto:${contact.emails[0]}?subject=${subject}&body=${body}`;
  }

  return (
    <RouteFrame>
      <PageHero
        title="Contact us"
        intro="For product information, bulk or project supply and dealership enquiries, send us a short brief and the team will respond."
        crumbs={[{ label: "Contact" }]}
      />

      <section className="site-container section-y grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="rounded-md border border-border bg-card p-6 sm:p-9 lg:col-span-7">
          <h2 className="h-sub">Send an enquiry</h2>
          <form onSubmit={submit} className="mt-7 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required autoComplete="name" className="mt-2 h-12" />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  autoComplete="organization"
                  className="mt-2 h-12"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 h-12"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-2 h-12"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="type">Enquiry type</Label>
                <Select name="type" defaultValue={product ? "Product enquiry" : "General enquiry"}>
                  <SelectTrigger id="type" className="mt-2 h-12 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "General enquiry",
                      "Product enquiry",
                      "Bulk or project supply",
                      "Dealer enquiry",
                      "Technical data request",
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="product">Product of interest</Label>
                <Input
                  id="product"
                  name="product"
                  defaultValue={product}
                  placeholder="e.g. CPVC Pipes"
                  className="mt-2 h-12"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                required
                placeholder="Quantities, sizes, location or any other details"
                className="mt-2 min-h-36"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" variant="forest" size="lg">
                Send via email <ArrowUpRight />
              </Button>
              <p className="text-xs text-muted-foreground">
                Opens your email app with the details filled in.
              </p>
            </div>
          </form>
        </div>

        <aside className="space-y-8 lg:col-span-5">
          <div className="rounded-md bg-forest p-7 text-white sm:p-9">
            <h2 className="h-sub">Head office and plant</h2>
            <ul className="mt-6 space-y-5 text-[0.9375rem] leading-relaxed text-white/80">
              <li className="flex gap-3.5">
                <MapPin className="mt-1 size-4 shrink-0 text-gold" />
                <span>
                  <span className="block font-semibold text-white">{contact.company}</span>
                  {contact.address}
                </span>
              </li>
              <li className="flex gap-3.5">
                <Mail className="mt-1 size-4 shrink-0 text-gold" />
                <span className="flex flex-col">
                  {contact.emails.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="hover:text-white hover:underline"
                    >
                      {email}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex gap-3.5">
                <Clock className="mt-1 size-4 shrink-0 text-gold" />
                <span>
                  {contact.hours}
                  <br />
                  Sunday closed
                </span>
              </li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-md border border-border">
            <iframe
              title="Acoflex location map"
              src="https://www.google.com/maps?q=Simbla,+Barara,+Ambala,+Haryana+133201&output=embed"
              className="block h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </section>
    </RouteFrame>
  );
}
