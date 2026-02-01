import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-medium text-lg">Noema</span>
          <a href="/api/login">
            <Button variant="ghost" size="sm" data-testid="button-login">
              Log in
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-3xl font-medium tracking-tight">
            Analyze your data with AI
          </h1>
          <p className="text-muted-foreground">
            Upload spreadsheets and get instant insights, visualizations, and summaries.
          </p>
          <a href="/api/login">
            <Button size="lg" data-testid="button-get-started">
              Get started
            </Button>
          </a>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          Noema
        </div>
      </footer>
    </div>
  );
}
