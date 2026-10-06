import logo from "@/assets/Acoflex-Logo-white-png-scaled.png";
import factoryWide from "@/assets/bakcground-image-factory.webp";
import factoryWideMobile from "@/assets/bakcground-image-factory-mobile.webp";
import testing from "@/assets/pipe-testing.webp";
import testingMobile from "@/assets/pipe-testing-mobile.webp";
import testingLine from "@/assets/pipe-testing-2.webp";
import testingLineMobile from "@/assets/pipe-testing-2-mobile.webp";
import c2 from "@/assets/c2.webp";
import c4 from "@/assets/c4.webp";
import c5 from "@/assets/c5.webp";
import c6 from "@/assets/c6.webp";
import b5 from "@/assets/b5.webp";
import b6 from "@/assets/b6.webp";
import b7 from "@/assets/b7.webp";
import pipeStock from "@/assets/pipe-stock.webp";

/*
 * Photo library. Only pipe and manufacturing images are used: photos that
 * show garden-hose coils (b1, b2, b3, b8, c1, c3, Manufacturing.jpg) or
 * unverified pipe markings (b4) are deliberately left out. `pipeStock` is
 * a crop of the pipe-rack side of Manufacturing.jpg.
 */
export const images = {
  logo,
  factoryWide,
  factoryWideMobile,
  testing,
  testingMobile,
  testingLine,
  testingLineMobile,
  pipeStock,
  socketing: b5,
  testingRig: b6,
  silos: b7,
};

export const navItems = [
  { label: "About", to: "/about" },
  { label: "Products", to: "/products" },
  { label: "Manufacturing", to: "/manufacturing" },
  { label: "Quality", to: "/quality" },
  { label: "Infrastructure", to: "/infrastructure" },
  { label: "Dealers", to: "/dealers" },
] as const;

/* ------------------------------------------------------------------
 * Product catalogue
 *
 * Category → Products → Product details. Descriptions describe the
 * product type and its intended use only. Sizes, pressure classes,
 * standards and other technical data are not published yet and must
 * not be invented — the detail page routes those requests to the team.
 *
 * No dedicated Acoflex product photography exists yet. `imageType` says
 * what each image actually is, and the UI labels it accordingly:
 *   representative – a photo of the product type, not an Acoflex product
 *   manufacturing  – a factory photo standing in for the product
 * ------------------------------------------------------------------ */

export type ProductFact = { label: string; value: string };

/**
 * A group within a product's range, e.g. "Pipes" or "Fittings", listing
 * confirmed items (sizes, lengths, fitting types). Leave `range` unset
 * until the client confirms the items — the detail page then shows a
 * "range on request" panel instead of an empty grid.
 */
export type RangeGroup = {
  title: string;
  note?: string;
  items: { name: string; image?: string }[];
};

export type Product = {
  slug: string;
  name: string;
  fullName: string;
  /** System-level heading for the product page, e.g. "CPVC plumbing system for hot and cold water". */
  system: string;
  summary: string;
  /** Key information restated from confirmed product descriptions only. */
  facts: ProductFact[];
  range?: RangeGroup[];
  overview: string;
  highlights: string[];
  applications: string[];
  image: string;
  imageAlt: string;
  imageType: "representative" | "manufacturing";
};

export type Category = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  image?: string;
  imageAlt?: string;
  /** High-resolution banner for the category page header. */
  banner: string;
  comingSoon?: boolean;
  products: Product[];
};

export const categories: Category[] = [
  {
    slug: "plumbing",
    banner: factoryWide,
    name: "Plumbing Solutions",
    summary:
      "Pipe systems for hot and cold water supply in homes, buildings and commercial projects.",
    description:
      "Acoflex plumbing solutions cover the main pipe systems used for water supply inside buildings — from cold water lines to hot water distribution and flexible composite runs.",
    image: c5,
    imageAlt: "CPVC plumbing pipes laid into a brick wall chase",
    products: [
      {
        slug: "cpvc",
        name: "CPVC",
        fullName: "CPVC Pipes",
        system: "CPVC plumbing system for hot and cold water",
        summary: "Chlorinated PVC pipes for hot and cold water distribution.",
        facts: [
          { label: "Service", value: "Hot and cold water" },
          { label: "Jointing", value: "Solvent cement" },
        ],
        overview:
          "CPVC pipes are used for hot and cold potable water lines in residential and commercial buildings. They are joined with solvent cement, which keeps installation simple and quick on site.",
        highlights: [
          "For hot and cold water lines",
          "Solvent-cement jointing",
          "Suited to concealed and exposed runs",
        ],
        applications: [
          "Residential plumbing",
          "Apartments and housing projects",
          "Hotels and hospitals",
          "Commercial buildings",
        ],
        image: c5,
        imageAlt: "Bundle of cream CPVC pipes in a wall chase",
        imageType: "representative",
      },
      {
        slug: "upvc",
        name: "UPVC",
        fullName: "UPVC Plumbing Pipes",
        system: "UPVC plumbing system for cold water supply",
        summary: "Unplasticised PVC pipes for cold water supply and distribution.",
        facts: [{ label: "Service", value: "Cold water supply" }],
        overview:
          "UPVC pipes are a dependable choice for cold water supply inside and around buildings. They are lightweight to handle.",
        highlights: ["For cold water supply", "Lightweight and easy to handle"],
        applications: [
          "Cold water lines in buildings",
          "Overhead tank connections",
          "Outdoor water supply",
          "Commercial and institutional projects",
        ],
        image: testing,
        imageAlt: "Pipes on an inspection line at the plant",
        imageType: "manufacturing",
      },
      {
        slug: "ppr-c",
        name: "PPR-C",
        fullName: "PPR-C Pipes",
        system: "PPR-C plumbing system for hot and cold water",
        summary: "Polypropylene random copolymer pipes for hot and cold water.",
        facts: [
          { label: "Service", value: "Hot and cold water" },
          { label: "Jointing", value: "Heat fusion" },
        ],
        overview:
          "PPR-C pipes are joined by heat fusion, creating a continuous, homogeneous joint between pipe and fitting. They are used for hot and cold water distribution in buildings.",
        highlights: ["Heat-fusion jointing", "For hot and cold water", "Homogeneous joints"],
        applications: [
          "Residential plumbing",
          "Commercial buildings",
          "Hot water distribution",
          "Building services",
        ],
        image: c6,
        imageAlt: "Pipe sections measured with vernier calipers",
        imageType: "representative",
      },
      {
        slug: "multilayer-composite-pipe",
        name: "Multilayer Composite Pipe",
        fullName: "Multilayer Composite Pipe",
        system: "Multilayer composite piping for hot and cold water",
        summary: "Polymer pipes with a bonded metal layer, flexible yet able to hold their shape.",
        facts: [{ label: "Service", value: "Hot and cold water" }],
        overview:
          "Multilayer composite pipes combine inner and outer polymer layers with a bonded metal layer between them. The pipe bends by hand and holds its shape, which reduces the number of fittings needed on a run.",
        highlights: ["Bends and holds its shape", "Fewer fittings per run"],
        applications: [
          "Hot and cold water supply",
          "Renovation and retrofit work",
          "Residential plumbing",
          "Building services",
        ],
        image: b6,
        imageAlt: "Pipe processing equipment at the plant",
        imageType: "manufacturing",
      },
    ],
  },
  {
    slug: "drainage",
    banner: pipeStock,
    name: "Drainage Solutions",
    summary: "Soil, waste, rainwater and underground drainage systems.",
    description:
      "Drainage solutions for buildings, sewerage and storm water — designed to carry waste and rainwater away.",
    image: c2,
    imageAlt: "Grey SWR drainage pipes and fittings fixed to a concrete wall",
    products: [
      {
        slug: "swr-piping-system",
        name: "SWR Piping System",
        fullName: "SWR Piping System",
        system: "SWR drainage system for soil, waste and rainwater",
        summary: "Soil, waste and rainwater pipes and fittings for buildings.",
        facts: [{ label: "Service", value: "Soil, waste and rainwater" }],
        overview:
          "The SWR piping system carries soil, waste and rainwater from buildings. Pipes and fittings are designed to work together as one drainage system in residential and commercial construction.",
        highlights: ["Soil, waste and rainwater", "Complete pipe and fitting system"],
        applications: [
          "Residential buildings",
          "Commercial complexes",
          "Rainwater down-takes",
          "Institutional buildings",
        ],
        image: c2,
        imageAlt: "Drainage pipes and bends installed on a wall",
        imageType: "representative",
      },
      {
        slug: "foamcore-pipes",
        name: "Foamcore Pipes",
        fullName: "Foamcore Pipes",
        system: "Foamcore pipes for non-pressure drainage",
        summary: "Lightweight PVC pipes with a foamed core for non-pressure drainage.",
        facts: [{ label: "Service", value: "Non-pressure drainage and sewerage" }],
        overview:
          "Foamcore pipes have a foamed core layer between solid inner and outer layers. The construction makes the pipe lighter to handle while serving non-pressure drainage and sewerage lines.",
        highlights: [
          "Foamed core construction",
          "Lighter to handle and install",
          "For non-pressure applications",
        ],
        applications: [
          "Building drainage",
          "Sewerage lines",
          "Storm water drainage",
          "Ventilation lines",
        ],
        image: testingLine,
        imageAlt: "Pipes on a roller line at the plant",
        imageType: "manufacturing",
      },
      {
        slug: "dwc-pipes",
        name: "DWC Pipes",
        fullName: "DWC Pipes",
        system: "Double-wall corrugated pipes for underground drainage",
        summary: "Double-wall corrugated pipes for underground drainage and ducting.",
        facts: [
          { label: "Service", value: "Sewerage, storm water and cable ducting" },
          { label: "Installation", value: "Underground" },
        ],
        overview:
          "DWC pipes have a corrugated outer wall for stiffness and a smooth inner wall for flow. They are used underground for sewerage, storm water drainage and cable ducting.",
        highlights: ["Corrugated outer wall", "Smooth inner wall", "For underground installation"],
        applications: [
          "Sewerage networks",
          "Storm water drainage",
          "Cable ducting",
          "Road and infrastructure projects",
        ],
        image: factoryWide,
        imageAlt: "Pipe extrusion lines at the plant",
        imageType: "manufacturing",
      },
    ],
  },
  {
    slug: "agriculture",
    banner: testing,
    name: "Agriculture Pipes",
    summary: "Column and pressure pipes for borewells, irrigation and farm water supply.",
    description:
      "Pipes for drawing water from borewells and moving it across fields — built for the everyday demands of agricultural water supply.",
    image: c4,
    imageAlt: "Black irrigation pipeline running through a green crop field",
    products: [
      {
        slug: "upvc-column-pipes",
        name: "UPVC Column Pipes",
        fullName: "UPVC Column Pipes",
        system: "UPVC column pipes for submersible pump installations",
        summary: "Threaded column pipes for submersible pumps in borewells.",
        facts: [
          { label: "Service", value: "Borewell submersible pumps" },
          { label: "Jointing", value: "Threaded" },
        ],
        overview:
          "UPVC column pipes connect submersible pumps to the surface in borewells. They are threaded for straightforward assembly and are much lighter to lower and lift than metal pipes.",
        highlights: [
          "For submersible pump installations",
          "Threaded joints",
          "Lighter than metal column pipes",
        ],
        applications: [
          "Agricultural borewells",
          "Domestic borewells",
          "Drinking water schemes",
          "Industrial water supply",
        ],
        image: b5,
        imageAlt: "Pipe on a socketing machine at the plant",
        imageType: "manufacturing",
      },
      {
        slug: "pvc-pressure-pipes",
        name: "PVC Pressure Pipes",
        fullName: "PVC Pressure Pipes",
        system: "PVC pressure pipes for irrigation and water supply",
        summary: "PVC pipes for irrigation and water supply under pressure.",
        facts: [
          { label: "Service", value: "Irrigation and water supply" },
          { label: "Jointing", value: "Socketed ends" },
        ],
        overview:
          "PVC pressure pipes carry water from source to field and are used in irrigation networks and rural water supply. They are supplied with socketed ends for jointing on site.",
        highlights: [
          "For irrigation and water supply",
          "Socketed ends",
          "Lightweight to transport and lay",
        ],
        applications: [
          "Farm irrigation",
          "Rural water supply",
          "Sprinkler mains",
          "Water distribution lines",
        ],
        image: c4,
        imageAlt: "Irrigation pipeline with sprinklers in a crop field",
        imageType: "representative",
      },
    ],
  },
  {
    slug: "storage-water-tanks",
    banner: factoryWide,
    name: "Storage Water Tanks",
    summary: "A new range of water storage tanks is on the way.",
    description:
      "Acoflex is preparing a range of storage water tanks. Contact the team to register interest and be informed when the range launches.",
    comingSoon: true,
    products: [],
  },
];

export const allProducts = categories.flatMap((category) =>
  category.products.map((product) => ({ ...product, category })),
);

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProduct(categorySlug: string, productSlug: string) {
  return getCategory(categorySlug)?.products.find((product) => product.slug === productSlug);
}

/* ------------------------------------------------------------------
 * Company
 * ------------------------------------------------------------------ */

/**
 * Production stages at the plant. Stages without a suitable photo use a
 * simple line diagram instead (`diagram`), drawn in the brand palette.
 */
export const processSteps: {
  name: string;
  note: string;
  image?: string;
  mobileImage?: string;
  diagram?: "calibration" | "marking";
}[] = [
  { name: "Extrusion", note: "Automated extrusion lines", image: factoryWide, mobileImage: factoryWideMobile },
  {
    name: "Calibration and cooling",
    note: "Sizing the pipe as it is formed",
    diagram: "calibration",
  },
  { name: "Pipe marking", note: "In-line product marking", diagram: "marking" },
  { name: "Socketing", note: "Forming the pipe ends", image: b5 },
  { name: "Quality testing", note: "Checks at the in-house lab", image: b6 },
  { name: "Raw material storage", note: "Silo storage at the plant", image: b7 },
  { name: "Finished goods storage", note: "Stock held at the factory", image: pipeStock },
];

export const strengths = [
  { title: "Automated extrusion", copy: "Pipe extrusion lines at the Ambala plant." },
  { title: "In-house testing lab", copy: "Quality checks carried out at the plant." },
  { title: "Factory inventory", copy: "Finished goods stored at the factory." },
  { title: "Technical information", copy: "Product and technical details shared on request." },
];

export const dealerBenefits = [
  { title: "Direct factory pricing", copy: "Buy directly from the manufacturer." },
  { title: "Ready inventory", copy: "Finished goods held at the factory." },
  { title: "Logistics support", copy: "Support with dispatch for dealer orders." },
  { title: "Marketing collateral", copy: "Branding material for your outlet." },
];

export const faqs = [
  {
    question: "Where can I find sizes and pressure ratings?",
    answer:
      "Detailed technical data for each product is being prepared for publication. In the meantime, contact the team with your application and they will share the correct specification.",
  },
  {
    question: "How are products tested?",
    answer:
      "Acoflex has an in-house testing lab at its plant. Details of testing and quality documentation for a specific product are available on request.",
  },
  {
    question: "What is the delivery time for bulk orders?",
    answer:
      "Delivery depends on the product and order requirements. Contact the team to confirm availability and timing.",
  },
  {
    question: "When will storage water tanks be available?",
    answer:
      "The storage water tank range is coming soon. Get in touch to register interest and you will be informed when it launches.",
  },
];

export const services = [
  "Bulk wholesale supply",
  "Institutional project supply",
  "Dealer and distributor supply",
];

export const contact = {
  company: "Saiyanm Industries Pvt. Ltd.",
  address:
    "Vill Simbla (Behind Hanuman Mandir), P.O., Teh. Barara, Distt. Ambala, Haryana 133201, India",
  emails: ["contact@acoflexpvc.com", "info@acoflexpvc.com"],
  hours: "Monday–Saturday, 8:00–17:30",
};
