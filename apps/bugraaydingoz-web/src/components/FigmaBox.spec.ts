import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import FigmaBox from "./FigmaBox.astro";

describe("FigmaBox", () => {
    it("renders arbitrary slotted content inside an accessible frame", async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(FigmaBox, {
            props: { label: "Avatar" },
            slots: {
                default:
                    '<div data-testid="slot-content">Any HTML element</div>',
            },
        });

        expect(html).toContain('aria-label="Avatar frame"');
        expect(html).toContain("data-figma-box");
        expect(html).toContain('data-testid="slot-content"');
        expect(html).toContain("Any HTML element");
    });

    it("renders resize and radius handles", async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(FigmaBox);

        for (const handle of ["tl", "tr", "br", "bl", "t", "r", "b", "l"]) {
            expect(html).toContain(`data-resize-handle="${handle}"`);
        }

        for (const handle of ["tl", "tr", "br", "bl"]) {
            expect(html).toContain(`data-radius-handle="${handle}"`);
        }
    });
});
