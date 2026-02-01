import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Database,
  Zap,
  type LucideIcon
} from "lucide-react";

interface InsightCardProps {
  insight: string;
  category: "finding" | "trend" | "anomaly" | "quality";
  importance: "high" | "medium" | "low";
  whyItMatters?: string;
  index: number;
}

const categoryConfig: Record<string, { 
  icon: LucideIcon; 
  label: string;
  className: string;
}> = {
  finding: { 
    icon: Zap, 
    label: "Key Finding",
    className: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/50"
  },
  trend: { 
    icon: TrendingUp, 
    label: "Trend",
    className: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50"
  },
  anomaly: { 
    icon: AlertTriangle, 
    label: "Anomaly",
    className: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50"
  },
  quality: { 
    icon: Database, 
    label: "Data Quality",
    className: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50"
  },
};

export function InsightCard({ insight, category, importance, whyItMatters, index }: InsightCardProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className={cn(
        "p-4 transition-colors",
        importance === "high" && "border-l-2 border-l-indigo-500"
      )}>
        <div className="flex gap-3">
          <div className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            config.className
          )}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {config.label}
              </span>
              {importance === "high" && (
                <span className="text-[9px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  High Impact
                </span>
              )}
            </div>
            <p className="text-[14px] leading-relaxed text-foreground">
              {insight}
            </p>
            {whyItMatters && (
              <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
                <span className="font-medium">Why this matters:</span> {whyItMatters}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Utility to categorize and enhance insights
export function categorizeInsight(text: string): { 
  category: "finding" | "trend" | "anomaly" | "quality";
  importance: "high" | "medium" | "low";
  whyItMatters: string;
} {
  const lowerText = text.toLowerCase();
  
  // Determine category
  let category: "finding" | "trend" | "anomaly" | "quality" = "finding";
  if (lowerText.includes("trend") || lowerText.includes("increas") || lowerText.includes("decreas") || lowerText.includes("grow") || lowerText.includes("declin")) {
    category = "trend";
  } else if (lowerText.includes("anomal") || lowerText.includes("outlier") || lowerText.includes("unusual") || lowerText.includes("spike") || lowerText.includes("volatil")) {
    category = "anomaly";
  } else if (lowerText.includes("missing") || lowerText.includes("null") || lowerText.includes("duplicate") || lowerText.includes("data quality") || lowerText.includes("empty")) {
    category = "quality";
  }

  // Determine importance
  let importance: "high" | "medium" | "low" = "medium";
  if (lowerText.includes("significant") || lowerText.includes("major") || lowerText.includes("critical") || lowerText.includes("important") || lowerText.includes("key")) {
    importance = "high";
  } else if (lowerText.includes("minor") || lowerText.includes("slight") || lowerText.includes("small")) {
    importance = "low";
  }

  // Generate contextual "why it matters"
  let whyItMatters = "";
  if (category === "trend") {
    whyItMatters = "Understanding trends helps forecast future patterns and inform strategic planning.";
  } else if (category === "anomaly") {
    whyItMatters = "Anomalies may indicate data entry errors, exceptional events, or areas requiring investigation.";
  } else if (category === "quality") {
    whyItMatters = "Data quality issues can affect the reliability of your analysis and should be addressed.";
  } else {
    whyItMatters = "This finding highlights a notable pattern in your data worth considering in decision-making.";
  }

  return { category, importance, whyItMatters };
}

// Group insights by category
export function groupInsights(insights: Array<{ text: string; category: string; importance: string; whyItMatters: string }>) {
  const groups: Record<string, typeof insights> = {
    finding: [],
    trend: [],
    anomaly: [],
    quality: [],
  };

  insights.forEach(insight => {
    groups[insight.category].push(insight);
  });

  // Sort each group by importance
  const importanceOrder = { high: 0, medium: 1, low: 2 };
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => 
      (importanceOrder[a.importance as keyof typeof importanceOrder] || 1) - 
      (importanceOrder[b.importance as keyof typeof importanceOrder] || 1)
    );
  });

  return groups;
}
