interface MissingnessStripProps {
  data: Array<{ column: string; missingRate: number }>;
  height?: number;
  className?: string;
}

export function MissingnessStrip({
  data,
  height = 60,
  className = ""
}: MissingnessStripProps) {
  if (!data || data.length === 0) return null;

  const sortedData = [...data].sort((a, b) => b.missingRate - a.missingRate);

  return (
    <div className={`w-full ${className}`} style={{ minHeight: height }}>
      <div className="space-y-1.5">
        {sortedData.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-24 truncate" title={item.column}>
              {item.column}
            </span>
            <div className="flex-1 h-3 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.missingRate > 0.5 
                    ? "bg-red-500" 
                    : item.missingRate > 0.25 
                      ? "bg-amber-500" 
                      : "bg-slate-400"
                }`}
                style={{ width: `${item.missingRate * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium w-10 text-right tabular-nums text-muted-foreground">
              {(item.missingRate * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
