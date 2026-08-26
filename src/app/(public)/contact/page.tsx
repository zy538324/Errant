import { Mail } from "lucide-react";
import { SocialFollowLinks } from "@/components/site/social-follow-links";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";
import { getPublicPageContent, metadataString } from "@/lib/public-page-content";

const contactFallback = {
  eyebrow: "Get in touch",
  title: "Contact",
  intro: "For orders, licensing, commissions, or print enquiries, email the studio directly.",
  body: "Day-to-day updates also go out on the channels below.",
  metadata: {
    socialHeading: "Social media",
  },
};

function paragraphText(value: string | null | undefined) {
  return value?.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean) ?? [];
}

export default async function ContactPage() {
  const pageContent = await getPublicPageContent("contact", contactFallback);
  const supportEmail = getAdminSettingsSnapshot().app.supportEmail.trim() || "contact@errant-arts.co.uk";
  const socialHeading = metadataString(pageContent, "socialHeading", "Social media");

  return (
    <main className="content-shell py-16 text-stone-300">
      <h1 className="font-serif text-5xl text-stone-50">{pageContent.title}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8">{pageContent.intro ?? contactFallback.intro}</p>
      <section className="mt-8 max-w-3xl rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
        <div className="flex flex-wrap items-center gap-3 text-stone-100">
          <Mail className="h-5 w-5 text-brand-accent" />
          <a href={`mailto:${supportEmail}`} className="text-lg hover:text-brand-highlight">
            {supportEmail}
          </a>
        </div>
      </section>
      <section className="mt-8 max-w-3xl rounded-[1.5rem] border border-white/10 bg-black/20 p-6">
        <h2 className="text-sm font-medium text-stone-200">{socialHeading}</h2>
        {pageContent.body ? (
          <div className="mt-2 space-y-2 text-sm text-stone-500">
            {paragraphText(pageContent.body).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        ) : null}
        <div className="mt-4">
          <SocialFollowLinks />
        </div>
      </section>
    </main>
  );
}
