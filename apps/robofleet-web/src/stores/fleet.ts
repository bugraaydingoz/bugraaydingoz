import { create } from "zustand";
import { demoRobots } from "@/data/robots";

type Filter = "all" | "active" | "attention";
type FleetState = {
  filter: Filter;
  selectedId: string | null;
  setFilter: (filter: Filter) => void;
  toggleRobot: (id: string) => void;
  selectRobot: (id: string) => void;
};

export const useFleet = create<FleetState>((set) => ({
  filter: "all",
  selectedId: demoRobots[0].id,
  setFilter: (filter) => set({ filter }),
  toggleRobot: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
  // A map selection reveals its card even if a list filter previously hid it.
  selectRobot: (id) => set({ selectedId: id, filter: "all" }),
}));
