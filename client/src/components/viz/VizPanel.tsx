import React, { useState } from "react";
import { Loader2, Sparkles, SendHorizontal, AlertTriangle, TrendingUp, Hash } from "lucide-react";
import { profileDataset } from "@/lib/viz/Profiler";
import type { VizPlan, DatasetProfile } from "../../../../shared/viz";
import { VizRenderer } from "./VizRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface VizPanelProps {
    data: Record<string, any>[];
    mode?: "client_research" | "editorial_analysis";
}

export function VizPanel({ data, mode = "client_research" }: VizPanelProps) {
    const [question, setQuestion] = useState("");
    const [plan, setPlan] = useState<VizPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const profile = React.useMemo(() => {
        return profileDataset(data);
    }, [data]);

    async function handleGenerate(q?: string) {
        const targetQ = q || question;
        if (!targetQ) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/viz/plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    question: targetQ,
                    datasetProfile: profile,
                    rowsSample: data.slice(0, 500),
                }),
            });

            if (!res.ok) throw new Error("Failed to generate plan");

            const json = await res.json();
            setPlan(json.plan);
        } catch (e) {
            console.error(e);
            setError("Failed to generate visualization. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const suggestions = React.useMemo(() => {
        const s = [];
        if (profile.numericColumns.length > 0) s.push(`Distribution of ${profile.numericColumns[0]}`);
        if (profile.datetimeColumns.length > 0) s.push(`Trend over time`);
        if (profile.categoricalColumns.length > 0 && profile.numericColumns.length > 0)
            s.push(`Compare ${profile.numericColumns[0]} by ${profile.categoricalColumns[0]}`);
        return s.slice(0, 3);
    }, [profile]);

    return (
        <div className="space-y-6">
            <Card className="p-6 border-border/50 bg-card clean-card">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">Visualization Intelligence</h2>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask a question about your data..."
                                className="pr-12 bg-background border-border/50 h-10"
                                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                                data-testid="input-viz-question"
                            />
                        </div>
                        <Button onClick={() => handleGenerate()} disabled={loading || !question} size="sm" className="h-10 px-4" data-testid="button-generate-viz">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => { setQuestion(s); handleGenerate(s); }}
                                className="text-xs px-2.5 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                                data-testid={`button-suggestion-${i}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {profile.warnings.length > 0 && (
                <Card className="p-5 clean-card border-l-4 border-l-amber-500">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Data Quality Notes
                    </h3>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {profile.warnings.slice(0, 5).map((w, i) => (
                            <li key={i}>{w}</li>
                        ))}
                    </ul>
                </Card>
            )}

            {profile.correlations && profile.correlations.length > 0 && (
                <Card className="p-5 clean-card">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Detected Correlations
                    </h3>
                    <div className="space-y-2">
                        {profile.correlations.slice(0, 5).map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{c.a} ↔ {c.b}</span>
                                <span className={`font-medium px-2 py-0.5 rounded-full ${Math.abs(c.r) > 0.7 ? "text-green-600 bg-green-50 border border-green-100" : "text-blue-600 bg-blue-50 border border-blue-100"}`}>
                                    r = {c.r.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {profile.columns.some(c => c.outlierCount && c.outlierCount > 0) && (
                <Card className="p-5 clean-card">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-amber-500" />
                        Detected Outliers
                    </h3>
                    <div className="space-y-2">
                        {profile.columns.filter(c => c.outlierCount && c.outlierCount > 0).slice(0, 5).map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{c.name}</span>
                                <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                    {c.outlierCount} outliers
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {error && <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">{error}</div>}

            {plan && (
                <div className="space-y-6 animate-in fade-in-20 slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">{plan.title}</h3>
                            <p className="text-muted-foreground text-sm max-w-2xl mt-1">{plan.rationale}</p>
                        </div>
                        <Badge variant={plan.complexity === "complex" ? "destructive" : "secondary"}>
                            {plan.complexity} mode
                        </Badge>
                    </div>

                    <VizRenderer plan={plan} data={data} />
                </div>
            )}
        </div>
    );
}
