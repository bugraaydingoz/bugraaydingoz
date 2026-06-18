export type Article = {
  date: string;
  excerpt: string;
  pinned?: boolean;
  readTime: string;
  slug: string;
  title: string;
};

export const articles: Article[] = [
  {
    slug: "about-me",
    title: "About Me",
    date: "Pinned",
    readTime: "3 min read",
    pinned: true,
    excerpt: "A short personal note about how I think, build, and work with product teams.",
  },
  {
    slug: "product-engineering-notes",
    title: "Product Engineering Notes",
    date: "Draft",
    readTime: "4 min read",
    excerpt:
      "How small product decisions, careful interfaces, and engineering taste compound into calmer software.",
  },
  {
    slug: "designing-for-flow",
    title: "Designing for Flow",
    date: "Draft",
    readTime: "5 min read",
    excerpt:
      "A short reflection on interfaces that help people keep momentum without making them think about the tool.",
  },
  {
    slug: "frontend-systems",
    title: "Frontend Systems",
    date: "Draft",
    readTime: "6 min read",
    excerpt: "Notes on building frontend systems that stay flexible after the first version ships.",
  },
  {
    slug: "useful-abstractions",
    title: "Useful Abstractions",
    date: "Draft",
    readTime: "3 min read",
    excerpt:
      "A practical look at when abstractions help a team move faster and when they simply become furniture.",
  },
  {
    slug: "shipping-with-care",
    title: "Shipping With Care",
    date: "Draft",
    readTime: "4 min read",
    excerpt: "Thoughts on release habits, taste, and the quiet discipline of finishing work well.",
  },
  {
    slug: "working-with-ai",
    title: "Working With AI",
    date: "Draft",
    readTime: "5 min read",
    excerpt: "How product engineers can use AI as a thinking partner without outsourcing judgment.",
  },
  {
    slug: "small-teams",
    title: "Small Teams",
    date: "Draft",
    readTime: "4 min read",
    excerpt: "What small teams can do differently when they treat constraints as design material.",
  },
  {
    slug: "interface-polish",
    title: "Interface Polish",
    date: "Draft",
    readTime: "3 min read",
    excerpt:
      "A checklist of details that make software feel considered without making it feel decorated.",
  },
  {
    slug: "technical-product-sense",
    title: "Technical Product Sense",
    date: "Draft",
    readTime: "6 min read",
    excerpt: "Where engineering judgment and product taste overlap, and why that overlap matters.",
  },
  {
    slug: "quiet-software",
    title: "Quiet Software",
    date: "Draft",
    readTime: "4 min read",
    excerpt:
      "A case for restrained interfaces that respect attention and make repeated use feel easy.",
  },
  {
    slug: "building-trust",
    title: "Building Trust",
    date: "Draft",
    readTime: "5 min read",
    excerpt:
      "Trust shows up in loading states, copy, spacing, defaults, and the ways a product admits uncertainty.",
  },
  {
    slug: "notes-on-craft",
    title: "Notes on Craft",
    date: "Draft",
    readTime: "4 min read",
    excerpt:
      "Collected thoughts on craft, product work, and the habits that make software easier to live with.",
  },
];
