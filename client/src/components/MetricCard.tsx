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
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-medium tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className="text-xs text-muted-foreground">
              {change > 0 ? "+" : ""}{change.toFixed(1)}%
              {changeLabel && <span className="ml-1">{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
