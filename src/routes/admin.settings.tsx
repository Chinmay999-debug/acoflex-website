import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Mail,
  Building,
  Phone,
  Share2,
} from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Website Settings — Acoflex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSiteSettings,
});

interface SiteSettingsData {
  company?: string;
  address?: string;
  hours?: string;
  phone?: string;
  emails?: string[];
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
    origin?: string;
    copyright?: string;
  };
  [key: string]: unknown;
}

function AdminSiteSettings() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SiteSettingsData>({});
  const [initialData, setInitialData] = useState<SiteSettingsData>({});
  const [emailsRaw, setEmailsRaw] = useState("");
  const [initialEmailsRaw, setInitialEmailsRaw] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch current settings (Draft preferred, published fallback)
  const {
    data: settingsRecord,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["admin_site_settings"],
    queryFn: async () => {
      if (!supabase) throw new Error("Database connection is not available.");

      const { data: draftData, error: draftErr } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_key", "global")
        .eq("version", "draft")
        .maybeSingle();

      if (draftErr) throw draftErr;
      if (draftData) return { ...draftData, isDraft: true };

      const { data: pubData, error: pubErr } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_key", "global")
        .eq("version", "published")
        .maybeSingle();

      if (pubErr) throw pubErr;
      return { ...pubData, isDraft: false };
    },
  });

  useEffect(() => {
    if (settingsRecord?.data) {
      const data = settingsRecord.data as SiteSettingsData;

      // Sanitize old deprecated emails from database record
      const rawList = Array.isArray(data.emails) ? data.emails : [];
      const sanitizedEmails = rawList
        .map((e) =>
          typeof e === "string" && e.toLowerCase().includes("acoflexpvc.com")
            ? "acoflexpvc@gmail.com"
            : typeof e === "string"
              ? e.trim()
              : "",
        )
        .filter(Boolean);
      const uniqueEmails = Array.from(new Set(sanitizedEmails));
      const finalEmails = uniqueEmails.length > 0 ? uniqueEmails : ["acoflexpvc@gmail.com"];

      const rawNoticeEmail = data.notice_bar?.email;
      const sanitizedNoticeEmail =
        !rawNoticeEmail || rawNoticeEmail.toLowerCase().includes("acoflexpvc.com")
          ? "acoflexpvc@gmail.com"
          : rawNoticeEmail.trim();

      const cleanedData: SiteSettingsData = {
        ...data,
        emails: finalEmails,
        phone: data.phone || "+91 79762 63302",
        notice_bar: {
          ...data.notice_bar,
          email: sanitizedNoticeEmail,
          phone: data.notice_bar?.phone || "+91 79762 63302",
        },
        social_links: {
          whatsapp: data.social_links?.whatsapp || "https://wa.me/917976263302",
          youtube:
            data.social_links?.youtube ||
            "https://www.youtube.com/channel/UCwyCcoI6ttDIM3TsK_W3OGQ",
          facebook:
            data.social_links?.facebook || "https://www.facebook.com/profile.php?id=61595401024633",
          linkedin:
            data.social_links?.linkedin || "https://www.linkedin.com/in/acoflex-pvc-72094a444/",
          instagram: data.social_links?.instagram || "https://www.instagram.com/acoflexpvc/?hl=en",
        },
      };

      setFormData(cleanedData);
      setInitialData(cleanedData);
      const eStr = finalEmails.join(", ");
      setEmailsRaw(eStr);
      setInitialEmailsRaw(eStr);
    }
  }, [settingsRecord]);

  // Compute dirty working state
  const isDirty = useMemo(() => {
    if (!initialData || Object.keys(initialData).length === 0) return false;
    const dataChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    const emailsChanged = emailsRaw !== initialEmailsRaw;
    return dataChanged || emailsChanged;
  }, [formData, initialData, emailsRaw, initialEmailsRaw]);

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

  // 2. Mutation to Save Draft
  const saveDraftMutation = useMutation({
    mutationFn: async (updatedData: SiteSettingsData) => {
      if (!supabase) throw new Error("Database connection is not available.");

      const { data, error } = await supabase
        .from("site_settings")
        .upsert(
          {
            setting_key: "global",
            version: "draft",
            data: updatedData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key,version" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setInitialData(formData);
      setInitialEmailsRaw(emailsRaw);
      setStatusMessage({
        type: "success",
        text: "Changes saved as draft. When you are ready, click 'Publish Changes' to make them visible to website visitors.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin_site_settings"] });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Unable to save changes: ${err.message}`,
      });
    },
  });

  // 3. Mutation to Publish to Live
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Database connection is not available.");

      const parsedEmails = emailsRaw
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      const latestData: SiteSettingsData = {
        ...formData,
        emails: parsedEmails,
      };

      await supabase.from("site_settings").upsert(
        {
          setting_key: "global",
          version: "draft",
          data: latestData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key,version" },
      );

      const { error } = await supabase.rpc("publish_site_settings", {
        target_key: "global",
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      setInitialData(formData);
      setInitialEmailsRaw(emailsRaw);
      setStatusMessage({
        type: "success",
        text: "Website settings published successfully! The live website is now updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin_site_settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings", "published"] });
    },
    onError: (err: Error) => {
      setStatusMessage({
        type: "error",
        text: `Unable to publish: ${err.message}`,
      });
    },
  });

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const parsedEmails = emailsRaw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const updated: SiteSettingsData = {
      ...formData,
      emails: parsedEmails,
    };

    saveDraftMutation.mutate(updated);
  };

  const handlePublish = () => {
    if (
      window.confirm(
        "Are you ready to publish these changes? They will immediately appear on the live website.",
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
        <p className="font-semibold">Unable to load settings</p>
        <p className="text-sm mt-1">{(fetchError as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Friendly Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              General Website Settings
            </h1>
            {/* 3 Explicit States */}
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Changes not saved
              </span>
            ) : settingsRecord?.isDraft ? (
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
          <p className="text-sm text-muted-foreground mt-1">
            Update your business phone numbers, emails, office address, and top contact banner.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Clear Forms */}
      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* Top Contact Strip */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPin className="size-4.5 text-primary" />
              Header Notice Bar (Top Strip)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              The line displayed at the very top of the website on computers and tablets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="notice-location">City / Location Label</Label>
              <Input
                id="notice-location"
                value={formData.notice_bar?.location || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notice_bar: { ...formData.notice_bar, location: e.target.value },
                  })
                }
                placeholder="Barara, Ambala, Haryana"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notice-phone">Direct Phone</Label>
              <Input
                id="notice-phone"
                value={formData.notice_bar?.phone || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notice_bar: { ...formData.notice_bar, phone: e.target.value },
                  })
                }
                placeholder="+91 79762 63302"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notice-hours">Opening Hours Note</Label>
              <Input
                id="notice-hours"
                value={formData.notice_bar?.hours || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notice_bar: { ...formData.notice_bar, hours: e.target.value },
                  })
                }
                placeholder="Mon–Sat, 8:00–17:30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notice-email">Contact Email</Label>
              <Input
                id="notice-email"
                type="email"
                value={formData.notice_bar?.email || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notice_bar: { ...formData.notice_bar, email: e.target.value },
                  })
                }
                placeholder="acoflexpvc@gmail.com"
              />
            </div>
          </div>
        </div>

        {/* Company & Office Info */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Building className="size-4.5 text-primary" />
              Company Details & Contact Information
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used in the footer and contact sections across the website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Legal Name</Label>
              <Input
                id="company-name"
                value={formData.company || ""}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Saiyanm Industries Pvt. Ltd."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company-phone">Direct Business Phone</Label>
              <Input
                id="company-phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 79762 63302"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="general-hours">Standard Working Hours</Label>
              <Input
                id="general-hours"
                value={formData.hours || ""}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="Monday–Saturday, 8:00–17:30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emails-list">Contact Email Addresses (separated by commas)</Label>
            <Input
              id="emails-list"
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder="acoflexpvc@gmail.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="factory-address">Factory & Office Full Address</Label>
            <Textarea
              id="factory-address"
              rows={2}
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Vill Simbla (Behind Hanuman Mandir), P.O., Teh. Barara, Distt. Ambala, Haryana 133201, India"
            />
          </div>
        </div>

        {/* Social Media Channels */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Share2 className="size-4.5 text-primary" />
              Social Media Channels & Profiles
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official links displayed in the website footer, contact drawer, and contact page.
              Leaving a field blank hides that icon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="social-whatsapp">WhatsApp Chat Link or Number</Label>
              <Input
                id="social-whatsapp"
                type="url"
                value={formData.social_links?.whatsapp || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, whatsapp: e.target.value },
                  })
                }
                placeholder="https://wa.me/917976263302"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="social-youtube">YouTube Channel URL</Label>
              <Input
                id="social-youtube"
                type="url"
                value={formData.social_links?.youtube || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, youtube: e.target.value },
                  })
                }
                placeholder="https://www.youtube.com/channel/UCwyCcoI6ttDIM3TsK_W3OGQ"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="social-facebook">Facebook Page URL</Label>
              <Input
                id="social-facebook"
                type="url"
                value={formData.social_links?.facebook || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, facebook: e.target.value },
                  })
                }
                placeholder="https://www.facebook.com/profile.php?id=61595401024633"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="social-linkedin">LinkedIn Profile URL</Label>
              <Input
                id="social-linkedin"
                type="url"
                value={formData.social_links?.linkedin || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value },
                  })
                }
                placeholder="https://www.linkedin.com/in/acoflex-pvc-72094a444/"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="social-instagram">Instagram Profile URL</Label>
              <Input
                id="social-instagram"
                type="url"
                value={formData.social_links?.instagram || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value },
                  })
                }
                placeholder="https://www.instagram.com/acoflexpvc/?hl=en"
              />
            </div>
          </div>
        </div>

        {/* Website Footer Tagline */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4.5 text-primary" />
              Website Footer Note
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Text shown at the bottom of every page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="footer-tagline">Footer Tagline</Label>
              <Input
                id="footer-tagline"
                value={formData.footer?.tagline || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: { ...formData.footer, tagline: e.target.value },
                  })
                }
                placeholder="Plumbing, drainage and agriculture pipe systems..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="footer-origin">Origin Badge</Label>
              <Input
                id="footer-origin"
                value={formData.footer?.origin || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: { ...formData.footer, origin: e.target.value },
                  })
                }
                placeholder="Made in India"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
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
