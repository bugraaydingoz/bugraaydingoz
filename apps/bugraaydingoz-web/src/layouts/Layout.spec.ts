import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Layout from "./Layout.astro";

describe("Layout", () => {
  it("renders core SEO and share metadata", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Layout, {
      props: {
        description: "A focused product engineering portfolio.",
        title: "Test title",
      },
      slots: {
        default: "<main>Hello</main>",
      },
    });

    expect(html).toContain("<title>Test title</title>");
    expect(html).toContain('name="description" content="A focused product engineering portfolio."');
    expect(html).toContain('property="og:title" content="Test title"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('type="application/ld+json"');
  });

  it("renders article metadata when article props are provided", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Layout, {
      props: {
        description: "A note about product engineering.",
        headline: "About Me",
        image: "/og/articles/about-me.png",
        publishedDate: "2026-05-01",
        tags: ["product engineering", "frontend"],
        title: "About Me · Buğra Aydıngöz",
        type: "article",
        updatedDate: "2026-05-02",
      },
      slots: {
        default: "<main>Article</main>",
      },
    });

    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('property="article:published_time" content="2026-05-01"');
    expect(html).toContain('property="article:modified_time" content="2026-05-02"');
    expect(html).toContain('property="article:tag" content="product engineering"');
    expect(html).toContain('property="og:image" content="https://bugraaydingoz.com/og/articles/about-me.png"');
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain('"headline":"About Me"');
  });
});
