interface CorrelationCellProps {
  a: string;
  b: string;
  r: number;
  className?: string;
}

export function CorrelationCell({ a, b, r, className = "" }: CorrelationCellProps) {
  const absR = Math.abs(r);
  const isPositive = r > 0;
  
  // Color scale: blue for positive, red for negative
  const getColor = () => {
    if (isPositive) {
      if (absR > 0.7) return "bg-blue-500 text-white";
      if (absR > 0.5) return "bg-blue-400 text-white";
      return "bg-blue-300 text-blue-900";
    } else {
      if (absR > 0.7) return "bg-red-500 text-white";
      if (absR > 0.5) return "bg-red-400 text-white";
      return "bg-red-300 text-red-900";
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground truncate max-w-20" title={a}>{a}</span>
      <div className="flex items-center gap-1">
        <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 12h8M12 8l4 4-4 4" />
        </svg>
        <div className={`px-2 py-0.5 rounded-md font-mono text-xs font-medium ${getColor()}`}>
          {r > 0 ? "+" : ""}{r.toFixed(2)}
        </div>
        <svg className="w-4 h-4 text-muted-foreground rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 12h8M12 8l4 4-4 4" />
        </svg>
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-20" title={b}>{b}</span>
    </div>
  );
}
