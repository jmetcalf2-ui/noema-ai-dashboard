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
import { BarChart3, LineChart, PieChart, AreaChart, Plus, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

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
      setChartType("");
      setCategoryKey("");
      setDataKey("");
    }
  };

  if (!data || data.length === 0 || columns.length === 0) {
    return null;
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <span className="text-[14px] font-medium">Create Custom Chart</span>
            <p className="text-[12px] text-muted-foreground">Build your own visualization</p>
          </div>
        </div>
        {previewConfig && (
          <Button size="sm" onClick={handleCreate} data-testid="button-create-chart">
            <Plus className="w-4 h-4 mr-1.5" />
            Add to Dashboard
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Chart Type
          </Label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="h-10" data-testid="select-chart-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2.5">
                    <type.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Category (X-Axis)
          </Label>
          <Select value={categoryKey} onValueChange={setCategoryKey}>
            <SelectTrigger className="h-10" data-testid="select-category">
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
          <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Value (Y-Axis)
          </Label>
          <Select value={dataKey} onValueChange={setDataKey}>
            <SelectTrigger className="h-10" data-testid="select-value">
              <SelectValue placeholder="Select column" />
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border rounded-xl p-4 bg-card"
        >
          <ChartRenderer config={previewConfig as any} />
        </motion.div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-10 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-[14px] text-muted-foreground">
            Select options above to preview your chart
          </p>
        </div>
      )}
    </Card>
  );
}
