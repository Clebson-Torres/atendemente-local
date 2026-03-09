import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageLoading({ title = "Carregando dados..." }: { title?: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
        <div className="h-12 w-96 max-w-full animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-[32rem] max-w-full animate-pulse rounded-full bg-muted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-40 animate-pulse rounded-[28px] bg-muted/70" />
            <div className="h-24 animate-pulse rounded-[28px] bg-muted/50" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-16 animate-pulse rounded-[28px] bg-muted/70" />
            <div className="h-16 animate-pulse rounded-[28px] bg-muted/50" />
            <div className="h-16 animate-pulse rounded-[28px] bg-muted/40" />
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
