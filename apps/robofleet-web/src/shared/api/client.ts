import { hc } from "hono/client";
import type { AppType } from "../../../../robofleet-api/src/app";

export const client = hc<AppType>("/");
