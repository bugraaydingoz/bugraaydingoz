import type { z } from "zod";

export async function parseResponse<T extends z.ZodTypeAny>(
  response: Response,
  schema: T,
  message: string,
): Promise<z.output<T>> {
  try {
    return schema.parse(await response.json());
  } catch (cause) {
    throw new Error(message, { cause });
  }
}
