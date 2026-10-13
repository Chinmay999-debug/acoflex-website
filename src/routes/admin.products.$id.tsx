import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Code2,
  Image as ImageIcon,
  Clock,
  Settings2,
} from "lucide-react";
import { MediaPickerModal } from "@/components/admin-media-picker";

export const Route = createFileRoute("/admin/products/$id")({
  head: () => ({
    meta: [
      { title: "Edit Product — Acoflex CMS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminProductDetail,
});

interface ProductRecord {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  full_name: string;
  system: string;
  summary: string;
  overview: string;
  facts: Array<{ label: string; value: string }>;
  highlights: string[];
  applications: string[];
  range_groups: unknown[];
  image_url: string;
  image_alt: string;
  image_type: "representative" | "manufacturing";
  sort_order: number;
  is_published: boolean;
  [key: string]: unknown;
}

function AdminProductDetail() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<ProductRecord>>({
    name: "",
    full_name: "",
    slug: "",
    category_id: "",
    system: "",
    summary: "",
    overview: "",
    facts: [],
    highlights: [],
    applications: [],
    range_groups: [],
    image_url: "/placeholder.svg",
    image_alt: "Product image",
    image_type: "representative",
    sort_order: 10,
    is_published: false,
  });

  const [initialData, setInitialData] = useState<Partial<ProductRecord>>({});
  const [highlightsRaw, setHighlightsRaw] = useState("");
  const [applicationsRaw, setApplicationsRaw] = useState("");
  const [initialHighlightsRaw, setInitialHighlightsRaw] = useState("");
  const [initialApplicationsRaw, setInitialApplicationsRaw] = useState("");
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch available categories
  const { data: categories } = useQuery({
    queryKey: ["admin_categories_options"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from("product_categories")
        .select("id, name, slug")
        .order("sort_order");
      return data || [];
    },
  });

  // 2. Fetch product data (with staged draft if present)
  const {
    data: productData,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["admin_product_detail", id],
    enabled: !isNew,
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase client is not available.");

      // Fetch base product record
      const { data: baseProd, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (prodErr) throw prodErr;

      // Check if there is an active staged draft
      const { data: draftRecord } = await supabase
        .from("product_drafts")
        .select("*")
        .eq("product_id", id)
        .maybeSingle();

      if (draftRecord?.draft_data) {
        return {
          ...baseProd,
          ...draftRecord.draft_data,
          isDraftStaged: true,
        };
      }

      return {
        ...baseProd,
        isDraftStaged: false,
      };
    },
  });

  useEffect(() => {
    if (productData) {
      setFormData(productData);
      setInitialData(productData);
      const hText = productData.highlights ? productData.highlights.join("\n") : "";
      const aText = productData.applications ? productData.applications.join("\n") : "";
      setHighlightsRaw(hText);
      setInitialHighlightsRaw(hText);
      setApplicationsRaw(aText);
      setInitialApplicationsRaw(aText);
      setJsonText(JSON.stringify(productData, null, 2));
    } else if (isNew && categories && categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id }));
    }
  }, [productData, categories, isNew]);

  // Compute dirty working state
  const isDirty = useMemo(() => {
    if (isNew) {
      return Boolean(formData.name || formData.slug || formData.summary);
    }
    const dataChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    const rawChanged =
      highlightsRaw !== initialHighlightsRaw || applicationsRaw !== initialApplicationsRaw;
    return dataChanged || rawChanged;
  }, [
    isNew,
    formData,
    initialData,
    highlightsRaw,
    initialHighlightsRaw,
    applicationsRaw,
    initialApplicationsRaw,
  ]);

  // Warn before unload when dirty
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

  // 3. Mutation for creating a new product
  const createProductMutation = useMutation({
    mutationFn: async (payload: Partial<ProductRecord>) => {
      if (!supabase) throw new Error("Supabase client is not available.");

      const { data, error } = await supabase
        .from("products")
        .insert({
          category_id: payload.category_id,
          slug: payload.slug,
          name: payload.name,
          full_name: payload.full_name || payload.name,
          system: payload.system || "Acoflex Piping System",
          summary: payload.summary || "",
          overview: payload.overview || "",
          facts: payload.facts || [],
          highlights: payload.highlights || [],
          applications: payload.applications || [],
          range_groups: payload.range_groups || [],
          image_url: payload.image_url || "/placeholder.svg",
          image_alt: payload.image_alt || payload.name || "Product image",
          image_type: payload.image_type || "representative",
          sort_order: Number(payload.sort_order) || 10,
          is_published: false, // New products are staged unpublished
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newProd) => {
      queryClient.invalidateQueries({ queryKey: ["admin_products_with_drafts"] });
      navigate({ to: "/admin/products/$id", params: { id: newProd.id } });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Failed to create product: ${err.message}`,
      });
    },
  });

  // 4. Mutation for Saving Draft (upsert to product_drafts)
  const saveDraftMutation = useMutation({
    mutationFn: async (draftPayload: Record<string, unknown>) => {
      if (!supabase) throw new Error("Supabase client is not available.");
      if (isNew) throw new Error("Please create product first before staging drafts.");

      const { error } = await supabase.from("product_drafts").upsert(
        {
          product_id: id,
          draft_data: draftPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id" },
      );

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      setInitialData(formData);
      setInitialHighlightsRaw(highlightsRaw);
      setInitialApplicationsRaw(applicationsRaw);
      setStatusMessage({
        type: "success",
        text: "Draft staged successfully. Live public website remains on current published version.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin_product_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_products_with_drafts"] });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Failed to stage draft: ${err.message}`,
      });
    },
  });

  // 5. Mutation for Publishing Product (calls publish_product RPC)
  const publishMutation = useMutation({
    mutationFn: async (stagedPayload: Record<string, unknown>) => {
      if (!supabase) throw new Error("Supabase client is not available.");
      if (isNew) throw new Error("Product must be saved before publishing.");

      // First save the current form into product_drafts
      await supabase.from("product_drafts").upsert(
        {
          product_id: id,
          draft_data: stagedPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id" },
      );

      // Call secure publish_product RPC
      const { error } = await supabase.rpc("publish_product", {
        target_product_id: id,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      setInitialData(formData);
      setInitialHighlightsRaw(highlightsRaw);
      setInitialApplicationsRaw(applicationsRaw);
      setStatusMessage({
        type: "success",
        text: "Product published to live catalogue successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["admin_product_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_products_with_drafts"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories", "published"] });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Failed to publish product: ${err.message}`,
      });
    },
  });

  const getPayloadFromState = (): Record<string, unknown> => {
    const highlights = highlightsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const applications = applicationsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      ...formData,
      highlights,
      applications,
    };
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const payload = getPayloadFromState();

    if (isNew) {
      createProductMutation.mutate(payload);
    } else {
      saveDraftMutation.mutate(payload);
    }
  };

  const handlePublish = () => {
    if (isNew) {
      alert("Please save the product first before publishing.");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to publish "${formData.name}"? It will immediately appear on the live website.`,
      )
    ) {
      setStatusMessage(null);
      const payload = getPayloadFromState();
      publishMutation.mutate(payload);
    }
  };

  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      setFormData(parsed);
      setHighlightsRaw(parsed.highlights ? parsed.highlights.join("\n") : "");
      setApplicationsRaw(parsed.applications ? parsed.applications.join("\n") : "");
      setStatusMessage({
        type: "success",
        text: "JSON structure parsed and applied to draft working state.",
      });
      setShowJsonInspector(false);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON syntax.");
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && fetchError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
        <p className="font-semibold">Error loading product</p>
        <p className="text-sm mt-1">{(fetchError as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to Products
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isNew ? "New Product" : `Edit: ${formData.name}`}
            </h2>
            {/* 3 Explicit States */}
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Changes not saved
              </span>
            ) : productData?.isDraftStaged ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                <Clock className="size-3" />
                Draft saved — not live yet
              </span>
            ) : formData.is_published ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-3" />
                Published on website
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                Unpublished draft
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleSaveDraft}
            disabled={
              saveDraftMutation.isPending ||
              createProductMutation.isPending ||
              publishMutation.isPending
            }
            className="gap-2 font-medium"
          >
            {(saveDraftMutation.isPending || createProductMutation.isPending) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            <Save className="size-4" />
            {isNew ? "Create Product" : "Save Draft"}
          </Button>

          {!isNew && (
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
          )}
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
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

      {/* Product Form */}
      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* Core Product Identity Card (Visible) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-semibold text-foreground">Basic Product Information</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              The primary product name, display title, and category shown across the website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Product Name *</Label>
              <Input
                id="prod-name"
                required
                value={formData.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name: val,
                    // If creating new, auto-fill slug if slug wasn't manually customized
                    ...(isNew && !prev.slug
                      ? { slug: val.toLowerCase().replace(/[^a-z0-9_-]/g, "-") }
                      : {}),
                  }));
                }}
                placeholder="e.g. CPVC Pipes"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-category">Product Category *</Label>
              <select
                id="prod-category"
                required
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.category_id || ""}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-fullname">Full Display Title *</Label>
              <Input
                id="prod-fullname"
                required
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Acoflex CPVC Pipes & Fittings"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-system">System Type *</Label>
              <Input
                id="prod-system"
                required
                value={formData.system || ""}
                onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                placeholder="Hot and Cold Potable Water Distribution"
              />
            </div>
          </div>
        </div>

        {/* Descriptive Copy Card (Visible) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-semibold text-foreground">Descriptions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Short summary for product cards and detailed description for the product page.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-summary">Short Summary</Label>
            <Input
              id="prod-summary"
              value={formData.summary || ""}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Chlorinated polyvinyl chloride pipes for residential and commercial hot and cold water..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-overview">Detailed Description</Label>
            <Textarea
              id="prod-overview"
              rows={4}
              value={formData.overview || ""}
              onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
              placeholder="Acoflex CPVC pipes are manufactured from specially formulated compounds designed to handle high pressures..."
            />
          </div>
        </div>

        {/* Highlights & Applications Card (Visible) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-semibold text-foreground">Highlights & Applications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Type one bullet point per line. They appear as bullet lists on the product page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-highlights">Key Features / Highlights (one per line)</Label>
              <Textarea
                id="prod-highlights"
                rows={4}
                value={highlightsRaw}
                onChange={(e) => setHighlightsRaw(e.target.value)}
                placeholder="Temperature capability up to 93°C&#10;Lead-free formulation&#10;Solvent cement jointing"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-applications">Applications / Uses (one per line)</Label>
              <Textarea
                id="prod-applications"
                rows={4}
                value={applicationsRaw}
                onChange={(e) => setApplicationsRaw(e.target.value)}
                placeholder="Hot and cold water supply&#10;Commercial complexes&#10;Industrial fluid transport"
              />
            </div>
          </div>
        </div>

        {/* Product Photo & Media Card (Visible) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">Product Photo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select or upload a photo to display on the catalogue.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMediaPicker(true)}
              className="gap-1.5 self-start sm:self-auto"
            >
              <ImageIcon className="size-4 text-primary" />
              Choose from Media Library
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="size-24 rounded-lg border border-border bg-muted/20 overflow-hidden flex items-center justify-center shrink-0">
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt={formData.image_alt || "Product thumbnail"}
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground/40" />
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-1.5">
                <Label htmlFor="prod-img">Image URL / Path</Label>
                <Input
                  id="prod-img"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/assets/c2.webp or uploaded URL"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-img-alt">Image Description (Alt Text)</Label>
                <Input
                  id="prod-img-alt"
                  value={formData.image_alt || ""}
                  onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                  placeholder="Acoflex CPVC pipes"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Settings (Collapsed by default) */}
        <Accordion type="single" collapsible className="w-full border-none">
          <AccordionItem
            value="advanced"
            className="rounded-xl border border-border bg-card shadow-xs px-6 py-1"
          >
            <AccordionTrigger className="hover:no-underline py-4 text-muted-foreground hover:text-foreground">
              <div className="flex items-center gap-2.5">
                <Settings2 className="size-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Advanced Settings</span>
                <span className="text-xs text-muted-foreground font-normal">
                  (URL slug, sort position, image type)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-slug">Website URL Slug *</Label>
                  <Input
                    id="prod-slug"
                    required
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="cpvc"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Forms part of the web address, e.g. /products/plumbing/cpvc
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-sort">Catalogue Sort Order</Label>
                  <Input
                    id="prod-sort"
                    type="number"
                    value={formData.sort_order ?? 10}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Lower numbers appear first in the product list.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-img-type">Image Presentation Type</Label>
                  <select
                    id="prod-img-type"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.image_type || "representative"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        image_type: e.target.value as "representative" | "manufacturing",
                      })
                    }
                  >
                    <option value="representative">Representative Product</option>
                    <option value="manufacturing">Manufacturing Facility</option>
                  </select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="submit"
            variant="outline"
            disabled={
              saveDraftMutation.isPending ||
              createProductMutation.isPending ||
              publishMutation.isPending
            }
            className="gap-2"
          >
            {(saveDraftMutation.isPending || createProductMutation.isPending) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            <Save className="size-4" />
            {isNew ? "Create Product" : "Save Draft"}
          </Button>

          {!isNew && (
            <Button
              type="button"
              variant="gold"
              onClick={handlePublish}
              disabled={publishMutation.isPending || saveDraftMutation.isPending}
              className="gap-2 font-semibold shadow-xs"
            >
              {publishMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              <Send className="size-4" />
              Publish Changes
            </Button>
          )}
        </div>
      </form>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        currentUrl={formData.image_url}
        onSelect={({ url, altText }) => {
          setFormData((prev) => ({
            ...prev,
            image_url: url,
            image_alt: altText || prev.image_alt || prev.name || "Product image",
          }));
        }}
      />
    </div>
  );
}
