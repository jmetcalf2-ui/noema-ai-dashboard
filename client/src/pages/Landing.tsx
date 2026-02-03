import { Button } from "@/components/ui/button";
import { Sparkles, FileSpreadsheet, BarChart3, Brain, Shield, Zap, ArrowRight, Layers, MessageSquare } from "lucide-react";
import AnimatedTextCycle from "@/components/AnimatedTextCycle";

export default function Landing() {
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Upload Any Data",
      description: "CSV, Excel, and spreadsheets"
    },
    {
      icon: BarChart3,
      title: "Auto Visualizations",
      description: "Professional charts instantly"
    },
    {
      icon: Sparkles,
      title: "AI Insights",
      description: "Hidden patterns revealed"
    },
  ];

  const researchWords = [
    "research",
    "analysis",
    "discovery",
    "insights",
    "decisions",
  ];

  const capabilities = [
    {
      icon: Brain,
      title: "AI-First Analysis",
      description: "Our models automatically detect patterns, anomalies, and trends that would take analysts hours to uncover manually."
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Upload your data and receive comprehensive analysis in seconds, not days. Charts, insights, and summaries generated automatically."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is processed securely and never used for AI training. Enterprise-grade security for complete peace of mind."
    },
    {
      icon: Layers,
      title: "Cross-Dataset Projects",
      description: "Group multiple analyses into projects and discover insights that span across datasets—patterns invisible in isolation."
    },
    {
      icon: MessageSquare,
      title: "AI Chat Interface",
      description: "Ask questions about your data in natural language. Get instant answers with source citations and confidence levels."
    },
    {
      icon: BarChart3,
      title: "Custom Chart Builder",
      description: "Create exactly the visualizations you need with our intuitive chart builder. Export in multiple formats."
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <a href="/" className="text-[20px] font-semibold tracking-tight text-foreground hover:opacity-80 transition-opacity">
              Noema Research
            </a>
            <nav className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-features"
              >
                Features
              </a>
              <a 
                href="#capabilities" 
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-capabilities"
              >
                Capabilities
              </a>
              <a 
                href="#about" 
                className="text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-about"
              >
                About
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/login">
              <Button variant="ghost" size="sm" data-testid="button-login">
                Log in
              </Button>
            </a>
            <a href="/api/login" className="hidden sm:block">
              <Button size="sm" data-testid="button-signup">
                Sign up
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        <section id="features" className="px-8 pt-24 pb-28 scroll-mt-20">
          <div className="max-w-6xl mx-auto text-center space-y-10">
            <div className="space-y-6">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Data Analysis Platform
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-foreground leading-[1.1] tracking-tight">
                AI-powered{" "}
                <AnimatedTextCycle 
                  words={researchWords} 
                  interval={3000}
                  className="text-primary"
                />
                <br />
                <span className="text-muted-foreground">for your data</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Upload any spreadsheet and get professional charts, actionable insights, and executive summaries in seconds. No coding required.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a href="/api/login" data-testid="link-get-started">
                <Button size="lg" className="h-12 px-8 text-[15px]" data-testid="button-get-started">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-12 pt-10">
              {features.map((feature, i) => (
                <div key={i} className="text-center group">
                  <div className="w-12 h-12 rounded-xl bg-secondary mx-auto mb-3 flex items-center justify-center transition-colors group-hover:bg-secondary/80">
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[14px] font-medium text-foreground mb-1">{feature.title}</p>
                  <p className="text-[13px] text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="px-8 py-24 bg-secondary/30 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase mb-3">
                Capabilities
              </p>
              <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
                Everything you need for data analysis
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                From upload to insight in seconds, with powerful tools at every step
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {capabilities.map((cap, i) => (
                <div key={i} className="bg-background rounded-xl p-6 border space-y-4">
                  <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                    <cap.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-[16px] font-medium text-foreground">{cap.title}</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="px-8 py-24 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase mb-3">
                About
              </p>
              <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-8">
                Built for modern research
              </h2>
              
              <div className="space-y-6 text-left md:text-center">
                <p className="text-[16px] text-muted-foreground leading-relaxed">
                  Noema is an AI-powered data analysis platform built for researchers, analysts, and decision-makers who need to extract meaningful insights from complex datasets quickly.
                </p>
                <p className="text-[16px] text-muted-foreground leading-relaxed">
                  Our platform combines advanced machine learning with intuitive visualization tools, enabling anyone to perform sophisticated data analysis without programming skills. Whether you're exploring sales trends, research data, or operational metrics, Noema transforms your spreadsheets into clear, actionable intelligence.
                </p>
                <p className="text-[16px] text-muted-foreground leading-relaxed">
                  With features like AI chat for data exploration, custom chart building, and cross-dataset project analysis, Noema empowers teams to make data-driven decisions faster than ever before.
                </p>
              </div>

              <div className="mt-12">
                <a href="/api/login" data-testid="link-get-started-bottom">
                  <Button size="lg" className="h-12 px-8 text-[15px]">
                    Start analyzing your data
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t py-10 bg-secondary/20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-semibold text-foreground">Noema Research</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-[14px] text-muted-foreground">AI-powered data analysis</span>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Transform your data into actionable insights
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
