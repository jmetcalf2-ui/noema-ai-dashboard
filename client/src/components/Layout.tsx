import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useAnalyses } from "@/hooks/use-analyses";
import { Home, BarChart3, FolderOpen, Clock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
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

  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="h-12 flex items-center px-4 border-b">
            <Link href="/" className="text-sm font-medium tracking-tight">
              Noema
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive =
                      location === item.href ||
                      (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href} data-testid={`nav-${item.label.toLowerCase()}`}>
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {recentAnalyses.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs text-muted-foreground">
                  Recent
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentAnalyses.map((analysis: any) => {
                      const isActive = location === `/analyses/${analysis.id}`;
                      return (
                        <SidebarMenuItem key={analysis.id}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              href={`/analyses/${analysis.id}`}
                              className="truncate"
                              data-testid={`recent-analysis-${analysis.id}`}
                            >
                              <span className="truncate text-sm">
                                {analysis.title.replace("Analysis: ", "")}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground shrink-0">
                  {user.firstName?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    {user.firstName || "User"}
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
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-12 border-b flex items-center px-4 lg:hidden">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Link href="/" className="text-sm font-medium ml-3">
              Noema
            </Link>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
