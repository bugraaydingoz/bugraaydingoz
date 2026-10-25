import { create } from "zustand";

type Filter = "all" | "active" | "attention";
type FleetState = {
  filter: Filter;
  selectedId: string | null;
  hoveredId: string | null;
  hoverRobot: (id: string | null) => void;
  setFilter: (filter: Filter) => void;
  toggleRobot: (id: string) => void;
  selectRobot: (id: string) => void;
};

export const useFleet = create<FleetState>((set) => ({
  filter: "all",
  selectedId: "AMR-001",
  hoveredId: null,
  hoverRobot: (id) => set({ hoveredId: id }),
  setFilter: (filter) => set({ filter, hoveredId: null }),
  toggleRobot: (id) => set((state) => ({ selectedId: state.selectedId === id ? null : id })),
  // A map selection reveals its card even if a list filter previously hid it.
  selectRobot: (id) => set({ selectedId: id, filter: "all" }),
}));
