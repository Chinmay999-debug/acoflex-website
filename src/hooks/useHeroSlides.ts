// src/hooks/useHeroSlides.ts
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface HeroSlide {
  id: string;
  name: string;
  desktop_image: string;
  mobile_image: string | null;
  heading: string | null;
  description: string | null;
  cta_label: string | null;
  cta_url: string | null;
  alt_text: string | null;
  sort_order: number;
}

/**
 * Fetch published hero slides from the public view.
 * Returns loading, error and data states for consumption in UI.
 */
export function useHeroSlides() {
  return useQuery<HeroSlide[], Error>({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Supabase not configured");
      }
      const { data, error } = await supabase
        .from("published_hero_slides")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        throw new Error(error.message);
      }
      // Supabase returns typed rows; ensure they match the interface.
      return data as HeroSlide[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
