import { useQueryState } from "nuqs";
import { z } from "zod";
import { parseAsZod } from "@/shared/utils/parse-as-zod";

const selectedRobotParser = parseAsZod(z.string().min(1).max(100)).withOptions({ history: "push" });

export function useSelectedRobot() {
  return useQueryState("robot", selectedRobotParser);
}
