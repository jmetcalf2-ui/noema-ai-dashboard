import { Card } from "@/components/ui/card";
import { ChartRenderer } from "@/components/ChartRenderer";
import { Sparkline, SparkBar } from "@/components/Sparkline";
import { CorrelationMatrix, Heatmap } from "@/components/CorrelationMatrix";
import { StatCard, ProgressStat, Gauge } from "@/components/StatCard";
import { BarChart3, LineChart, PieChart, ScatterChart, Radar, TrendingUp, Activity } from "lucide-react";

const sampleBarData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5100 },
  { month: "Mar", revenue: 4800 },
  { month: "Apr", revenue: 6200 },
  { month: "May", revenue: 5900 },
  { month: "Jun", revenue: 7100 },
];

const sampleLineData = [
  { date: "Week 1", users: 1200, sessions: 2400 },
  { date: "Week 2", users: 1900, sessions: 3200 },
  { date: "Week 3", users: 1700, sessions: 2900 },
  { date: "Week 4", users: 2400, sessions: 4100 },
  { date: "Week 5", users: 2800, sessions: 4600 },
];

const samplePieData = [
  { category: "Product A", sales: 4500 },
  { category: "Product B", sales: 3200 },
  { category: "Product C", sales: 2800 },
  { category: "Product D", sales: 1900 },
];

const sampleScatterData = [
  { x: 10, y: 30 },
  { x: 25, y: 45 },
  { x: 35, y: 55 },
  { x: 45, y: 40 },
  { x: 55, y: 65 },
  { x: 65, y: 75 },
  { x: 75, y: 60 },
  { x: 85, y: 85 },
  { x: 95, y: 70 },
];

const sampleRadarData = [
  { metric: "Speed", score: 85, benchmark: 70 },
  { metric: "Accuracy", score: 90, benchmark: 80 },
  { metric: "Reliability", score: 75, benchmark: 85 },
  { metric: "Efficiency", score: 80, benchmark: 75 },
  { metric: "Scalability", score: 70, benchmark: 65 },
  { metric: "Security", score: 95, benchmark: 90 },
];

const sampleCorrelation: Record<string, Record<string, number>> = {
  Revenue: { Revenue: 1, Users: 0.85, Sessions: 0.72, Bounce: -0.45 },
  Users: { Revenue: 0.85, Users: 1, Sessions: 0.92, Bounce: -0.38 },
  Sessions: { Revenue: 0.72, Sessions: 1, Users: 0.92, Bounce: -0.55 },
  Bounce: { Revenue: -0.45, Users: -0.38, Sessions: -0.55, Bounce: 1 },
};

const sampleHeatmapData = [
  { x: "Mon", y: "9AM", value: 45 },
  { x: "Mon", y: "12PM", value: 72 },
  { x: "Mon", y: "3PM", value: 68 },
  { x: "Mon", y: "6PM", value: 55 },
  { x: "Tue", y: "9AM", value: 52 },
  { x: "Tue", y: "12PM", value: 85 },
  { x: "Tue", y: "3PM", value: 78 },
  { x: "Tue", y: "6PM", value: 48 },
  { x: "Wed", y: "9AM", value: 48 },
  { x: "Wed", y: "12PM", value: 90 },
  { x: "Wed", y: "3PM", value: 82 },
  { x: "Wed", y: "6PM", value: 60 },
  { x: "Thu", y: "9AM", value: 55 },
  { x: "Thu", y: "12PM", value: 88 },
  { x: "Thu", y: "3PM", value: 75 },
  { x: "Thu", y: "6PM", value: 42 },
  { x: "Fri", y: "9AM", value: 62 },
  { x: "Fri", y: "12PM", value: 78 },
  { x: "Fri", y: "3PM", value: 65 },
  { x: "Fri", y: "6PM", value: 35 },
];

const sparklineData = [12, 15, 18, 14, 22, 25, 28, 24, 30, 35, 32, 38];
const sparkBarData = [45, 52, 48, 60, 55, 72, 68, 75, 80, 85, 78, 92];

export default function VisualizationShowcase() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-visualizations">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">Visualization Components</h1>
          <p className="text-muted-foreground text-[14px]" data-testid="text-page-description">
            A showcase of available data visualization components for building insightful dashboards.
          </p>
        </div>

        <section className="mb-12" data-testid="section-stat-cards">
          <h2 className="text-lg font-medium mb-5 flex flex-wrap items-center gap-2" data-testid="text-section-stat-cards">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Stat Cards with Sparklines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Revenue"
              value="$124,500"
              change={12.5}
              trend={sparklineData}
              trendType="line"
            />
            <StatCard
              label="Active Users"
              value="8,420"
              change={-3.2}
              trend={sparkBarData}
              trendType="bar"
            />
            <StatCard
              label="Conversion Rate"
              value="3.42%"
              change={0.8}
              trend={sparklineData}
              trendType="line"
            />
            <StatCard
              label="Avg Session"
              value="4m 32s"
              change={5.1}
              trend={sparkBarData}
              trendType="bar"
            />
          </div>
        </section>

        <section className="mb-12" data-testid="section-progress-gauges">
          <h2 className="text-lg font-medium mb-5 flex flex-wrap items-center gap-2" data-testid="text-section-progress-gauges">
            <Activity className="w-5 h-5 text-blue-500" />
            Progress & Gauge Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-5" data-testid="card-progress-stats">
              <h3 className="text-[13px] font-medium mb-4" data-testid="text-progress-title">Project Progress</h3>
              <div className="space-y-4">
                <ProgressStat label="Design" value={85} color="blue" />
                <ProgressStat label="Development" value={62} color="blue" />
                <ProgressStat label="Testing" value={28} color="blue" />
                <ProgressStat label="Deployment" value={10} color="blue" />
              </div>
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center" data-testid="card-gauge-performance">
              <Gauge value={72} label="Performance" color="blue" size={140} />
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center" data-testid="card-gauge-uptime">
              <Gauge value={88} label="Uptime" color="blue" size={140} />
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center" data-testid="card-gauge-capacity">
              <Gauge value={45} label="Capacity" color="blue" size={140} />
            </Card>
          </div>
        </section>

        <section className="mb-12" data-testid="section-core-charts">
          <h2 className="text-lg font-medium mb-5 flex flex-wrap items-center gap-2" data-testid="text-section-core-charts">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Core Chart Types
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartRenderer
              config={{
                type: "bar",
                title: "Monthly Revenue",
                description: "Revenue performance over the past 6 months",
                dataKey: "revenue",
                categoryKey: "month",
                data: sampleBarData,
              }}
            />
            <ChartRenderer
              config={{
                type: "line",
                title: "User Growth",
                description: "Weekly active users trend",
                dataKey: "users",
                categoryKey: "date",
                data: sampleLineData,
              }}
            />
            <ChartRenderer
              config={{
                type: "area",
                title: "Session Activity",
                description: "Total sessions per week",
                dataKey: "sessions",
                categoryKey: "date",
                data: sampleLineData,
              }}
            />
            <ChartRenderer
              config={{
                type: "pie",
                title: "Sales Distribution",
                description: "Sales breakdown by product category",
                dataKey: "sales",
                categoryKey: "category",
                data: samplePieData,
              }}
            />
          </div>
        </section>

        <section className="mb-12" data-testid="section-advanced-charts">
          <h2 className="text-lg font-medium mb-5 flex flex-wrap items-center gap-2" data-testid="text-section-advanced-charts">
            <ScatterChart className="w-5 h-5 text-blue-500" />
            Advanced Charts
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartRenderer
              config={{
                type: "scatter",
                title: "Correlation Analysis",
                description: "Relationship between X and Y variables",
                dataKey: "y",
                xAxisKey: "x",
                yAxisKey: "y",
                data: sampleScatterData,
              }}
            />
            <ChartRenderer
              config={{
                type: "radar",
                title: "Performance Metrics",
                description: "Score vs benchmark comparison across dimensions",
                dataKey: "score",
                secondaryDataKey: "benchmark",
                categoryKey: "metric",
                data: sampleRadarData,
              }}
            />
            <ChartRenderer
              config={{
                type: "horizontal_bar",
                title: "Product Comparison",
                description: "Sales by product category",
                dataKey: "sales",
                categoryKey: "category",
                data: samplePieData,
              }}
            />
            <ChartRenderer
              config={{
                type: "composed",
                title: "Revenue vs Users",
                description: "Combining bar and line chart for multi-metric analysis",
                dataKey: "users",
                secondaryDataKey: "sessions",
                categoryKey: "date",
                data: sampleLineData,
              }}
            />
          </div>
        </section>

        <section className="mb-12" data-testid="section-matrix-heatmap">
          <h2 className="text-lg font-medium mb-5 flex flex-wrap items-center gap-2" data-testid="text-section-matrix-heatmap">
            <Radar className="w-5 h-5 text-blue-500" />
            Matrix & Heatmap Visualizations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6" data-testid="card-correlation-matrix">
              <div className="mb-4">
                <h3 className="font-medium text-[15px]" data-testid="text-correlation-title">Correlation Matrix</h3>
                <p className="text-xs text-muted-foreground" data-testid="text-correlation-desc">
                  Shows relationships between different metrics
                </p>
              </div>
              <CorrelationMatrix data={sampleCorrelation} size="md" />
            </Card>
            <Card className="p-6" data-testid="card-activity-heatmap">
              <div className="mb-4">
                <h3 className="font-medium text-[15px]" data-testid="text-heatmap-title">Activity Heatmap</h3>
                <p className="text-xs text-muted-foreground" data-testid="text-heatmap-desc">
                  User activity by day and time
                </p>
              </div>
              <Heatmap 
                data={sampleHeatmapData} 
                xLabels={["Mon", "Tue", "Wed", "Thu", "Fri"]}
                yLabels={["9AM", "12PM", "3PM", "6PM"]}
                colorScale="blue"
              />
            </Card>
          </div>
        </section>

        <section className="mb-12" data-testid="section-sparklines">
          <h2 className="text-lg font-medium mb-5 flex flex-wrap items-center gap-2" data-testid="text-section-sparklines">
            <LineChart className="w-5 h-5 text-blue-500" />
            Inline Sparklines
          </h2>
          <Card className="p-6" data-testid="card-sparkline-examples">
            <p className="text-[14px] text-muted-foreground mb-6">
              Compact sparklines for embedding in tables, cards, or inline with text.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col gap-2" data-testid="sparkline-line">
                <span className="text-[12px] font-medium text-muted-foreground">Line Sparkline</span>
                <Sparkline data={sparklineData} width={140} height={40} showEndDot />
              </div>
              <div className="flex flex-col gap-2" data-testid="sparkline-bar">
                <span className="text-[12px] font-medium text-muted-foreground">Bar Sparkline</span>
                <SparkBar data={sparkBarData} width={140} height={40} />
              </div>
              <div className="flex flex-col gap-2" data-testid="sparkline-dots">
                <span className="text-[12px] font-medium text-muted-foreground">With Dots</span>
                <Sparkline data={sparklineData} width={140} height={40} showDots showEndDot={false} />
              </div>
              <div className="flex flex-col gap-2" data-testid="sparkline-downtrend">
                <span className="text-[12px] font-medium text-muted-foreground">Downtrend</span>
                <Sparkline data={[85, 78, 72, 68, 60, 55, 48, 42, 38, 35, 32, 28]} width={140} height={40} />
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
