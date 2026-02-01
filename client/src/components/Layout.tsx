import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useAnalyses } from "@/hooks/use-analyses";
import { Menu, X, Home, BarChart3, FolderOpen, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: analyses } = useAnalyses();

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/analyses", label: "Analyses", icon: BarChart3 },
    { href: "/files", label: "Files", icon: FolderOpen },
  ];

  const recentAnalyses = (analyses || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 sticky top-0 h-screen">
        <div className="h-14 border-b flex items-center px-5">
          <Link href="/" className="font-semibold text-lg tracking-tight">
            Noema
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          {recentAnalyses.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 px-3 mb-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent
                </span>
              </div>
              <div className="space-y-0.5">
                {recentAnalyses.map((analysis: any) => (
                  <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm truncate transition-colors",
                        location === `/analyses/${analysis.id}`
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )}
                      data-testid={`recent-analysis-${analysis.id}`}
                    >
                      {analysis.title.replace("Analysis: ", "")}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                {user.firstName?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              data-testid="button-logout"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 h-14">
          <div className="px-4 h-full flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              Noema
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="border-t px-4 py-4 space-y-2 bg-background">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center gap-3 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
              <button
                onClick={() => logout()}
                className="text-sm text-muted-foreground py-2 w-full text-left"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
