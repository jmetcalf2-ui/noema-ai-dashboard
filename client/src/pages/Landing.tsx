import { Button } from "@/components/ui/button";
import { Sparkles, FileSpreadsheet, BarChart3, Brain, Shield, Zap } from "lucide-react";
import AnimatedTextCycle from "@/components/AnimatedTextCycle";

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

  const researchWords = [
    "research",
    "analysis",
    "discovery",
    "insights",
    "decisions",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <span className="text-[18px] font-semibold tracking-tight text-foreground text-left">Noema</span>
          <a href="/api/login">
            <Button variant="ghost" size="sm" data-testid="button-login">
              Log in
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1 px-6 py-16">
        <div className="max-w-5xl mx-auto space-y-20">
          
          <section className="text-center space-y-8 pt-8">
            <div className="space-y-5">
              <h1 className="text-4xl md:text-5xl font-medium text-foreground leading-tight">
                AI-powered{" "}
                <AnimatedTextCycle 
                  words={researchWords} 
                  interval={3000}
                  className="text-primary"
                />
                <br />
                <span className="text-muted-foreground">for your data</span>
              </h1>
              <p className="text-muted-foreground text-[17px] max-w-xl mx-auto leading-relaxed">
                Upload any spreadsheet and get professional charts, actionable insights, and executive summaries in seconds. No coding required.
              </p>
            </div>
            
            <a href="/api/login" data-testid="link-get-started">
              <Button size="lg" data-testid="button-get-started">
                Get started free
              </Button>
            </a>

            <div className="flex items-center justify-center gap-8 pt-4">
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
          </section>

          <section className="border-t pt-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-medium text-foreground mb-3">Why Noema?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Transform raw data into actionable intelligence with our AI-powered platform
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-[15px] font-medium text-foreground">AI-First Analysis</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Our models automatically detect patterns, anomalies, and trends that would take analysts hours to uncover manually.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-[15px] font-medium text-foreground">Instant Results</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Upload your data and receive comprehensive analysis in seconds, not days. Charts, insights, and summaries generated automatically.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-[15px] font-medium text-foreground">Secure & Private</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Your data is processed securely and never used for AI training. Enterprise-grade security for peace of mind.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-medium text-foreground mb-3">About Noema</h2>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6 text-center">
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Noema is an AI-powered data analysis platform built for researchers, analysts, and decision-makers who need to extract meaningful insights from complex datasets quickly.
              </p>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Our platform combines advanced machine learning with intuitive visualization tools, enabling anyone to perform sophisticated data analysis without programming skills. Whether you're exploring sales trends, research data, or operational metrics, Noema transforms your spreadsheets into clear, actionable intelligence.
              </p>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                With features like AI chat for data exploration, custom chart building, and cross-dataset project analysis, Noema empowers teams to make data-driven decisions faster than ever before.
              </p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[14px] font-medium text-foreground">Noema</span>
            <p className="text-[12px] text-muted-foreground">
              AI-powered data analysis for modern research
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
