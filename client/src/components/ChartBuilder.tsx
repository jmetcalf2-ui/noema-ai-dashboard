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
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "area", label: "Area Chart", icon: AreaChart },
  { value: "pie", label: "Pie Chart", icon: PieChart },
];

export function ChartBuilder({ data, onChartCreate }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<string>("");
  const [categoryKey, setCategoryKey] = useState<string>("");
  const [dataKey, setDataKey] = useState<string>("");

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const numericColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return columns.filter((col) => {
      const val = data[0][col];
      return typeof val === "number" || !isNaN(parseFloat(val));
    });
  }, [data, columns]);

  const previewConfig = useMemo(() => {
    if (!chartType || !categoryKey || !dataKey) return null;

    const aggregated = data.reduce((acc, row) => {
      const key = String(row[categoryKey]);
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

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Custom Chart Builder</h3>
        {previewConfig && (
          <Button size="sm" onClick={handleCreate} data-testid="button-create-chart">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Chart
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label className="text-xs">Chart Type</Label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger data-testid="select-chart-type">
              <SelectValue placeholder="Select type" />
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

        <div className="space-y-2">
          <Label className="text-xs">Category (X-Axis)</Label>
          <Select value={categoryKey} onValueChange={setCategoryKey}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="Select column" />
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

        <div className="space-y-2">
          <Label className="text-xs">Value (Y-Axis)</Label>
          <Select value={dataKey} onValueChange={setDataKey}>
            <SelectTrigger data-testid="select-value">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {numericColumns.length > 0 ? (
                numericColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))
              ) : (
                columns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {previewConfig ? (
        <div className="border rounded-lg p-4 bg-secondary/20">
          <ChartRenderer config={previewConfig as any} />
        </div>
      ) : (
        <div className="border rounded-lg p-8 bg-secondary/20 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Select chart type and columns to preview
          </p>
        </div>
      )}
    </Card>
  );
}
