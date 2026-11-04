import { useEffect, useRef } from "react";
import { useRobotsStore } from "../stores/robots.store";
import { useRobotFilter } from "./use-robot-filter";
import { useSelectedRobot } from "./use-selected-robot";

export function useRobotSelection(filter: ReturnType<typeof useRobotFilter>[0]) {
  const [selectedId, setSelectedId] = useSelectedRobot();
  const hoverRobot = useRobotsStore((state) => state.hoverRobot);
  const selectedCard = useRef<HTMLLIElement>(null);

  useEffect(() => {
    selectedCard.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId, filter]);

  return { selectedId, setSelectedId, hoverRobot, selectedCard };
}
