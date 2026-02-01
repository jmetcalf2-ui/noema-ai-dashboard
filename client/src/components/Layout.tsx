import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/analyses", label: "Analyses" },
    { href: "/files", label: "Files" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-medium text-lg">
              Noema
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      location === item.href || (item.href !== "/" && location.startsWith(item.href))
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <button
              onClick={() => logout()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-logout"
            >
              Sign out
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-4 bg-background">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className="text-sm py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
