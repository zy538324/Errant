import Link from "next/link";

export type FilterToolbarOption = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export type FilterToolbarSection = {
  label: string;
  options: FilterToolbarOption[];
};

export function FilterToolbar({
  sections,
}: {
  sections: FilterToolbarSection[];
}) {
  const populatedSections = sections.filter((section) => section.options.length > 0);

  if (populatedSections.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm text-stone-400">
        Filters will appear here once published items have categories,
        collections, or groups.
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-[2rem] border border-white/10 bg-[#111315] p-6">
      {populatedSections.map((section) => (
        <div key={section.label}>
          <div className="text-[0.7rem] uppercase tracking-[0.3em] text-stone-500">
            {section.label}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {section.options.map((option) => (
              <Link
                key={`${section.label}:${option.label}`}
                href={option.href}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  option.active
                    ? "border-stone-100 bg-stone-100 text-stone-950"
                    : "border-white/10 text-stone-200 hover:bg-white/5",
                ].join(" ")}
              >
                <span>{option.label}</span>
                {typeof option.count === "number" ? (
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[0.7rem]",
                      option.active
                        ? "bg-stone-950/10 text-stone-800"
                        : "bg-white/10 text-stone-400",
                    ].join(" ")}
                  >
                    {option.count}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
