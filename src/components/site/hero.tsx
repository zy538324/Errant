import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProps = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  notesEyebrow?: string | null;
  notes?: Array<{ title: string; body: string }> | null;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string | null;
  secondaryLabel?: string;
  showHeroLogo?: boolean;
  heroLogoSrc?: string;
  heroLogoWidth?: number;
  heroLogoHeight?: number;
};

export function Hero({
  eyebrow,
  title,
  description,
  notesEyebrow,
  notes,
  primaryHref = "/shop",
  primaryLabel = "Explore the gallery",
  secondaryHref = "/portfolio",
  secondaryLabel = "View portfolio",
  showHeroLogo = false,
  heroLogoSrc = "/logo.png",
  heroLogoWidth = 900,
  heroLogoHeight = 308,
}: HeroProps) {
  const resolvedEyebrow = eyebrow?.trim() ?? "";
  const resolvedTitle = title?.trim() ?? "";
  const resolvedDescription = description?.trim() ?? "";
  const resolvedNotesEyebrow = notesEyebrow?.trim() ?? "";
  const resolvedNotes = notes ?? [];
  const hasNotesPanel = Boolean(resolvedNotesEyebrow) || resolvedNotes.length > 0;
  const hasRightLogo = showHeroLogo && !hasNotesPanel;

  return (
    <section
      className={[
        "mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:px-10 lg:py-20",
        hasNotesPanel ? "lg:grid-cols-[1.1fr_0.9fr]" : "",
        hasRightLogo ? "lg:grid-cols-[0.9fr_1.1fr] lg:items-center" : "",
      ].join(" ")}
    >
      <div>
        {resolvedEyebrow ? (
          <div className="text-xs uppercase tracking-[0.4em] text-stone-400">
            {resolvedEyebrow}
          </div>
        ) : null}
        {resolvedTitle ? (
          <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-tight text-stone-50 md:text-7xl">
            {resolvedTitle}
          </h1>
        ) : null}
        {resolvedDescription ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
            {resolvedDescription}
          </p>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={primaryHref}>
            <Button size="lg">
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {secondaryHref ? (
            <Link href={secondaryHref}>
              <Button variant="ghost" size="lg">
                {secondaryLabel}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {hasRightLogo ? (
        <div className="order-first flex justify-center lg:order-none lg:justify-end">
          <Image
            src={heroLogoSrc}
            alt="Errant Arts"
            width={heroLogoWidth}
            height={heroLogoHeight}
            className="h-auto w-[min(86vw,420px)] drop-shadow-[0_20px_55px_rgba(255,255,255,0.12)] lg:w-[560px] xl:w-[690px]"
            sizes="(max-width: 1024px) 86vw, 690px"
            priority
          />
        </div>
      ) : null}

      {hasNotesPanel ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        {resolvedNotesEyebrow ? (
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            {resolvedNotesEyebrow}
          </div>
        ) : null}
        {resolvedNotes.length > 0 ? (
          <div className="mt-4 grid gap-4 text-sm leading-7 text-stone-300">
            {resolvedNotes.map((note) => (
              <div
                key={note.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                {note.title?.trim() ? (
                  <div className="font-medium text-stone-100">{note.title}</div>
                ) : null}
                {note.body?.trim() ? <div>{note.body}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
        </div>
      ) : null}
    </section>
  );
}
