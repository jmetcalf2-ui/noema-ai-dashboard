import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useAnalyses } from "@/hooks/use-analyses";
import { Home, BarChart3, FolderOpen } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    "--sidebar-width": "14.5rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="h-14 flex items-center justify-start px-4 border-b border-sidebar-border">
            <Link href="/" data-testid="link-logo" className="pl-2">
              <span className="text-[18px] font-semibold tracking-tight text-foreground">Noema</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
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
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {recentAnalyses.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="px-3 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                  Recent
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentAnalyses.map((analysis: any) => {
                      const isActive = location === `/analyses/${analysis.id}`;
                      const title = analysis.title.replace("Analysis: ", "");
                      return (
                        <SidebarMenuItem key={analysis.id}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              href={`/analyses/${analysis.id}`}
                              className="truncate"
                              data-testid={`recent-analysis-${analysis.id}`}
                            >
                              <span className="truncate text-[13px]">{title}</span>
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

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-[11px] font-medium bg-secondary text-muted-foreground">
                    {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] truncate text-sidebar-foreground">
                  {user.firstName || "User"}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                Sign out
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-14 border-b flex items-center gap-3 px-4 lg:hidden">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Link href="/">
              <span className="text-[17px] font-semibold tracking-tight text-foreground">Noema</span>
            </Link>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
