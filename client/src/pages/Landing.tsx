import { Button } from "@/components/ui/button";
import { Sparkles, FileSpreadsheet, BarChart3 } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Upload Any Data",
      description: "CSV, Excel, and more"
    },
    {
      icon: BarChart3,
      title: "Auto Visualizations",
      description: "Charts generated instantly"
    },
    {
      icon: Sparkles,
      title: "AI Insights",
      description: "Patterns discovered for you"
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[18px] font-semibold tracking-tight text-foreground">Noema</span>
          <a href="/api/login">
            <Button variant="ghost" size="sm" data-testid="button-login">
              Log in
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-medium text-foreground">
              Understand your data <br />in seconds
            </h1>
            <p className="text-muted-foreground text-[16px] max-w-md mx-auto leading-relaxed">
              Upload any spreadsheet and get AI-powered charts, insights, and summaries automatically.
            </p>
          </div>
          
          <a href="/api/login" data-testid="link-get-started">
            <Button size="lg" data-testid="button-get-started">
              Get started free
            </Button>
          </a>

          <div className="flex items-center justify-center gap-8 pt-6">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-secondary mx-auto mb-2 flex items-center justify-center">
                  <feature.icon className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium text-foreground">{feature.title}</p>
                <p className="text-[12px] text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-[12px] text-muted-foreground">
          Noema — AI-powered data analysis
        </div>
      </footer>
    </div>
  );
}
