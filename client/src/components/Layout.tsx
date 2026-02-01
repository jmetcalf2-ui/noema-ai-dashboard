import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  PieChart, 
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If not logged in, just render children (likely the landing page)
  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/files", label: "Files", icon: FileText },
    { href: "/analyses", label: "Analyses", icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card/50 backdrop-blur-sm fixed h-full z-30">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-mono">N</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">Noema</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                  location === item.href || location.startsWith(`${item.href}/`)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium shrink-0">
              {user.firstName?.[0] || user.username?.[0] || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-medium text-foreground">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.username}
              </p>
              <p className="truncate text-xs opacity-70">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-background/80 backdrop-blur border-b p-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold font-mono">N</span>
            </div>
            <span className="font-semibold text-xl">Noema</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background pt-20 px-4 animate-in slide-in-from-top-10 fade-in duration-200">
           <nav className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-md text-lg font-medium border-b"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            ))}
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-lg font-medium text-destructive mt-8"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "pt-20 md:pt-0 md:pl-64" // Offset for sidebar/header
      )}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 animate-in fade-in duration-500 slide-in-from-bottom-2">
          {children}
        </div>
      </main>
    </div>
  );
}
