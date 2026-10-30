import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { parseAsZod } from "./parse-as-zod";

describe("parseAsZod", () => {
  it("preserves enum values and their inferred type through a round trip", () => {
    const parser = parseAsZod(z.enum(["active", "inactive", "pending"]));

    expectTypeOf(parser.parse("active")).toEqualTypeOf<"active" | "inactive" | "pending" | null>();

    for (const status of ["active", "inactive", "pending"] as const) {
      expect(parser.parse(parser.serialize(status))).toBe(status);
    }
  });

  it("returns null for invalid enum values", () => {
    const parser = parseAsZod(z.enum(["active", "inactive", "pending"]));

    expect(parser.parse("unknown")).toBeNull();
    expect(parser.parse("")).toBeNull();
  });

  it("applies schema constraints without changing valid strings", () => {
    const parser = parseAsZod(z.string().min(1).max(100));

    expect(parser.parse("AMR-002")).toBe("AMR-002");
    expect(parser.parse("")).toBeNull();
    expect(parser.parse("a".repeat(101))).toBeNull();
  });
});
