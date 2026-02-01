import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartRenderer } from "./ChartRenderer";
import { BarChart3, LineChart, PieChart, AreaChart, Plus } from "lucide-react";

interface ChartBuilderProps {
  data: any[];
  onChartCreate?: (config: any) => void;
}

const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "line", label: "Line", icon: LineChart },
  { value: "area", label: "Area", icon: AreaChart },
  { value: "pie", label: "Pie", icon: PieChart },
];

export function ChartBuilder({ data, onChartCreate }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<string>("");
  const [categoryKey, setCategoryKey] = useState<string>("");
  const [dataKey, setDataKey] = useState<string>("");

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter((col) => col && col.trim() !== "");
  }, [data]);

  const numericColumns = useMemo(() => {
    if (!data || data.length === 0 || columns.length === 0) return [];
    return columns.filter((col) => {
      const val = data[0][col];
      return typeof val === "number" || !isNaN(parseFloat(val));
    });
  }, [data, columns]);

  const valueColumns = useMemo(() => {
    return numericColumns.length > 0 ? numericColumns : columns;
  }, [numericColumns, columns]);

  const previewConfig = useMemo(() => {
    if (!chartType || !categoryKey || !dataKey) return null;

    const aggregated = data.reduce((acc, row) => {
      const key = String(row[categoryKey] || "Unknown");
      if (!acc[key]) {
        acc[key] = { [categoryKey]: key, [dataKey]: 0, count: 0 };
      }
      const value = parseFloat(row[dataKey]) || 0;
      acc[key][dataKey] += value;
      acc[key].count++;
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(aggregated)
      .slice(0, 10)
      .map((item: any) => ({
        ...item,
        [dataKey]: Math.round(item[dataKey] * 100) / 100,
      }));

    return {
      type: chartType,
      title: `${dataKey} by ${categoryKey}`,
      dataKey,
      categoryKey,
      data: chartData,
    };
  }, [chartType, categoryKey, dataKey, data]);

  const handleCreate = () => {
    if (previewConfig && onChartCreate) {
      onChartCreate(previewConfig);
    }
  };

  if (!data || data.length === 0 || columns.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Custom Chart</span>
        </div>
        <div className="border rounded-lg p-6 bg-secondary/10 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            Loading data...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Custom Chart</span>
        {previewConfig && (
          <Button size="sm" onClick={handleCreate} data-testid="button-create-chart">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-chart-type">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-3.5 h-3.5" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={categoryKey} onValueChange={setCategoryKey}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-category">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Value</Label>
          <Select value={dataKey} onValueChange={setDataKey}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-value">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {valueColumns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {previewConfig ? (
        <div className="border rounded-lg p-3 bg-secondary/10">
          <ChartRenderer config={previewConfig as any} />
        </div>
      ) : (
        <div className="border rounded-lg p-6 bg-secondary/10 text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            Select options to preview
          </p>
        </div>
      )}
    </Card>
  );
}
