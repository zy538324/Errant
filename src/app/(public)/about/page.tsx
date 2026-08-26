import Image from "next/image";
import { brand } from "@/lib/theme";
import { getPublicPageContent, metadataString } from "@/lib/public-page-content";
import { getArtistProfile } from "@/sanity/lib/loaders";

const aboutFallback = {
  eyebrow: "About",
  title: "A note from behind the lens.",
  intro: "Errant-Arts is a personal photography practice shaped by place, light, and story.",
  body: "Using art to share my passions with the world\n\nErrant-Arts is about atmospheric landscapes, sacred architecture, and quiet images presented with the same care they receive behind the camera.\n\nHow each collection is built\n\nCollections are edited slowly and deliberately, with each image chosen to carry mood, memory, and a sense of place.",
  imageUrl: null,
  metadata: {
    signatureName: "Sean",
    location: "",
  },
};

function bodyParagraphs(value: string | null | undefined) {
  return value
    ?.split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function renderSanityBiography(biography: any[] | null | undefined) {
  if (!biography || !Array.isArray(biography)) return null;

  return biography.map((block: any, index: number) => {
    if (block._type !== "block") return null;
    const text = block.children?.map((c: any) => c.text).join("") || "";
    const key = block._key || index;
    if (!text.trim()) return <div key={key} className="h-4" />;

    const isStrong = block.children?.some((c: any) => c.marks?.includes("strong"));
    const isHeading = block.style === "h2" || block.style === "h3" || isStrong;

    if (isHeading) {
      return (
        <h3 key={key} className="font-serif text-2xl text-stone-50 mt-8 mb-4 first:mt-0">
          {text}
        </h3>
      );
    }

    return (
      <p key={key} className="text-lg leading-8 text-stone-300">
        {text}
      </p>
    );
  });
}

export default async function AboutPage() {
  const [pageContent, profile] = await Promise.all([
    getPublicPageContent("about", aboutFallback),
    getArtistProfile().catch(() => null),
  ]);

  const hasSanityProfile = Boolean(profile?.biography && profile.biography.length > 0);

  const title = hasSanityProfile && profile?.name ? profile.name : pageContent.title;
  const portraitUrl = hasSanityProfile && profile?.portraitUrl ? profile.portraitUrl : pageContent.imageUrl;
  const headline = hasSanityProfile && profile?.headline ? profile.headline : pageContent.intro;
  const introLead = hasSanityProfile && profile?.intro ? profile.intro : null;
  const location = hasSanityProfile && profile?.location ? profile.location : metadataString(pageContent, "location", "");
  const signatureName = hasSanityProfile && profile?.signatureName ? profile.signatureName : metadataString(pageContent, "signatureName", "");

  return (
    <main className="content-shell mx-auto max-w-5xl px-6 py-16 text-stone-300 lg:px-10">
      <h1 className="font-serif text-5xl text-stone-50">{title}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        {portraitUrl ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/25">
            <Image
              src={portraitUrl}
              alt={title?.trim() || "Errant Arts portrait"}
              width={900}
              height={1200}
              className="max-h-[34rem] w-full object-contain"
              sizes="(min-width: 1024px) 38vw, 100vw"
              priority
            />
          </div>
        ) : null}
        <section className="space-y-6">
          {headline?.trim() ? <h2 className="font-serif text-3xl text-stone-50">{headline}</h2> : null}
          {location.trim() ? (
            <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Based in {location}</div>
          ) : null}
          
          {hasSanityProfile ? (
            <div className="space-y-6">
              {introLead ? <p className="text-lg leading-8 font-medium text-stone-200">{introLead}</p> : null}
              {renderSanityBiography(profile?.biography)}
            </div>
          ) : (
            pageContent.body?.trim() ? (
              <div className="space-y-6">
                {bodyParagraphs(pageContent.body).map((paragraph) => (
                  <p key={paragraph} className="text-lg leading-8">{paragraph}</p>
                ))}
              </div>
            ) : null
          )}
        </section>
      </div>
      {signatureName.trim() ? (
        <section className="mt-12 max-w-3xl border-t border-white/10 pt-10">
          <div className="space-y-5 text-lg leading-8 text-stone-300">
            <p
              className="pt-4 text-[2.8rem] leading-none md:text-[3.4rem]"
              style={{
                fontFamily: '\"Great Vibes\", \"Allura\", \"Dancing Script\", cursive',
                color: brand.text,
                letterSpacing: "-0.02em",
                transform: "rotate(-6deg) skewX(-8deg)",
                display: "inline-block",
              }}
            >
              {signatureName}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
