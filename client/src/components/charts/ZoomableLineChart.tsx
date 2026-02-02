"use client";

import * as React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Brush,
    AreaChart,
    Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ZoomIn, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataPoint {
    date: string;
    value: number;
    [key: string]: any;
}

interface ZoomableLineChartProps {
    data: DataPoint[];
    title?: string;
    description?: string;
    dataKey?: string;
    color?: string;
    height?: number;
}

export function ZoomableLineChart({
    data,
    title = "Zoomable Trend",
    description = "Drag the slider below to zoom into specific time periods.",
    dataKey = "value",
    color = "#3b82f6",
    height = 400,
}: ZoomableLineChartProps) {
    // We can add state here if we want to programmatically control zoom, 
    // but Recharts Brush handles interaction internally very well.

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="p-2 bg-secondary rounded-full">
                                <ZoomIn className="w-4 h-4 text-secondary-foreground" />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div style={{ width: "100%", height: height }}>
                        <ResponsiveContainer>
                            <AreaChart
                                data={data}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background)/0.9)",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={dataKey}
                                    stroke={color}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    animationDuration={1500}
                                />
                                <Brush
                                    dataKey="date"
                                    height={30}
                                    stroke={color}
                                    fill="hsl(var(--background))"
                                    travellerWidth={10}
                                    tickFormatter={(val) => val}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
