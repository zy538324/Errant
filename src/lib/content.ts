export type EditableSection = {
  title: string;
  body: string;
};

export const aboutPageContent = {
  eyebrow: "About",
  title: "A note from behind the lens.",
  intro:
    "Errant-Arts is a personal photography practice shaped by place, light, and story.",
  summaryLabel: "Errant-Arts",
  summaryTitle: "Fine art photography presented with calm, clarity, and intention.",
  storySections: [
    {
      title: "Using art to share my passions with the world",
      body: "Errant-Arts is about atmospheric landscapes, sacred architecture, and quiet images presented with the same care they receive behind the camera.",
    },
    {
      title: "How each collection is built",
      body: "Collections are edited slowly and deliberately, with each image chosen to carry mood, memory, and a sense of place.",
    },
    
  ] satisfies EditableSection[],
  signatureParagraphs: [
    
    "Sean",
  ],
};

export const privacyPageContent = {
  eyebrow: "Privacy Policy",
  title: "Clear customer handling for a gallery-grade digital storefront.",
  intro:
    "This page is also content-driven, so policy language and layout sections can be amended from one place as the business evolves.",
  sections: [
    {
      title: "What is retained",
      body: "Order records, entitlement history, and operational audit data can be retained where needed for fulfilment, fraud prevention, and financial record-keeping.",
    },
    {
      title: "What can be minimised",
      body: "Identity and contact fields should be reduced or anonymised when they are no longer necessary for the original purpose they were collected for.",
    },
    {
      title: "How fulfilment works",
      body: "Purchased files are not served publicly. Download access is issued through entitlement checks and short-lived signed links after successful payment.",
    },
    {
      title: "Marketing emails",
      body: "Errant Arts only sends news, events, new work, and offers by email where a customer has actively opted in. Marketing consent is stored separately from order fulfilment records, and every marketing email includes an unsubscribe link. People who unsubscribe or ask not to be contacted are excluded from future marketing sends.",
    },
  ] satisfies EditableSection[],
};

export const footerMenus = [
  {
    title: "Shop",
    links: [
      { label: "Shop", href: "/shop" },
      { label: "Cart", href: "/cart" },
      { label: "Checkout", href: "/checkout" },
      { label: "My Account", href: "/account" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "About", href: "/about" },
      // { label: "News", href: "/news" },
      { label: "Reviews", href: "/reviews" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Refund & Returns Policy", href: "/refunds-returns" },
      { label: "Digital Download Licence", href: "/digital-download-licence" },
    ],
  },
] as const;

export const adminDashboardSections = [
  {
    title: "Photos",
    body: "Manage uploads, collections, publish state, and protected preview derivatives.",
  },
  {
    title: "Sales",
    body: "Review orders, fulfilment state, refunds, and download activity.",
  },
  {
    title: "Analytics",
    body: "Track conversion, customer activity, and the most viewed collections.",
  },
  {
    title: "Settings",
    body: "Control storage, Stripe, admins, MFA enrolment, and retention settings.",
  },
] as const;
