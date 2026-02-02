"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface InsightMetricProps {
    label: string;
    value: string | number;
    insight: string;
    trend: "up" | "down" | "neutral";
    data: number[]; // Sparkline data
    color?: string;
    className?: string;
}

export function InsightMetric({
    label,
    value,
    insight,
    trend,
    data,
    color = "#8b5cf6",
    className,
}: InsightMetricProps) {
    const chartData = data.map((val, i) => ({ i, val }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={cn("h-full", className)}
        >
            <Card className="h-full overflow-hidden border-l-4" style={{ borderLeftColor: color }}>
                <CardContent className="p-6 h-full flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{label}</p>
                            <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
                        </div>
                        <div className="p-2 bg-primary/5 rounded-full">
                            <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                    </div>

                    <div className="h-16 w-full -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke={color}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${label})`}
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg text-xs leading-relaxed text-muted-foreground border border-border/50">
                        <span className="font-semibold text-foreground mr-1">AI Insight:</span>
                        {insight}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
