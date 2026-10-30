import { useQueryState } from "nuqs";
import { z } from "zod";
import { parseAsZod } from "@/shared/utils/parse-as-zod";

const robotFilterParser = parseAsZod(z.enum(["all", "active", "attention"]))
  .withDefault("all")
  .withOptions({ history: "push" });

export function useRobotFilter() {
  return useQueryState("filter", robotFilterParser);
}
