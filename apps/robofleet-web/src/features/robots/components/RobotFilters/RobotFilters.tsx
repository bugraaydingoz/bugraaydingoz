import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ToggleGroup/ToggleGroup";

type RobotFiltersProps = {
  filter: "all" | "active" | "attention";
  activeCount: number;
  attentionCount: number;
  onFilterChange: (filter: RobotFiltersProps["filter"]) => void;
};

export function RobotFilters({
  filter,
  activeCount,
  attentionCount,
  onFilterChange,
}: RobotFiltersProps) {
  return (
    <ToggleGroup
      value={[filter]}
      onValueChange={(value) => {
        const next = value[0];

        if (next === "all" || next === "active" || next === "attention") {
          onFilterChange(next);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Filter robots"
      className="w-full"
    >
      <ToggleGroupItem value="all" className="flex-1">
        All robots
      </ToggleGroupItem>
      <ToggleGroupItem value="active" className="flex-1">
        Active <span className="ml-1 text-[10px] opacity-50">{activeCount}</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="attention" className="flex-1">
        Attention <span className="ml-1 text-[10px] opacity-50">{attentionCount}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
