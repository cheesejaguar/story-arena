import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="space-y-6">
      {message && (
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="mb-4 h-6 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[88%]" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
