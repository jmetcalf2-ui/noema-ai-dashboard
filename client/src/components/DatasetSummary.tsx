import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { 
  Rows3, 
  Columns3, 
  Hash, 
  Type, 
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DatasetSummaryProps {
  headers: string[];
  rows: any[];
}

interface ColumnStats {
  name: string;
  type: "numeric" | "text" | "date" | "boolean" | "mixed";
  missingCount: number;
  missingPercent: number;
  uniqueCount: number;
}

interface QualityFlag {
  type: "warning" | "info";
  message: string;
}

export function DatasetSummary({ headers, rows }: DatasetSummaryProps) {
  const stats = useMemo(() => {
    const columnStats: ColumnStats[] = headers.map(header => {
      let numericCount = 0;
      let textCount = 0;
      let dateCount = 0;
      let booleanCount = 0;
      let missingCount = 0;
      const uniqueValues = new Set<string>();

      rows.forEach(row => {
        const value = row[header];
        
        if (value === null || value === undefined || value === "" || value === "null" || value === "undefined") {
          missingCount++;
          return;
        }

        uniqueValues.add(String(value));

        if (typeof value === "number" && !isNaN(value)) {
          numericCount++;
        } else if (typeof value === "boolean" || value === "true" || value === "false") {
          booleanCount++;
        } else if (typeof value === "string") {
          const datePattern = /^\d{4}[-/]\d{2}[-/]\d{2}|^\d{2}[-/]\d{2}[-/]\d{4}/;
          if (datePattern.test(value) || !isNaN(Date.parse(value))) {
            dateCount++;
          } else {
            textCount++;
          }
        }
      });

      const total = rows.length - missingCount;
      let type: ColumnStats["type"] = "mixed";
      if (total > 0) {
        if (numericCount / total > 0.8) type = "numeric";
        else if (dateCount / total > 0.8) type = "date";
        else if (booleanCount / total > 0.8) type = "boolean";
        else if (textCount / total > 0.5) type = "text";
      }

      return {
        name: header,
        type,
        missingCount,
        missingPercent: rows.length > 0 ? (missingCount / rows.length) * 100 : 0,
        uniqueCount: uniqueValues.size,
      };
    });

    // Calculate quality flags
    const qualityFlags: QualityFlag[] = [];
    
    const highMissingCols = columnStats.filter(c => c.missingPercent > 20);
    if (highMissingCols.length > 0) {
      qualityFlags.push({
        type: "warning",
        message: `${highMissingCols.length} column${highMissingCols.length > 1 ? 's' : ''} with >20% missing data`
      });
    }

    const constantCols = columnStats.filter(c => c.uniqueCount <= 1 && c.missingCount < rows.length);
    if (constantCols.length > 0) {
      qualityFlags.push({
        type: "info",
        message: `${constantCols.length} column${constantCols.length > 1 ? 's have' : ' has'} constant values`
      });
    }

    // Check for potential duplicates (simplified)
    const rowStrings = rows.slice(0, 500).map(r => JSON.stringify(r));
    const uniqueRows = new Set(rowStrings);
    const duplicatePercent = rowStrings.length > 0 
      ? ((rowStrings.length - uniqueRows.size) / rowStrings.length) * 100 
      : 0;
    if (duplicatePercent > 5) {
      qualityFlags.push({
        type: "warning",
        message: `Approximately ${duplicatePercent.toFixed(0)}% duplicate rows detected`
      });
    }

    const numericCols = columnStats.filter(c => c.type === "numeric").length;
    const textCols = columnStats.filter(c => c.type === "text").length;
    const dateCols = columnStats.filter(c => c.type === "date").length;
    const totalMissing = columnStats.reduce((sum, c) => sum + c.missingCount, 0);
    const totalCells = rows.length * headers.length;
    const overallMissingPercent = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;

    return {
      rowCount: rows.length,
      columnCount: headers.length,
      numericCols,
      textCols,
      dateCols,
      overallMissingPercent,
      columnStats,
      qualityFlags,
    };
  }, [headers, rows]);

  const typeIcons = {
    numeric: Hash,
    text: Type,
    date: Calendar,
    boolean: CheckCircle2,
    mixed: Type,
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dataset Overview</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Rows3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{stats.rowCount.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Rows</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Columns3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{stats.columnCount}</p>
            <p className="text-[11px] text-muted-foreground">Columns</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Hash className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{stats.numericCols}</p>
            <p className="text-[11px] text-muted-foreground">Numeric</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Type className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">{stats.textCols}</p>
            <p className="text-[11px] text-muted-foreground">Text</p>
          </div>
        </div>
      </div>

      {stats.qualityFlags.length > 0 && (
        <div className="space-y-3 mt-6 pt-5 border-t border-border/50">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data Quality</span>
          <div className="space-y-2">
            {stats.qualityFlags.map((flag, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center gap-3 text-xs px-4 py-3 rounded-md",
                  flag.type === "warning" 
                    ? "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" 
                    : "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/30"
                )}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{flag.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.overallMissingPercent > 0 && (
        <div className="text-[12px] text-muted-foreground">
          Overall data completeness: <span className="font-medium text-foreground">{(100 - stats.overallMissingPercent).toFixed(1)}%</span>
        </div>
      )}
    </Card>
  );
}
