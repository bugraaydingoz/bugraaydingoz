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
});
