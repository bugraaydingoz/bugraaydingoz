import { create } from "zustand";

type RobotsState = {
  hoveredId: string | null;
  hoverRobot: (id: string | null) => void;
};

export const useRobotsStore = create<RobotsState>((set) => ({
  hoveredId: null,
  hoverRobot: (id) => set({ hoveredId: id }),
}));
