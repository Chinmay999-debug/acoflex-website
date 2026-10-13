import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin/pages/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Edit Page — Acoflex` }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminPageDetail,
});

interface PageContentRecord {
  id?: string;
  page_slug: string;
  version: "published" | "draft";
  content: Record<string, unknown>;
  isDraft: boolean;
}

const pageTitles: Record<string, string> = {
  home: "Home Page",
  about: "About Us",
  products: "Products Overview",
  manufacturing: "Manufacturing Plant",
  quality: "Quality & Testing",
  infrastructure: "Infrastructure",
  dealers: "Dealers & Distributors",
  faq: "Frequently Asked Questions",
  resources: "Resources & Brochures",
  contact: "Contact Us & Location",
};

function AdminPageDetail() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();

  const [contentPayload, setContentPayload] = useState<Record<string, unknown>>({});
  const [initialContent, setInitialContent] = useState<Record<string, unknown>>({});
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch current content (Draft preferred, published fallback)
  const {
    data: pageData,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<PageContentRecord>({
    queryKey: ["admin_page_content", slug],
    queryFn: async () => {
      if (!supabase) throw new Error("Database connection is not available.");

      const { data: draftData, error: draftErr } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_slug", slug)
        .eq("version", "draft")
        .maybeSingle();

      if (draftErr) throw draftErr;
      if (draftData) return { ...draftData, isDraft: true };

      const { data: pubData, error: pubErr } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_slug", slug)
        .eq("version", "published")
        .maybeSingle();

      if (pubErr) throw pubErr;
      if (!pubData) throw new Error(`No content found for page: ${slug}`);
      return { ...pubData, isDraft: false };
    },
  });

  useEffect(() => {
    if (pageData?.content) {
      setContentPayload(pageData.content);
      setInitialContent(pageData.content);
    }
  }, [pageData]);

  // Compute if there are unsaved working modifications
  const isDirty = useMemo(() => {
    if (!initialContent || Object.keys(initialContent).length === 0) return false;
    return JSON.stringify(contentPayload) !== JSON.stringify(initialContent);
  }, [contentPayload, initialContent]);

  // Prevent accidental tab closure / navigation when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 2. Mutation to Save Draft
  const saveDraftMutation = useMutation({
    mutationFn: async (updatedContent: Record<string, unknown>) => {
      if (!supabase) throw new Error("Database connection is not available.");

      const { error: upsertErr } = await supabase.from("page_content").upsert(
        {
          page_slug: slug,
          version: "draft",
          content: updatedContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_slug,version" },
      );

      if (upsertErr) throw upsertErr;

      const { error: pageUpdateErr } = await supabase
        .from("pages")
        .update({
          has_unpublished_changes: true,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", slug);

      if (pageUpdateErr) throw pageUpdateErr;
      return true;
    },
    onSuccess: () => {
      setInitialContent(contentPayload);
      setStatusMessage({
        type: "success",
        text: "Changes saved as draft. When you are ready, click 'Publish Changes' to make them visible to website visitors.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin_page_content", slug] });
      queryClient.invalidateQueries({ queryKey: ["admin_pages_registry"] });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Unable to save changes: ${err.message}`,
      });
    },
  });

  // 3. Mutation to Publish Page via RPC
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Database connection is not available.");

      await supabase.from("page_content").upsert(
        {
          page_slug: slug,
          version: "draft",
          content: contentPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_slug,version" },
      );

      const { error: rpcErr } = await supabase.rpc("publish_page", {
        target_slug: slug,
      });

      if (rpcErr) throw rpcErr;
      return true;
    },
    onSuccess: () => {
      setInitialContent(contentPayload);
      setStatusMessage({
        type: "success",
        text: "Page published successfully! The live website is now updated with your latest changes.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin_page_content", slug] });
      queryClient.invalidateQueries({ queryKey: ["admin_pages_registry"] });
      queryClient.invalidateQueries({ queryKey: ["page-content", slug, "published"] });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Unable to publish page: ${err.message}`,
      });
    },
  });

  // Safe field updater helpers
  const handleHeroChange = (field: string, value: string) => {
    setContentPayload((prev) => ({
      ...prev,
      hero: {
        ...(prev.hero && typeof prev.hero === "object" ? prev.hero : {}),
        [field]: value,
      },
    }));
  };

  const handleTeaserChange = (sectionKey: string, field: string, value: string) => {
    setContentPayload((prev) => {
      const current =
        prev[sectionKey] && typeof prev[sectionKey] === "object"
          ? (prev[sectionKey] as Record<string, unknown>)
          : {};
      return {
        ...prev,
        [sectionKey]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleArrayItemChange = (arrayKey: string, index: number, field: string, value: string) => {
    setContentPayload((prev) => {
      const arr = Array.isArray(prev[arrayKey])
        ? [...(prev[arrayKey] as Record<string, unknown>[])]
        : [];
      if (arr[index]) {
        arr[index] = {
          ...arr[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        [arrayKey]: arr,
      };
    });
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    saveDraftMutation.mutate(contentPayload);
  };

  const handlePublish = () => {
    if (
      window.confirm(
        `Are you ready to publish changes for ${pageTitles[slug] || slug}? These changes will immediately replace the live website content.`,
      )
    ) {
      setStatusMessage(null);
      publishMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
        <p className="font-semibold">Unable to load page content</p>
        <p className="text-sm mt-1">{(fetchError as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const hero =
    contentPayload.hero && typeof contentPayload.hero === "object"
      ? (contentPayload.hero as Record<string, unknown>)
      : {};
  const publicPath = slug === "home" ? "/" : `/${slug}`;
  const friendlyName = pageTitles[slug] || slug;

  // Check section dirty flags for helpful UX
  const isSectionDirty = (sectionKey: string): boolean => {
    if (!initialContent) return false;
    return (
      JSON.stringify(contentPayload[sectionKey]) !== JSON.stringify(initialContent[sectionKey])
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Friendly Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to All Pages
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Edit {friendlyName}
            </h1>
            {/* 3 Explicit States: Dirty / Draft Saved / Published */}
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Changes not saved
              </span>
            ) : pageData?.isDraft ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                <Clock className="size-3" />
                Draft saved — not live yet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-3" />
                Published on website
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ExternalLink className="size-3.5" /> View Live Page
          </a>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending || publishMutation.isPending}
            className="gap-2 font-medium"
          >
            {saveDraftMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            variant="gold"
            size="default"
            onClick={handlePublish}
            disabled={publishMutation.isPending || saveDraftMutation.isPending}
            className="gap-2 font-semibold shadow-xs"
          >
            {publishMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Publish Changes
          </Button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
          )}
          <p className="font-medium">{statusMessage.text}</p>
        </div>
      )}

      {/* Main Form Fields */}
      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* Top Banner / Hero — Always open and prominent */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Top Banner & Headline</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                The main title and introductory paragraph visible at the top of this page.
              </p>
            </div>
            {isSectionDirty("hero") && (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Unsaved edits
              </span>
            )}
          </div>

          <div className="space-y-4">
            {hero.kicker !== undefined && (
              <div className="space-y-1.5">
                <Label htmlFor="hero-kicker">Small Top Tagline / Category Tag</Label>
                <Input
                  id="hero-kicker"
                  value={hero.kicker || ""}
                  onChange={(e) => handleHeroChange("kicker", e.target.value)}
                  placeholder="e.g. Pipe manufacturer · Ambala, Haryana"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="hero-title">Main Page Title *</Label>
              <Input
                id="hero-title"
                required
                value={hero.title || ""}
                onChange={(e) => handleHeroChange("title", e.target.value)}
                placeholder="Page Title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hero-intro">Introductory Description *</Label>
              <Textarea
                id="hero-intro"
                rows={3}
                required
                value={hero.lede || hero.intro || ""}
                onChange={(e) => {
                  if (hero.lede !== undefined) handleHeroChange("lede", e.target.value);
                  else handleHeroChange("intro", e.target.value);
                }}
                placeholder="Introductory paragraph..."
              />
            </div>
          </div>
        </div>

        {/* Collapsible Page Sections (Teasers & Content Blocks) */}
        <div className="space-y-4">
          {/* Home Page Teaser Sections in Accordion */}
          {slug === "home" && (
            <Accordion type="multiple" className="w-full space-y-4 border-none">
              {contentPayload.about_teaser && (
                <AccordionItem
                  value="about_teaser"
                  className="rounded-xl border border-border bg-card shadow-xs px-6 py-1"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base text-foreground">
                        "About Acoflex" Homepage Section
                      </span>
                      {isSectionDirty("about_teaser") && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Unsaved
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="about-teaser-title">Section Title</Label>
                      <Input
                        id="about-teaser-title"
                        value={String(
                          (contentPayload.about_teaser as Record<string, unknown>).title || "",
                        )}
                        onChange={(e) =>
                          handleTeaserChange("about_teaser", "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="about-teaser-copy">Description</Label>
                      <Textarea
                        id="about-teaser-copy"
                        rows={3}
                        value={String(
                          (contentPayload.about_teaser as Record<string, unknown>).copy || "",
                        )}
                        onChange={(e) => handleTeaserChange("about_teaser", "copy", e.target.value)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {contentPayload.quality_teaser && (
                <AccordionItem
                  value="quality_teaser"
                  className="rounded-xl border border-border bg-card shadow-xs px-6 py-1"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base text-foreground">
                        "Quality & Testing" Homepage Section
                      </span>
                      {isSectionDirty("quality_teaser") && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Unsaved
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="quality-teaser-title">Section Title</Label>
                      <Input
                        id="quality-teaser-title"
                        value={String(
                          (contentPayload.quality_teaser as Record<string, unknown>).title || "",
                        )}
                        onChange={(e) =>
                          handleTeaserChange("quality_teaser", "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quality-teaser-copy">Description</Label>
                      <Textarea
                        id="quality-teaser-copy"
                        rows={3}
                        value={String(
                          (contentPayload.quality_teaser as Record<string, unknown>).copy || "",
                        )}
                        onChange={(e) =>
                          handleTeaserChange("quality_teaser", "copy", e.target.value)
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {contentPayload.dealers_teaser && (
                <AccordionItem
                  value="dealers_teaser"
                  className="rounded-xl border border-border bg-card shadow-xs px-6 py-1"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base text-foreground">
                        "Become a Dealer" Homepage Section
                      </span>
                      {isSectionDirty("dealers_teaser") && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Unsaved
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dealers-teaser-title">Section Title</Label>
                      <Input
                        id="dealers-teaser-title"
                        value={String(
                          (contentPayload.dealers_teaser as Record<string, unknown>).title || "",
                        )}
                        onChange={(e) =>
                          handleTeaserChange("dealers_teaser", "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dealers-teaser-copy">Description</Label>
                      <Textarea
                        id="dealers-teaser-copy"
                        rows={3}
                        value={String(
                          (contentPayload.dealers_teaser as Record<string, unknown>).copy || "",
                        )}
                        onChange={(e) =>
                          handleTeaserChange("dealers_teaser", "copy", e.target.value)
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {/* Structured Lists / Items in Accordion Cards */}
          <Accordion type="multiple" className="w-full space-y-4 border-none">
            {Object.keys(contentPayload).map((key) => {
              const val = contentPayload[key];
              if (!Array.isArray(val) || key === "services") return null;

              const sectionLabel =
                key === "strengths"
                  ? "Key Strengths & Features"
                  : key === "benefits"
                    ? "Dealer & Distributor Benefits"
                    : key === "facilities"
                      ? "Infrastructure Facilities"
                      : key === "stages"
                        ? "Quality Testing Stages"
                        : key === "faqs"
                          ? "Questions & Answers (FAQs)"
                          : key === "markets"
                            ? "Market Sectors"
                            : key === "process_steps"
                              ? "Production Steps"
                              : key === "plant_areas"
                                ? "Plant Areas"
                                : key === "items"
                                  ? "Brochure & Resource Items"
                                  : key;

              const dirty = isSectionDirty(key);

              return (
                <AccordionItem
                  key={key}
                  value={key}
                  className="rounded-xl border border-border bg-card shadow-xs px-6 py-1"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base text-foreground">
                        {sectionLabel}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        ({val.length} {val.length === 1 ? "item" : "items"})
                      </span>
                      {dirty && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Unsaved
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-4">
                    {val.map((itemVal: unknown, idx: number) => {
                      if (typeof itemVal !== "object" || itemVal === null) return null;
                      const item = itemVal as Record<string, string | undefined>;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-muted/30 border border-border space-y-3"
                        >
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            Item #{idx + 1}
                          </span>

                          {item.question !== undefined && (
                            <div className="space-y-1">
                              <Label>Question</Label>
                              <Input
                                value={item.question || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(key, idx, "question", e.target.value)
                                }
                              />
                            </div>
                          )}

                          {item.answer !== undefined && (
                            <div className="space-y-1">
                              <Label>Answer</Label>
                              <Textarea
                                rows={2}
                                value={item.answer || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(key, idx, "answer", e.target.value)
                                }
                              />
                            </div>
                          )}

                          {item.title !== undefined && item.question === undefined && (
                            <div className="space-y-1">
                              <Label>Heading / Title</Label>
                              <Input
                                value={item.title || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(key, idx, "title", e.target.value)
                                }
                              />
                            </div>
                          )}

                          {item.name !== undefined && (
                            <div className="space-y-1">
                              <Label>Step Name</Label>
                              <Input
                                value={item.name || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(key, idx, "name", e.target.value)
                                }
                              />
                            </div>
                          )}

                          {item.note !== undefined && (
                            <div className="space-y-1">
                              <Label>Note / Details</Label>
                              <Textarea
                                rows={2}
                                value={item.note || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(key, idx, "note", e.target.value)
                                }
                              />
                            </div>
                          )}

                          {item.copy !== undefined && (
                            <div className="space-y-1">
                              <Label>Description</Label>
                              <Textarea
                                rows={2}
                                value={item.copy || ""}
                                onChange={(e) =>
                                  handleArrayItemChange(key, idx, "copy", e.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Contact Page Map Embed */}
        {slug === "contact" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Google Maps Location Link
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Embed URL for displaying interactive map on the contact page.
                </p>
              </div>
              {isSectionDirty("map_embed_url") && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Unsaved
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="map-url">Google Maps Embed URL</Label>
              <Input
                id="map-url"
                value={(contentPayload.map_embed_url as string) || ""}
                onChange={(e) =>
                  setContentPayload((prev) => ({ ...prev, map_embed_url: e.target.value }))
                }
                placeholder="https://www.google.com/maps/embed?..."
              />
            </div>
          </div>
        )}

        {/* Bottom Save & Publish Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="submit"
            variant="outline"
            disabled={saveDraftMutation.isPending || publishMutation.isPending}
            className="gap-2"
          >
            {saveDraftMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save Draft
          </Button>
          <Button
            type="button"
            variant="gold"
            onClick={handlePublish}
            disabled={publishMutation.isPending || saveDraftMutation.isPending}
            className="gap-2 font-semibold shadow-xs"
          >
            {publishMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Publish Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
