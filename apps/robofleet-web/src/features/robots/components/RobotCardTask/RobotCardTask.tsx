import { Progress, ProgressLabel, ProgressValue } from "@/shared/components/Progress/Progress";
import type { Robot, RobotStatus } from "@/features/robots/types/robot";

export function RobotCardTask({
  task,
  status,
  detail,
}: {
  task: NonNullable<Robot["task"]>;
  status: RobotStatus;
  detail: string;
}) {
  return (
    <>
      <Progress value={task.progress}>
        <ProgressLabel>{task.title}</ProgressLabel>
        <ProgressValue />
      </Progress>
      <dl className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-[10px] text-muted-foreground">Task ID</dt>
          <dd className="mt-1 font-mono text-[11px]">{task.id}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Distance left</dt>
          <dd className="mt-1">{task.distance}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Est. arrival</dt>
          <dd className="mt-1">{task.eta}</dd>
        </div>
      </dl>
      {status === "Blocked" && (
        <p className="text-xs leading-relaxed text-destructive">{detail}</p>
      )}
    </>
  );
}
