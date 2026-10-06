const fs = require("fs");
let code = fs.readFileSync("src/components/site.tsx", "utf8");

// Ensure React is imported
if (!code.includes("import React")) {
  code = 'import React, { useState, useEffect } from "react";\n' + code;
}

const newMenu = `
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
    return () => { document.body.style.overflow = ""; };
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
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-forest p-0 text-white shadow-2xl outline-none transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto border-r border-white/10",
          open ? "translate-x-0" : "-translate-x-full"
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
          <Link to="/" onClick={() => setOpen(false)} className="block border-b border-white/10 py-4 text-lg font-medium">
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
          <Button asChild variant="gold" size="lg" className="mt-8 w-full" onClick={() => setOpen(false)}>
            <Link to="/contact">Get a quote</Link>
          </Button>
        </nav>
      </div>
    </>
  );
}
`;

code = code.replace(/function MobileMenu\(\) \{[\s\S]*?\n\}/, newMenu);
fs.writeFileSync("src/components/site.tsx", code);
