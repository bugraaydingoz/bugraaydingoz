import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/utils";

// Adapted from the supplied MapViewport: all child layers share one fixed-angle camera.
export function MapViewport({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const instructionsId = useId();
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [pointerFocus, setPointerFocus] = useState(false);
  const pan = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoom = (factor: number, x: number, y: number) =>
    setView((v) => {
      const next = Math.max(0.65, Math.min(3, v.zoom * factor));
      const ratio = next / v.zoom;
      return { zoom: next, x: x - (x - v.x) * ratio, y: y - (y - v.y) * ratio };
    });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = el.getBoundingClientRect();
      zoom(
        Math.exp(-event.deltaY * 0.0015),
        event.clientX - bounds.left,
        event.clientY - bounds.top,
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  const centerZoom = (factor: number) => {
    if (host.current) zoom(factor, host.current.clientWidth / 2, host.current.clientHeight / 2);
  };
  const reset = () => setView({ x: 0, y: 0, zoom: 1 });

  return (
    <div
      ref={host}
      className={cn(
        "relative h-full min-h-0 w-full touch-none overflow-hidden bg-background cursor-grab active:cursor-grabbing outline-none",
        !pointerFocus &&
          "focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      style={style}
      role="group"
      aria-label="Hotel map canvas"
      aria-describedby={instructionsId}
      tabIndex={0}
      onPointerDown={(event) => {
        if (
          event.button !== 0 ||
          (event.target as Element).closest("button,[data-map-interactive]")
        )
          return;
        setPointerFocus(true);
        event.currentTarget.focus({ preventScroll: true });
        pan.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const p = pan.current;
        if (!p || p.id !== event.pointerId) return;
        const dx = event.clientX - p.x,
          dy = event.clientY - p.y;
        p.x = event.clientX;
        p.y = event.clientY;
        setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }}
      onPointerUp={() => {
        pan.current = null;
      }}
      onPointerCancel={() => {
        pan.current = null;
      }}
      onLostPointerCapture={() => {
        pan.current = null;
      }}
      onBlur={(event) => {
        if (event.target === event.currentTarget) setPointerFocus(false);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        setPointerFocus(false);
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "0"].includes(
            event.key,
          )
        )
          event.preventDefault();
        const moves: Record<string, [number, number]> = {
          ArrowLeft: [-40, 0],
          ArrowRight: [40, 0],
          ArrowUp: [0, -40],
          ArrowDown: [0, 40],
        };
        const move = moves[event.key];
        if (move) setView((v) => ({ ...v, x: v.x + move[0], y: v.y + move[1] }));
        if (event.key === "+" || event.key === "=") centerZoom(1.2);
        if (event.key === "-") centerZoom(1 / 1.2);
        if (event.key === "0") reset();
      }}
    >
      <p id={instructionsId} className="sr-only">
        Drag empty space to pan. Scroll to zoom at the cursor. Use arrow keys to pan, plus and minus
        to zoom, and zero to reset.
      </p>
      <div
        data-slot="map-grid"
        aria-hidden="true"
        className="map-grid pointer-events-none absolute inset-0"
        style={
          {
            "--map-grid-step": `${24 * view.zoom}px`,
            "--map-grid-major-step": `${120 * view.zoom}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          } as CSSProperties
        }
      />
      <div
        data-slot="map-layers"
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
      >
        {children}
      </div>
      <Card
        role="group"
        aria-label="Map navigation"
        className="absolute right-6 bottom-6 flex-row gap-1 p-1 max-md:right-3 max-md:bottom-3"
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          onClick={() => centerZoom(1 / 1.2)}
        >
          <Minus aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Reset map view" onClick={reset}>
          {Math.round(view.zoom * 100)}%
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => centerZoom(1.2)}>
          <Plus aria-hidden="true" />
        </Button>
      </Card>
    </div>
  );
}
