import { Bot, CircleUserRound, Clock3, House, LibraryBig } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { label: "Home", icon: House, current: true },
  { label: "Robots", icon: Bot },
  { label: "Time", icon: Clock3 },
  { label: "Library", icon: LibraryBig },
];

export function NavigationRail() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full w-16 shrink-0 flex-col items-center justify-between py-4 max-md:w-14 max-md:py-3"
    >
      <div className="flex flex-col gap-2">
        {items.map(({ label, icon: Icon, current }) => (
          <Button
            key={label}
            variant="navigation"
            size="icon-nav"
            aria-label={label}
            aria-current={current ? "page" : undefined}
            title={label}
          >
            <Icon aria-hidden="true" />
          </Button>
        ))}
      </div>
      <Button variant="navigation" size="icon-nav" aria-label="Profile" title="Profile">
        <CircleUserRound aria-hidden="true" />
      </Button>
    </nav>
  );
}
