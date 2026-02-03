import React, { useEffect, useState } from 'react';
import {
    DataFrame,
    SemanticColumn,
    InsightMiner,
    NoemaCanvas,
    IInsight,
    SemanticType
} from '../noemaviz';

export default function DebugNoema() {
    const [insights, setInsights] = useState<IInsight[]>([]);
    const [dataFrame, setDataFrame] = useState<DataFrame | null>(null);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toISOString().split('T')[1]}: ${msg}`]);

    useEffect(() => {
        addLog("Starting NOEMAVIZ Walking Skeleton...");

        // 1. Generate Synthetic Data
        const N = 1000;
        const xRaw: number[] = [];
        const yRaw: number[] = [];

        for (let i = 0; i < N; i++) {
            const x = Math.random() * 100;
            const y = 2 * x + 50 + (Math.random() - 0.5) * 40; // y = 2x + 50 + noise
            xRaw.push(x);
            yRaw.push(y);
        }

        addLog(`Generated ${N} points of synthetic data (y = 2x + noise)`);

        // 2. Ingest into DataFrame
        const df = new DataFrame([
            new SemanticColumn("Revenue", xRaw, SemanticType.Quantitative),
            new SemanticColumn("Profit", yRaw, SemanticType.Quantitative)
        ]);

        setDataFrame(df);
        addLog("Ingested DataFrame. Semantic Types inferred.");

        // 3. Mine for Insights
        const foundInsights = InsightMiner.mine(df);
        setInsights(foundInsights);
        addLog(`Insight Engine found ${foundInsights.length} insights.`);

        foundInsights.forEach(ins => {
            addLog(`>> [${ins.type.toUpperCase()}] ${ins.title} (Score: ${ins.score.toFixed(2)})`);
        });

    }, []);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">NOEMAVIZ Debug Harness</h1>
                <p className="text-muted-foreground">Walking Skeleton Verification</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Render Output */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Canvas Renderer Output</h2>
                    <div className="h-[400px] border rounded-xl shadow-sm bg-neutral-50 p-4">
                        {dataFrame && insights.length > 0 ? (
                            <NoemaCanvas
                                spec={insights[0].spec}
                                data={dataFrame}
                                className="h-full bg-white shadow-sm"
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Waiting for engine...
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Rendering 1000 native canvas points. No external charting libraries.
                    </p>
                </div>

                {/* Right: Engine Internals */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Engine Logs & Insights</h2>

                    <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-48 overflow-y-auto">
                        {log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-medium">Detected Insights</h3>
                        {insights.map(ins => (
                            <div key={ins.id} className="p-3 border rounded-lg bg-blue-50/50 border-blue-100">
                                <div className="font-semibold text-blue-900">{ins.title}</div>
                                <div className="text-sm text-blue-800 mt-1">{ins.description}</div>
                                <div className="text-xs text-blue-600 mt-2 font-mono">
                                    CONFIDENCE: {(ins.confidence * 100).toFixed(0)}% |
                                    EVIDENCE: {ins.evidence.stat}={ins.evidence.value.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
