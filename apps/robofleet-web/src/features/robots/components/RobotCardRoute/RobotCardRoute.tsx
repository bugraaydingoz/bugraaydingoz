import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export function RobotCardRoute({
  location,
  destination,
}: {
  location: string;
  destination: string | null;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
      <div className="min-w-0">
        <p className="mb-1 text-[10px] text-muted-foreground">Current location</p>
        <p className="truncate" title={location}>
          {location}
        </p>
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 text-right">
        <p className="mb-1 text-[10px] text-muted-foreground">Destination</p>
        <p
          className={cn("truncate", !destination && "text-muted-foreground")}
          title={destination ?? "Unassigned"}
        >
          {destination ?? "Unassigned"}
        </p>
      </div>
    </div>
  );
}
