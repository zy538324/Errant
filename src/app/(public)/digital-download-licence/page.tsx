import Link from "next/link";
import { Panel } from "@/components/ui/panel";

const allowedUses = [
  "Download the purchased file for your own personal use.",
  "Print the file at home for personal use.",
  "Save the file to your personal device.",
  "Share the image with friends and family through private messages such as WhatsApp or email.",
  "Post the image on personal social media accounts, provided it is not used commercially and credit is given where appropriate.",
];

const restrictedUses = [
  "Resell the image in digital or printed form.",
  "Upload the file to marketplaces or print-on-demand platforms.",
  "Use the image on products for sale.",
  "Claim the artwork or design as your own.",
  "Edit, adapt or alter the image for resale.",
  "Use the image for business, branding, advertising or commercial purposes without written permission.",
  "Print the image through a professional print company for resale or commercial distribution.",
  "Share the original downloadable file publicly or make it available for others to download.",
];

export default function DigitalDownloadLicencePage() {
  return (
    <main className="content-shell py-16">
      <div className="eyebrow">Licence terms</div>
      <h1 className="mt-3 max-w-4xl font-serif text-5xl leading-tight text-stone-50">
        Digital Download Licence Agreement
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-300">
        When you purchase a digital download from this website, you are buying a
        personal-use licence only. You are not buying ownership of the artwork,
        image, design, copyright, or intellectual property.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Panel className="p-8">
          <h2 className="font-serif text-3xl text-stone-50">What you can do</h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-300">
            {allowedUses.map((item) => (
              <li key={item} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-8">
          <h2 className="font-serif text-3xl text-stone-50">What you cannot do</h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-300">
            {restrictedUses.map((item) => (
              <li key={item} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-8 p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="font-serif text-2xl text-stone-50">Professional printing</h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">
              You may only use a professional print service if the print is for
              your own personal use and not for resale, redistribution, or
              commercial use.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl text-stone-50">Copyright</h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">
              All copyright and intellectual property remains with the original
              creator unless otherwise stated in writing.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-2xl text-stone-50">Commercial use</h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">
              For commercial licensing, please contact us before using the image.
            </p>
          </div>
        </div>
      </Panel>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-950 hover:bg-white"
        >
          Browse digital downloads
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
        >
          Ask about commercial licensing
        </Link>
      </div>
    </main>
  );
}
