import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { robotsQueryKey } from "@/features/robots/api/robots.queries";
import { mapsQueryKey } from "@/features/maps/api/maps.queries";
import type { FleetRobot } from "@/features/robots/api/robots.api";
import type { FleetMap } from "@/features/maps/api/maps.api";
import fixture from "./fleet.json";

export function renderWithFleet(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } },
  });

  client.setQueryData(robotsQueryKey, fixture.robots as FleetRobot[]);
  client.setQueryData(mapsQueryKey, fixture.maps as FleetMap[]);

  return {
    client,
    ...render(
      <NuqsTestingAdapter searchParams="?robot=AMR-001" hasMemory>
        <QueryClientProvider client={client}>{node}</QueryClientProvider>
      </NuqsTestingAdapter>,
    ),
  };
}
