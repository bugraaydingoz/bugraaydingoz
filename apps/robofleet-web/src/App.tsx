import { HotelMap } from "@/components/map/HotelMap";
import { NavigationRail } from "@/components/layout/NavigationRail";
import { RobotsPanel } from "@/components/robots/RobotsPanel";

function App() {
  return (
    <div className="flex h-dvh overflow-hidden bg-muted">
      <NavigationRail />
      <main className="grid min-w-0 flex-1 grid-cols-[368px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-h-0 py-4 pr-2 max-md:row-start-2 max-md:p-3 max-md:pt-0 max-md:pl-0">
          <RobotsPanel className="max-md:w-full" />
        </div>
        <div className="min-h-0 min-w-0 p-4 pl-2 max-md:row-start-1 max-md:p-3 max-md:pl-0">
          <HotelMap />
        </div>
      </main>
    </div>
  );
}

export default App;
