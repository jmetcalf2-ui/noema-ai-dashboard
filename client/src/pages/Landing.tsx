import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="text-sm font-medium">Noema</span>
          <a href="/api/login">
            <Button variant="ghost" size="sm" data-testid="button-login">
              Log in
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-5">
          <h1 className="text-xl font-medium">
            Analyze your data with AI
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload spreadsheets and get insights, visualizations, and summaries automatically.
          </p>
          <a href="/api/login">
            <Button data-testid="button-get-started">
              Get started
            </Button>
          </a>
        </div>
      </main>

      <footer className="border-t py-4">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-muted-foreground">
          Noema
        </div>
      </footer>
    </div>
  );
}
