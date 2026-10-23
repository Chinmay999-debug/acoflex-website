// src/components/hero/HeroSlider.tsx
import { useEffect, useState, type FocusEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useHeroSlides, type HeroSlide } from "@/hooks/useHeroSlides";

const AUTOPLAY_MS = 5000;

// Controls sit inside the hero (the section clips overflow) above the gold rule.
const controlClass =
  "size-10 border-white/35 bg-forest/70 text-white hover:bg-white/10 hover:text-white";

interface HeroSliderProps {
  /** Rendered while slides load, when the query fails, or when nothing is published. */
  fallback: ReactNode;
  /** Page heading announced to assistive tech when the first slide has no heading. */
  pageHeading: string;
}

/**
 * HeroSlider – homepage carousel of published hero slides (public.published_hero_slides:
 * active, non-deleted, ordered by sort_order). Renders `fallback` unless at least one slide loads.
 */
export function HeroSlider({ fallback, pageHeading }: HeroSliderProps) {
  const { data: slides, isLoading, isError } = useHeroSlides();
  const [api, setApi] = useState<CarouselApi>();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const count = slides?.length ?? 0;
  const canAutoplay = count > 1 && !reducedMotion;
  const autoplay = canAutoplay && !userPaused && !hovered && !focused;

  // Advance every AUTOPLAY_MS; any slide change (autoplay, arrows, swipe) restarts the timer.
  useEffect(() => {
    if (!api || !autoplay) return undefined;
    let timer = setTimeout(() => api.scrollNext(), AUTOPLAY_MS);
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => api.scrollNext(), AUTOPLAY_MS);
    };
    api.on("select", restart);
    return () => {
      clearTimeout(timer);
      api.off("select", restart);
    };
  }, [api, autoplay]);

  if (isLoading || isError || !slides || slides.length === 0) {
    return <>{fallback}</>;
  }

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <section
      className="relative overflow-hidden bg-forest text-white"
      aria-label="Featured"
      // Mouse only: touch devices emit enter without leave, which would stop autoplay for good.
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
    >
      {!slides[0]?.heading && <h1 className="sr-only">{pageHeading}</h1>}
      <Carousel opts={{ loop: count > 1 }} setApi={setApi}>
        <CarouselContent className="ml-0">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              className="relative pl-0"
              aria-label={`${index + 1} of ${count}`}
            >
              <HeroSlideView slide={slide} isFirst={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {count > 1 && (
          <div className="site-container pointer-events-none absolute inset-x-0 bottom-6 flex justify-end gap-2 sm:bottom-8">
            {canAutoplay && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`pointer-events-auto rounded-full ${controlClass}`}
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setUserPaused((paused) => !paused)}
              >
                {userPaused ? <Play /> : <Pause />}
              </Button>
            )}
            <CarouselPrevious
              className={`pointer-events-auto static translate-y-0 ${controlClass}`}
            />
            <CarouselNext className={`pointer-events-auto static translate-y-0 ${controlClass}`} />
          </div>
        )}
      </Carousel>
      <div className="relative h-1 bg-gold" />
    </section>
  );
}

function HeroSlideView({ slide, isFirst }: { slide: HeroSlide; isFirst: boolean }) {
  const Heading = isFirst ? "h1" : "h2";
  return (
    <>
      <picture className="absolute inset-0">
        {slide.mobile_image && <source media="(max-width: 1023px)" srcSet={slide.mobile_image} />}
        <img
          src={slide.desktop_image}
          alt={slide.alt_text ?? ""}
          loading={isFirst ? "eager" : "lazy"}
          fetchPriority={isFirst ? "high" : "auto"}
          className="photo"
        />
      </picture>
      {/* Same left-to-right forest overlay the static hero uses, so copy stays legible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--forest)_92%,transparent)_0%,color-mix(in_oklab,var(--forest)_78%,transparent)_60%,color-mix(in_oklab,var(--forest)_35%,transparent)_100%)]"
      />
      <div className="site-container relative grid items-center pb-32 pt-12 sm:pb-40 sm:pt-16 lg:min-h-[38rem] lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-6">
          {slide.heading && <Heading className="h-hero">{slide.heading}</Heading>}
          {slide.description && (
            <p className="lede mt-6 text-white/90 lg:text-white/75">{slide.description}</p>
          )}
          <SlideCta slide={slide} />
        </div>
      </div>
    </>
  );
}

function SlideCta({ slide }: { slide: HeroSlide }) {
  if (!slide.cta_label || !slide.cta_url) return null;
  const label = (
    <>
      {slide.cta_label} <ArrowRight />
    </>
  );
  return (
    <div className="mt-9 flex flex-wrap gap-3">
      <Button asChild variant="gold" size="lg">
        {/* rpc_*_hero_slide only accept "/path" or "https://…" CTA URLs. */}
        {slide.cta_url.startsWith("/") ? (
          <Link to={slide.cta_url}>{label}</Link>
        ) : (
          <a href={slide.cta_url}>{label}</a>
        )}
      </Button>
    </div>
  );
}

export default HeroSlider;
