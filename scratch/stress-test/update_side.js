const fs = require("fs");
let code = fs.readFileSync("src/components/site.tsx", "utf8");

code = code.replace(
  /"fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-forest p-0 text-white shadow-2xl outline-none transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto border-r border-white\/10"/g,
  '"fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-forest p-0 text-white shadow-2xl outline-none transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto border-l border-white/10"',
);

code = code.replace(
  /open \? "translate-x-0" : "-translate-x-full"/g,
  'open ? "translate-x-0" : "translate-x-full"',
);

fs.writeFileSync("src/components/site.tsx", code);
