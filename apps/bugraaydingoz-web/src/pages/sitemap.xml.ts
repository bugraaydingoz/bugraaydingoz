type ArticleFrontmatter = {
  date?: Date | string;
  updated?: Date | string;
};

type ArticleMarkdown = {
  frontmatter: ArticleFrontmatter;
};

const siteUrl = "https://bugraaydingoz.com";

function formatDate(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function entry(pathname: string, lastmod?: string) {
  return [
    "    <url>",
    `        <loc>${new URL(pathname, siteUrl).href}</loc>`,
    lastmod ? `        <lastmod>${lastmod}</lastmod>` : "",
    "    </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function GET() {
  const contentModules = import.meta.glob<ArticleMarkdown>(
    "../content/articles/*.md",
    { eager: true },
  );

  const articleEntries = Object.entries(contentModules).map(([path, module]) => {
    const slug = path.split("/").at(-1)?.replace(".md", "");
    const lastmod = formatDate(module.frontmatter.updated ?? module.frontmatter.date);

    return entry(`/articles/${slug}/`, lastmod);
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entry("/"),
    ...articleEntries,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
