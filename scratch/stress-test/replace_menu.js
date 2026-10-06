const fs = require("fs");
let code = fs.readFileSync("src/components/site.tsx", "utf8");

const newMenu = `
function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label="Open navigation" onClick={() => setOpen(!open)}>
        <Menu className="!size-6" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 bg-forest p-6 text-white overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Brand className="h-10" />
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X className="!size-6" />
            </Button>
          </div>
          <nav className="space-y-4">
            <Link to="/" onClick={() => setOpen(false)} className="block py-4 border-b border-white/10">Home</Link>
            <Link to="/products" onClick={() => setOpen(false)} className="block py-4 border-b border-white/10">Products</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="block py-4 border-b border-white/10">Contact</Link>
          </nav>
        </div>
      )}
    </div>
  );
}
`;

code = code.replace(/function MobileMenu\(\) \{[\s\S]*?\n\}/, newMenu);
fs.writeFileSync("src/components/site.tsx", code);
