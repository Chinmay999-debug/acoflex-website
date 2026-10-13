import logo from "@/assets/acoflex-logo.png";
import factoryWide from "@/assets/bakcground-image-factory.webp";
import factoryWideMobile from "@/assets/bakcground-image-factory-mobile.webp";
import factoryHeroMobile from "@/assets/factory-hero-mobile.webp";
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

/**
 * Maps known asset URLs (seeded paths like `/assets/c5.webp`) or local file identifiers
 * to the bundled static asset import URLs.
 */
const assetMap: Record<string, string> = {
  logo,
  factoryWide,
  factoryWideMobile,
  factoryHeroMobile,
  testing,
  testingMobile,
  testingLine,
  testingLineMobile,
  pipeStock,
  socketing: b5,
  testingRig: b6,
  silos: b7,
  "/assets/acoflex-logo.png": logo,
  "/assets/bakcground-image-factory.webp": factoryWide,
  "/assets/bakcground-image-factory-mobile.webp": factoryWideMobile,
  "/assets/factory-hero-mobile.webp": factoryHeroMobile,
  "/assets/pipe-testing.webp": testing,
  "/assets/pipe-testing-mobile.webp": testingMobile,
  "/assets/pipe-testing-2.webp": testingLine,
  "/assets/pipe-testing-2-mobile.webp": testingLineMobile,
  "/assets/pipe-stock.webp": pipeStock,
  "/assets/c2.webp": c2,
  "/assets/c4.webp": c4,
  "/assets/c5.webp": c5,
  "/assets/c6.webp": c6,
  "/assets/b5.webp": b5,
  "/assets/b6.webp": b6,
  "/assets/b7.webp": b7,
};

export function resolveMediaUrl(url: string | null | undefined, fallback: string = ""): string {
  if (!url) return fallback;
  if (assetMap[url]) return assetMap[url];
  // If it's already an absolute HTTP/HTTPS URL (e.g. from Supabase Storage CDN)
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return assetMap[url] ?? url;
}
