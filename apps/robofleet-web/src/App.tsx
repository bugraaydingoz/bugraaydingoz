import { useState } from "react";
import { ApiHealth } from "@/lib/components/app/api-health";
import { Button } from "@/lib/components/ui/button";

function App() {
  const [count, setCount] = useState(0);
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">RoboFleet</h1>
      <p className="mt-2 text-muted-foreground">A fleet management system for robots.</p>

      <div className="mt-8">
        <Button onClick={() => setCount((c) => c + 1)}>Count: {count}</Button>
      </div>

      <ApiHealth />
    </main>
  );
}

export default App;
