import React, { useState } from "react";
import { Loader2, Sparkles, SendHorizontal } from "lucide-react";
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

    // 1. Profile data on load (memoized)
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

    // Auto-suggestions
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
            {/* Input Section */}
            <Card className="p-6 border-border/50 bg-card/40 backdrop-blur-xl">
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
                                className="pr-12 bg-background/50 border-border/50 h-10"
                                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                            />
                        </div>
                        <Button onClick={() => handleGenerate()} disabled={loading || !question} size="sm" className="h-10 px-4">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                        </Button>
                    </div>

                    {/* Suggestions */}
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => { setQuestion(s); handleGenerate(s); }}
                                className="text-xs px-2.5 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Results Section */}
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
