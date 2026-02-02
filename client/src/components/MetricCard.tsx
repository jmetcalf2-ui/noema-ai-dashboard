import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("p-4 glass-card border-white/5 bg-background/20", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-light tracking-tight tabular-nums text-foreground drop-shadow-lg">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={cn(
              "text-[12px] font-medium flex items-center gap-1",
              change > 0 ? "text-emerald-400" : change < 0 ? "text-rose-400" : "text-muted-foreground"
            )}>
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
              {changeLabel && <span className="text-muted-foreground/70 ml-1 font-normal">{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_-3px_rgba(124,58,237,0.3)] shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
