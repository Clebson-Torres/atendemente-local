import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card className="border-transparent bg-slate-900 text-white">
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{label}</p>
        <CardTitle className="font-display text-4xl text-white">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">{hint}</CardContent>
    </Card>
  );
}
