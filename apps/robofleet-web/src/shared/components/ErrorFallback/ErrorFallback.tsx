import { useState } from "react";
import { Button } from "@/shared/components/Button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/Card/Card";

export function ErrorFallback({
  title,
  description,
  actionLabel,
  onRetry,
  className,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onRetry: () => void | Promise<void>;
  className?: string;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const retry = async () => {
    setRetrying(true);
    setRetryFailed(false);

    try {
      await onRetry();
    } catch {
      setRetryFailed(true);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Card role="alert" aria-busy={retrying} className={className}>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {retryFailed && (
        <CardContent>
          <p>Recovery failed. Please try again.</p>
        </CardContent>
      )}
      <CardFooter>
        <Button disabled={retrying} onClick={() => void retry()}>
          {retrying ? "Retrying…" : actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
