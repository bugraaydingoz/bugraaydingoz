import { HotelMap } from "@/components/map/HotelMap";
import { RobotsPanel } from "@/components/robots/RobotsPanel";

function App() {
  return (
    <main className="grid h-dvh grid-cols-[384px_minmax(0,1fr)] overflow-hidden bg-muted/40 max-md:grid-cols-1 max-md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-h-0 p-4 pr-2 max-md:row-start-2 max-md:p-3 max-md:pt-0">
        <RobotsPanel className="max-md:w-full" />
      </div>
      <div className="min-h-0 min-w-0 p-4 pl-2 max-md:row-start-1 max-md:p-3">
        <HotelMap />
      </div>
    </main>
  );
}

export default App;
