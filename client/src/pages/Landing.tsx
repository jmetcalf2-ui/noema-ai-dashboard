import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <span className="text-background font-bold font-mono">N</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Noema</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="/api/login" className="text-foreground hover:opacity-80 transition-opacity">Log In</a>
          </nav>
          <div className="flex items-center gap-4">
             <a href="/api/login">
               <Button>Get Started</Button>
             </a>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32">
        {/* Hero */}
        <section className="container mx-auto px-6 text-center max-w-4xl space-y-8">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-secondary/50">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Now available in beta
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            Turn data into <br/> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
              actionable intelligence
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Noema uses advanced AI to analyze your spreadsheets, discover hidden patterns, and generate professional visualizations in seconds.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <a href="/api/login">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Analyzing Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              View Demo
            </Button>
          </div>

          {/* Abstract UI representation */}
          <div className="mt-20 relative rounded-xl border bg-card/50 shadow-2xl overflow-hidden aspect-[16/9] max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-transparent"></div>
            {/* Mock UI Elements */}
            <div className="absolute top-0 left-0 right-0 h-12 border-b bg-background/80 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            <div className="p-12 pt-20 grid grid-cols-3 gap-6 h-full">
               <div className="col-span-2 space-y-4">
                 <div className="h-8 w-1/3 bg-muted rounded-md animate-pulse"></div>
                 <div className="h-64 bg-muted/50 rounded-lg animate-pulse"></div>
               </div>
               <div className="space-y-4">
                  <div className="h-32 bg-muted/50 rounded-lg animate-pulse"></div>
                  <div className="h-32 bg-muted/50 rounded-lg animate-pulse"></div>
               </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-6 py-32">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Zap,
                title: "Instant Insights",
                desc: "Upload CSV or Excel files and extract key trends immediately without complex configuration."
              },
              {
                icon: BarChart2,
                title: "Smart Visualization",
                desc: "Automatically selects the best charts to represent your data distribution and relationships."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                desc: "Enterprise-grade security ensures your sensitive business data remains protected."
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <footer className="border-t py-12 bg-secondary/20">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Noema Analytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
