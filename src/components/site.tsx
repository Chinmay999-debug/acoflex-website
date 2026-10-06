import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronRight, Clock, Mail, MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  categories,
  contact,
  images,
  navItems,
  type Category,
  type Product,
} from "@/lib/site-data";
import { cn } from "@/lib/utils";
import leaf from "@/assets/acoflex-leaf.png";

export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Acoflex home" className="inline-flex shrink-0 items-center">
      <img
        src={images.logo}
        alt="Acoflex — Sustainable Solutions"
        className={cn("h-14 w-auto object-contain", className)}
      />
    </Link>
  );
}

/* ------------------------------------------------------------------
 * Header
 * ------------------------------------------------------------------ */

function ProductsMenu() {
  return (
    <div className="group/menu relative">
      <Link
        to="/products"
        className="nav-link inline-flex h-20 items-center gap-1"
        activeProps={{ className: "!text-white" }}
        aria-haspopup="true"
      >
        Products <ChevronDown className="size-4 transition-transform group-hover/menu:rotate-180" />
      </Link>
      <div className="invisible absolute -left-6 top-full w-[44rem] opacity-0 transition duration-150 group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100">
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-b-md border-t-2 border-gold bg-border shadow-xl">
          {categories.map((category) => (
            <div key={category.slug} className="bg-white p-6">
              <Link
                to="/products/$category"
                params={{ category: category.slug }}
                className="h-card block text-[0.9375rem] text-foreground hover:text-primary"
              >
                {category.name}
              </Link>
              <ul className="mt-4 space-y-2.5">
                {category.comingSoon ? (
                  <li className="text-sm text-muted-foreground">Coming soon</li>
                ) : (
                  category.products.map((product) => (
                    <li key={product.slug}>
                      <Link
                        to="/products/$category/$product"
                        params={{ category: category.slug, product: product.slug }}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const plain = [
    { label: "Home", to: "/" },
    ...navItems.filter((item) => item.to !== "/products"),
    { label: "Resources", to: "/resources" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact", to: "/contact" },
  ] as const;

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="!size-6" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-forest p-0 text-white shadow-2xl outline-none transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto border-l border-white/10",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 py-4 pl-6 pr-4">
          <Brand className="h-10" />
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X className="!size-6" />
          </Button>
        </div>
        <nav className="px-6 py-4" aria-label="Mobile navigation">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block border-b border-white/10 py-4 text-lg font-medium"
          >
            Home
          </Link>
          <Accordion type="single" collapsible>
            <AccordionItem value="products" className="border-white/10">
              <AccordionTrigger className="py-4 text-lg font-medium hover:no-underline [&>svg]:text-white/70">
                Products
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to="/products/$category"
                    params={{ category: category.slug }}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-2.5 text-[0.9375rem] text-white/80"
                  >
                    {category.name}
                    {category.comingSoon && (
                      <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-xs text-gold">
                        Soon
                      </span>
                    )}
                  </Link>
                ))}
                <Link
                  to="/products"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-gold"
                >
                  All products <ArrowRight className="size-4" />
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {plain.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-white/10 py-4 text-lg font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Button
            asChild
            variant="gold"
            size="lg"
            className="mt-8 w-full"
            onClick={() => setOpen(false)}
          >
            <Link to="/contact">Get a quote</Link>
          </Button>
        </nav>
      </div>
    </>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div className="hidden bg-forest-deep text-[0.8125rem] text-white/70 md:block">
        <div className="site-container flex h-9 items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-3.5 text-gold" />
            Barara, Ambala, Haryana
          </span>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2">
              <Clock className="size-3.5 text-gold" />
              {contact.hours}
            </span>
            <a
              href={`mailto:${contact.emails[0]}`}
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <Mail className="size-3.5 text-gold" />
              {contact.emails[0]}
            </a>
          </div>
        </div>
      </div>
      <div className="bg-forest shadow-[0_1px_0_rgb(255_255_255/0.06)]">
        <div className="site-container flex h-20 items-center justify-between gap-6">
          <Brand />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) =>
              item.to === "/products" ? (
                <ProductsMenu key={item.to} />
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-link relative py-2"
                  activeProps={{
                    className:
                      "!text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-gold",
                  }}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="gold" className="hidden h-11 px-5 sm:inline-flex">
              <Link to="/contact">Get a quote</Link>
            </Button>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------
 * Footer
 * ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest-deep text-white/75">
      <LeafMark className="absolute -bottom-10 -right-8 size-64 text-white/[0.035] lg:size-80" />
      <div className="site-container relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] lg:py-20">
        <div>
          <Brand className="h-14" />
          <p className="mt-6 max-w-xs text-[0.9375rem] leading-relaxed">
            Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Products</p>
          <ul className="mt-5 space-y-3 text-[0.9375rem]">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  to="/products/$category"
                  params={{ category: category.slug }}
                  className="hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Company</p>
          <ul className="mt-5 space-y-3 text-[0.9375rem]">
            {[
              ...navItems.filter((item) => item.to !== "/products"),
              { label: "Resources", to: "/resources" },
              { label: "FAQ", to: "/faq" },
            ].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Get in touch</p>
          <ul className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed">
            <li className="flex gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-gold" />
              {contact.address}
            </li>
            {contact.emails.map((email) => (
              <li key={email} className="flex gap-3">
                <Mail className="mt-1 size-4 shrink-0 text-gold" />
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            ))}
            <li className="flex gap-3">
              <Clock className="mt-1 size-4 shrink-0 text-gold" />
              {contact.hours}
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="site-container flex flex-col gap-2 py-6 text-[0.8125rem] text-white/50 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Acoflex</span>
          <span>Made in India</span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------
 * Page building blocks
 * ------------------------------------------------------------------ */

export type Crumb = { label: string; to?: string; params?: Record<string, string> };

export function Breadcrumbs({ items, light = false }: { items: Crumb[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-[0.8125rem]",
          light ? "text-white/60" : "text-muted-foreground",
        )}
      >
        <li>
          <Link to="/" className={light ? "hover:text-white" : "hover:text-primary"}>
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-1.5">
            <ChevronRight className="size-3.5 opacity-60" />
            {item.to ? (
              // Crumbs are built from known route paths; widen the typed router props here.
              <Link
                to={item.to as never}
                params={item.params as never}
                className={light ? "hover:text-white" : "hover:text-primary"}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={light ? "text-white" : "text-foreground"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Interior page banner: forest green, optional photo on the right. */
export function PageHero({
  title,
  intro,
  crumbs,
  image,
  imageAlt,
  children,
}: {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  image?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-forest text-white">
      {image && (
        <picture className="absolute bottom-1 right-0 top-0 hidden w-[46%] lg:block">
          <source media="(min-width: 1024px)" srcSet={image} />
          <img
            src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
            alt={imageAlt ?? ""}
            fetchPriority="high"
            className="photo opacity-85 [mask-image:linear-gradient(to_right,transparent,black_60%)]"
          />
        </picture>
      )}
      <div className="site-container relative py-14 lg:py-20">
        <Breadcrumbs items={crumbs} light />
        <h1 className="h-page mt-6">{title}</h1>
        {intro && <p className="lede mt-5 text-white/75">{intro}</p>}
        {children}
      </div>
      <div className="h-1 bg-gold" />
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  copy,
  align = "left",
  action,
}: {
  kicker?: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
}) {
  if (align === "center") {
    return (
      <div className="mx-auto max-w-2xl text-center">
        {kicker && <p className="kicker">{kicker}</p>}
        <h2 className="h-section mx-auto mt-4">{title}</h2>
        {copy && <p className="body-copy mx-auto mt-4 text-muted-foreground">{copy}</p>}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <p className="kicker">{kicker}</p>}
        <h2 className="h-section mt-4">{title}</h2>
        {copy && <p className="body-copy mt-4 text-muted-foreground">{copy}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CategoryCard({ category }: { category: Category }) {
  if (category.comingSoon) {
    return (
      <Link
        to="/products/$category"
        params={{ category: category.slug }}
        className="group relative flex min-h-80 flex-col justify-between overflow-hidden rounded-md bg-forest p-7 text-white"
      >
        <TankMark className="absolute -bottom-6 -right-6 h-48 w-48 text-white/[0.07]" />
        <span className="w-fit rounded-sm bg-gold px-2.5 py-1 text-xs font-semibold text-forest-deep">
          Coming soon
        </span>
        <div className="relative">
          <h3 className="h-sub">{category.name}</h3>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/70">{category.summary}</p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
            Register interest{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    );
  }
  return (
    <div className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lg">
      <Link
        to="/products/$category"
        params={{ category: category.slug }}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
      >
        <img
          src={category.image}
          alt={category.imageAlt}
          loading="lazy"
          className="photo transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <Link
          to="/products/$category"
          params={{ category: category.slug }}
          className="h-sub hover:text-primary"
        >
          {category.name}
        </Link>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {category.summary}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {category.products.map((product) => (
            <li key={product.slug}>
              <Link
                to="/products/$category/$product"
                params={{ category: category.slug, product: product.slug }}
                className="inline-block rounded-sm bg-secondary px-2.5 py-1 text-[0.8125rem] font-medium text-foreground/80 hover:bg-primary hover:text-white"
              >
                {product.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/products/$category"
          params={{ category: category.slug }}
          className="text-link mt-auto pt-6"
        >
          View range <ArrowRight />
        </Link>
      </div>
    </div>
  );
}

export function ProductCard({ product, category }: { product: Product; category: Category }) {
  return (
    <Link
      to="/products/$category/$product"
      params={{ category: category.slug, product: product.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          className="photo transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.imageType === "manufacturing" && (
          <span className="absolute bottom-3 left-3 rounded-sm bg-forest/85 px-2 py-1 text-[0.6875rem] font-semibold text-white">
            Manufacturing image
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t-2 border-transparent p-5 transition-colors group-hover:border-gold">
        <h3 className="h-card group-hover:text-primary">{product.fullName}</h3>
        <dl className="mt-3 min-h-[2.75rem] space-y-1.5 text-[0.875rem]">
          {product.facts.map((fact) => (
            <div key={fact.label} className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">{fact.label}:</dt>
              <dd className="font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <span className="text-link mt-auto pt-5">
          View details <ArrowRight />
        </span>
      </div>
    </Link>
  );
}

/**
 * The leaf from the Acoflex logo, used as a faint watermark. Rendered as a
 * mask so it takes the current text colour.
 */
export function LeafMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none block bg-current", className)}
      style={{
        maskImage: `url(${leaf})`,
        WebkitMaskImage: `url(${leaf})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

/** Simple outline of a vertical storage tank, used where no product photo exists yet. */
export function TankMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      className={className}
      aria-hidden="true"
    >
      <path d="M30 28c0-8 13.4-12 30-12s30 4 30 12v64c0 8-13.4 12-30 12s-30-4-30-12V28Z" />
      <path d="M30 28c0 8 13.4 12 30 12s30-4 30-12M30 56c0 6 13.4 9 30 9s30-3 30-9M30 80c0 6 13.4 9 30 9s30-3 30-9" />
      <rect x="52" y="8" width="16" height="8" rx="2" />
    </svg>
  );
}

export function EnquiryBand({
  title = "Need pipes for a project or dealership?",
  copy = "Tell us what you need and the Acoflex team will get back to you with availability and pricing.",
  tone = "dark",
}: {
  title?: string;
  copy?: string;
  /** "light" sits below other dark panels without two green blocks stacking up. */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <section className="bg-background pb-16 lg:pb-24">
      <div className="site-container">
        <div
          className={cn(
            "relative overflow-hidden rounded-md px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:py-14",
            light ? "border border-border bg-secondary" : "bg-forest text-white",
          )}
        >
          <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
          {!light && (
            <LeafMark className="absolute -right-6 top-1/2 size-56 -translate-y-1/2 text-white/[0.05]" />
          )}
          <div className="relative">
            <h2 className={cn("h-section", !light && "text-white")}>{title}</h2>
            <p className={cn("body-copy mt-3", light ? "text-muted-foreground" : "text-white/70")}>
              {copy}
            </p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Button asChild variant={light ? "forest" : "gold"} size="lg">
              <Link to="/contact">
                Get a quote <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant={light ? "outline" : "outlineLight"}
              size="lg"
              className={
                light ? "border-forest/30 font-semibold text-forest hover:text-forest" : undefined
              }
            >
              <Link to="/dealers">Become a dealer</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RouteFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
