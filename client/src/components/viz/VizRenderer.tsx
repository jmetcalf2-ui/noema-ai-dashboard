import React from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    AreaChart,
    Area,
    ComposedChart,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { VizPlan, ViewSpec, Transform } from "../../../../shared/viz";

interface VizRendererProps {
    plan: VizPlan;
    data: Record<string, any>[]; // The raw data matching plan.datasets[0] source
}

// Simple transform runner (subset)
function runTransforms(rows: any[], transforms: Transform[]): any[] {
    let result = [...rows];

    for (const t of transforms) {
        if (t.type === "limit") {
            result = result.slice(0, t.n);
        }
        // Implement sort, filter, etc. as needed for MVP
        if (t.type === "sort") {
            result.sort((a, b) => {
                const valA = a[t.by];
                const valB = b[t.by];
                if (valA < valB) return t.order === "asc" ? -1 : 1;
                if (valA > valB) return t.order === "asc" ? 1 : -1;
                return 0;
            })
        }
        if (t.type === "filter") {
            // Very basic filter support for now
            // e.g. "x > 0"
            // In real app use a parser
        }
    }
    return result;
}

export function VizRenderer({ plan, data }: VizRendererProps) {
    // 1. Prepare datasets
    const processedData = React.useMemo(() => {
        const datasetMap: Record<string, any[]> = {};
        for (const ds of plan.datasets) {
            if (ds.source === "filtered_rows") {
                datasetMap[ds.name] = runTransforms(data, ds.transforms);
            }
        }
        return datasetMap;
    }, [plan, data]);

    return (
        <div className="space-y-8">
            {plan.views.map((view) => (
                <div key={view.id} className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                    <h3 className="mb-4 text-sm font-medium text-foreground/80 font-mono uppercase tracking-wider">
                        {view.kind.replace("_", " ")}: {Object.values(view.encodings).join(" vs ")}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ViewComponent view={view} data={processedData[view.dataset] || []} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ViewComponent({ view, data }: { view: ViewSpec; data: any[] }) {
    const { kind, encodings, options } = view;

    if (kind === "table") {
        const headers = Object.keys(data[0] || {});
        return (
            <div className="h-full w-full overflow-auto rounded-md border text-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 sticky top-0">
                        <tr>
                            {headers.map(h => <th key={h} className="p-2 font-medium">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 100).map((row, i) => (
                            <tr key={i} className="border-t hover:bg-muted/20">
                                {headers.map(h => <td key={h} className="p-2 text-muted-foreground">{String(row[h]).slice(0, 50)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Common Charts
    if (kind === "bar") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey={encodings.x} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px", color: "#fff" }}
                        itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey={encodings.y || ""} fill={encodings.color ? undefined : "hsl(var(--primary))"} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    if (kind === "line") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey={encodings.x} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px", color: "#fff" }}
                    />
                    {options?.confidenceBand && (
                        <Area
                            type="monotone"
                            dataKey={(d) => [d[options.confidenceBand!.lower], d[options.confidenceBand!.upper]]}
                            stroke="none"
                            fill="hsl(var(--primary))"
                            fillOpacity={options.confidenceBand.opacity || 0.15}
                            isAnimationActive={false}
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey={encodings.y}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        );
    }

    if (kind === "histogram") {
        // Recharts doesn't have native histogram, simulate with Bar for now or just render Bar
        // In a real implementation we would bin the data in `runTransforms`
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey={encodings.x} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey={encodings.y || "count"} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    return (
        <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
            Unsupported view kind: {kind}
        </div>
    );
}
