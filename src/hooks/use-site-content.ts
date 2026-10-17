import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  categories as fallbackCategories,
  contact as fallbackContact,
  faqs as fallbackFaqs,
  strengths as fallbackStrengths,
  services as fallbackServices,
  dealerBenefits as fallbackDealerBenefits,
  processSteps as fallbackProcessSteps,
  type Category,
  type Product,
} from "@/lib/site-data";
import { resolveMediaUrl } from "@/lib/media";

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

export interface PublishedSiteSettings {
  company: string;
  address: string;
  phone?: string;
  emails: string[];
  hours: string;
  notice_bar?: {
    location?: string;
    hours?: string;
    email?: string;
    phone?: string;
  };
  social_links?: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  footer?: {
    tagline?: string;
    copyright?: string;
    origin?: string;
  };
}

export interface PublishedPageContent {
  id?: string;
  page_slug: string;
  version: "published";
  content: Record<string, unknown>;
  updated_at?: string;
}

/* ------------------------------------------------------------------
 * Fetchers
 * ------------------------------------------------------------------ */

function sanitizeEmail(email?: string): string {
  if (!email || typeof email !== "string") return "acoflexpvc@gmail.com";
  const trimmed = email.trim();
  if (trimmed.toLowerCase().includes("acoflexpvc.com")) {
    return "acoflexpvc@gmail.com";
  }
  return trimmed;
}

function sanitizeEmails(emails?: string[]): string[] {
  if (!Array.isArray(emails) || emails.length === 0) {
    return ["acoflexpvc@gmail.com"];
  }
  const filtered = emails
    .map((e) => (typeof e === "string" ? sanitizeEmail(e) : ""))
    .filter(Boolean);
  const unique = Array.from(new Set(filtered));
  return unique.length > 0 ? unique : ["acoflexpvc@gmail.com"];
}

/**
 * Fetch published site settings from Supabase, falling back to static site data.
 */
export async function fetchPublishedSiteSettings(): Promise<PublishedSiteSettings> {
  const fallback: PublishedSiteSettings = {
    company: fallbackContact.company,
    address: fallbackContact.address,
    phone: fallbackContact.phone,
    emails: [...fallbackContact.emails],
    hours: fallbackContact.hours,
    notice_bar: {
      location: "Barara, Ambala, Haryana",
      hours: fallbackContact.hours,
      email: fallbackContact.emails[0],
      phone: fallbackContact.phone,
    },
    social_links: {
      whatsapp: fallbackContact.socialLinks.whatsapp,
      facebook: fallbackContact.socialLinks.facebook,
      instagram: fallbackContact.socialLinks.instagram,
      linkedin: fallbackContact.socialLinks.linkedin,
      youtube: fallbackContact.socialLinks.youtube,
    },
    footer: {
      tagline: "Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.",
      copyright: "Acoflex",
      origin: "Made in India",
    },
  };

  if (!isSupabaseConfigured || !supabase) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("data")
      .eq("setting_key", "global")
      .eq("version", "published")
      .maybeSingle();

    if (error || !data || !data.data) {
      if (error)
        console.warn("Supabase site_settings query failed, using fallback:", error.message);
      return fallback;
    }

    const d = data.data as Partial<PublishedSiteSettings>;
    const rawEmails = Array.isArray(d.emails) && d.emails.length > 0 ? d.emails : fallback.emails;
    const sanitizedEmails = sanitizeEmails(rawEmails);
    const noticeEmail = sanitizeEmail(d.notice_bar?.email || fallback.notice_bar?.email);

    return {
      company: d.company || fallback.company,
      address: d.address || fallback.address,
      phone: d.phone || fallback.phone,
      emails: sanitizedEmails,
      hours: d.hours || fallback.hours,
      notice_bar: {
        location: d.notice_bar?.location || fallback.notice_bar?.location,
        hours: d.notice_bar?.hours || fallback.notice_bar?.hours,
        email: noticeEmail,
        phone: d.notice_bar?.phone || fallback.notice_bar?.phone,
      },
      social_links: {
        whatsapp: d.social_links?.whatsapp ?? fallback.social_links?.whatsapp,
        facebook: d.social_links?.facebook ?? fallback.social_links?.facebook,
        instagram: d.social_links?.instagram ?? fallback.social_links?.instagram,
        linkedin: d.social_links?.linkedin ?? fallback.social_links?.linkedin,
        youtube: d.social_links?.youtube ?? fallback.social_links?.youtube,
      },
      footer: {
        tagline: d.footer?.tagline || fallback.footer?.tagline,
        copyright: d.footer?.copyright || fallback.footer?.copyright,
        origin: d.footer?.origin || fallback.footer?.origin,
      },
    };
  } catch (err) {
    console.warn("Unexpected error fetching published site settings, using fallback:", err);
    return fallback;
  }
}

/**
 * Fetch published page content by slug from Supabase, with automatic fallback.
 */
export async function fetchPublishedPageContent(
  slug: string,
): Promise<{ content: Record<string, unknown>; isFallback: boolean }> {
  // Built-in fallback map for standard pages
  const fallbackMap: Record<string, Record<string, unknown>> = {
    home: {
      hero: {
        kicker: "Pipe manufacturer · Ambala, Haryana",
        title: "Pipe systems for plumbing, drainage and agriculture",
        lede: "Acoflex manufactures CPVC, UPVC, PPR-C, SWR, drainage and agricultural pipes at its plant in Ambala, Haryana.",
        cta_primary: { label: "Explore products", to: "/products" },
        cta_secondary: { label: "Contact sales", to: "/contact" },
      },
      strengths: fallbackStrengths,
    },
    about: {
      hero: {
        title: "About Acoflex",
        intro:
          "Acoflex manufactures plumbing, drainage and agriculture pipe systems at its plant in Barara, Ambala, Haryana.",
      },
      services: fallbackServices,
    },
    manufacturing: {
      hero: {
        title: "Manufacturing",
        intro:
          "Production at the Acoflex plant — from raw material storage through extrusion, calibration, marking and testing to finished goods storage.",
      },
      process_steps: fallbackProcessSteps,
    },
    dealers: {
      hero: {
        title: "Dealers and distributors",
        intro:
          "Acoflex welcomes enquiries from wholesalers, distributors and project buyers interested in supplying its pipe systems.",
      },
      benefits: fallbackDealerBenefits,
    },
    faq: {
      hero: {
        title: "Frequently asked questions",
        intro: "Answers to common questions about our products, testing and supply.",
      },
      faqs: fallbackFaqs,
    },
    contact: {
      hero: {
        title: "Contact us",
        intro:
          "For product information, bulk or project supply and dealership enquiries, send us a short brief and the team will respond.",
      },
      map_embed_url:
        "https://www.google.com/maps?q=Simbla,+Barara,+Ambala,+Haryana+133201&output=embed",
    },
    products: {
      hero: {
        title: "Our products",
        intro:
          "Pipe systems for plumbing, drainage and agriculture, organised by application. Choose a category to see the full range.",
      },
      enquiry_band: {
        title: "Not sure which pipe you need?",
        copy: "Share your application and the team will recommend the right product and specification.",
      },
    },
  };

  const defaultContent = fallbackMap[slug] || {};

  if (!isSupabaseConfigured || !supabase) {
    return { content: defaultContent, isFallback: true };
  }

  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("content")
      .eq("page_slug", slug)
      .eq("version", "published")
      .maybeSingle();

    if (error || !data || !data.content) {
      if (error) console.warn(`Supabase page_content (${slug}) query failed:`, error.message);
      return { content: defaultContent, isFallback: true };
    }

    return { content: data.content as Record<string, unknown>, isFallback: false };
  } catch (err) {
    console.warn(`Unexpected error fetching page content for ${slug}:`, err);
    return { content: defaultContent, isFallback: true };
  }
}

/**
 * Fetch all published categories joined with published products from Supabase,
 * falling back seamlessly to `categories` from `site-data.ts`.
 */
export async function fetchPublishedCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return fallbackCategories;
  }

  try {
    // Fetch categories ordered by sort_order
    const { data: dbCategories, error: catError } = await supabase
      .from("product_categories")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (catError || !dbCategories || dbCategories.length === 0) {
      if (catError) console.warn("Supabase product_categories query failed:", catError.message);
      return fallbackCategories;
    }

    // Fetch products ordered by sort_order
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (prodError || !dbProducts) {
      console.warn("Supabase products query failed, falling back to static:", prodError?.message);
      return fallbackCategories;
    }

    // Map DB records into the frontend Category & Product shapes with asset fallbacks
    const mappedCategories: Category[] = dbCategories.map((c) => {
      const fallbackCat = fallbackCategories.find((fc) => fc.slug === c.slug);
      const catProducts: Product[] = dbProducts
        .filter((p) => p.category_id === c.id)
        .map((p) => {
          const fallbackProd = fallbackCat?.products.find((fp) => fp.slug === p.slug);
          return {
            slug: p.slug,
            name: p.name,
            fullName: p.full_name || p.name,
            system: p.system || fallbackProd?.system || "",
            summary: p.summary || fallbackProd?.summary || "",
            overview: p.overview || fallbackProd?.overview || "",
            facts:
              Array.isArray(p.facts) && p.facts.length > 0 ? p.facts : fallbackProd?.facts || [],
            highlights:
              Array.isArray(p.highlights) && p.highlights.length > 0
                ? p.highlights
                : fallbackProd?.highlights || [],
            applications:
              Array.isArray(p.applications) && p.applications.length > 0
                ? p.applications
                : fallbackProd?.applications || [],
            range:
              Array.isArray(p.range_groups) && p.range_groups.length > 0
                ? p.range_groups
                : fallbackProd?.range,
            image: resolveMediaUrl(p.image_url, fallbackProd?.image || ""),
            imageAlt: p.image_alt || fallbackProd?.imageAlt || p.name,
            imageType:
              (p.image_type as "representative" | "manufacturing") ||
              fallbackProd?.imageType ||
              "representative",
          };
        });

      return {
        slug: c.slug,
        name: c.name,
        summary: c.summary,
        description: c.description,
        banner: resolveMediaUrl(c.banner_url, fallbackCat?.banner || ""),
        image: resolveMediaUrl(c.image_url, fallbackCat?.image),
        imageAlt: c.image_alt || fallbackCat?.imageAlt,
        comingSoon: c.coming_soon ?? false,
        products: catProducts.length > 0 ? catProducts : fallbackCat?.products || [],
      };
    });

    return mappedCategories.length > 0 ? mappedCategories : fallbackCategories;
  } catch (err) {
    console.warn("Unexpected error fetching product categories from Supabase:", err);
    return fallbackCategories;
  }
}

/* ------------------------------------------------------------------
 * React Hooks (backed by TanStack React Query)
 * ------------------------------------------------------------------ */

/**
 * Hook for global site settings (contact info, address, notice bar, footer).
 */
export function usePublishedSiteSettings() {
  return useQuery({
    queryKey: ["site-settings", "published"],
    queryFn: fetchPublishedSiteSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: {
      company: fallbackContact.company,
      address: fallbackContact.address,
      phone: fallbackContact.phone,
      emails: [...fallbackContact.emails],
      hours: fallbackContact.hours,
      notice_bar: {
        location: "Barara, Ambala, Haryana",
        hours: fallbackContact.hours,
        email: fallbackContact.emails[0],
        phone: fallbackContact.phone,
      },
      social_links: {
        whatsapp: fallbackContact.socialLinks.whatsapp,
        facebook: fallbackContact.socialLinks.facebook,
        instagram: fallbackContact.socialLinks.instagram,
        linkedin: fallbackContact.socialLinks.linkedin,
        youtube: fallbackContact.socialLinks.youtube,
      },
      footer: {
        tagline: "Plumbing, drainage and agriculture pipe systems manufactured in Ambala, Haryana.",
        copyright: "Acoflex",
        origin: "Made in India",
      },
    },
  });
}

/**
 * Hook for published page content by slug.
 */
export function usePublishedPageContent(slug: string) {
  return useQuery({
    queryKey: ["page-content", slug, "published"],
    queryFn: () => fetchPublishedPageContent(slug),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for published categories and products catalogue.
 */
export function usePublishedCategories() {
  return useQuery({
    queryKey: ["product-categories", "published"],
    queryFn: fetchPublishedCategories,
    staleTime: 1000 * 60 * 5,
    placeholderData: fallbackCategories,
  });
}

/**
 * Hook for a specific category by slug.
 */
export function usePublishedCategory(slug: string) {
  const { data: allCategories, ...rest } = usePublishedCategories();
  const category = allCategories?.find((c) => c.slug === slug);
  return {
    category: category ?? fallbackCategories.find((c) => c.slug === slug),
    allCategories: allCategories ?? fallbackCategories,
    ...rest,
  };
}

/**
 * Hook for a specific product by category slug and product slug.
 */
export function usePublishedProduct(categorySlug: string, productSlug: string) {
  const { category, allCategories, ...rest } = usePublishedCategory(categorySlug);
  const product = category?.products.find((p) => p.slug === productSlug);
  const fallbackCat = fallbackCategories.find((c) => c.slug === categorySlug);
  const fallbackProd = fallbackCat?.products.find((p) => p.slug === productSlug);

  return {
    category,
    product: product ?? fallbackProd,
    allCategories,
    ...rest,
  };
}

/**
 * Hook for all published products flattened across categories.
 */
export function usePublishedProducts() {
  const { data: allCategories, ...rest } = usePublishedCategories();
  const categoriesList = allCategories ?? fallbackCategories;
  const products = categoriesList.flatMap((category) =>
    category.products.map((product) => ({ ...product, category })),
  );

  return {
    products,
    categories: categoriesList,
    ...rest,
  };
}
