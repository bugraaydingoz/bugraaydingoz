import { createParser } from "nuqs";
import type { z } from "zod";

export function parseAsZod<T extends z.ZodType<string>>(schema: T) {
  return createParser<z.output<T>>({
    parse: (value) => {
      const result = schema.safeParse(value);

      return result.success ? result.data : null;
    },
    serialize: (value) => value,
  });
}
